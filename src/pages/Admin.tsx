import { useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/RoleBadge";
import { deriveBadge, type PublicBadge } from "@/lib/staff";
import { Loader2, Save } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

type TeamMember = {
  userId: Id<"users">;
  name: string | null;
  nickname: string | null;
  email: string | null;
  department: string | null;
  position: string | null;
  isStaff: boolean;
  isAdmin: boolean;
  badge: PublicBadge | null;
  memberStatus: "volunteer-thank-you" | null;
  isBanned: boolean;
};

type TeamRowProps = {
  member: TeamMember;
  busy: boolean;
  saved: boolean;
  onSave: (
    member: TeamMember,
    department: string,
    position: string,
    badge: PublicBadge,
    memberStatus: "none" | "volunteer-thank-you",
    banned: boolean
  ) => Promise<void>;
};

const DEPARTMENTS = [
  "Executive Leadership",
  "Engineering & Software Development",
  "Game Design & Systems Architecture",
  "Creative Content & Art Production",
  "Community Operations & Player Engagement",
  "Trust & Safety / Moderation",
  "Data Science, Analytics & Research",
  "AI & Procedural Systems",
  "Operations & Internal Systems",
  "Marketing & Growth",
  "Business Development & Strategy",
];

const POSITIONS = [
  "Chief Executive Officer",
  "Chief Technology Officer",
  "Chief Design Officer",
  "Chief Marketing Officer",
  "Chief People Officer",
  "Chief Finance Officer",
  "Chief Legal Officer",
  "Head of Community",
  "Lead Game Designer",
  "Lead Programmer",
  "Lead Artist",
  "Senior Developer",
  "Developer",
  "Producer",
  "Community Manager",
  "Customer Support Lead",
  "Senior QA Engineer",
  "Data Analyst",
  "AI Researcher",
  "AI Engineer",
  "Art Director",
  "Technical Writer",
];

function TeamPanel() {
  const me = useQuery(api.staff.me);
  const { results: members, status, loadMore } = usePaginatedQuery(api.staff.listMembers, me?.isAdmin ? {} : "skip", { initialNumItems: 50 });
  const setAssignment = useMutation(api.staff.setAssignment);
  const setMemberStatus = useMutation(api.staff.setMemberStatus);
  const setBan = useMutation(api.security.setBan);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function save(
    member: TeamMember,
    department: string,
    position: string,
    badge: PublicBadge,
    memberStatus: "none" | "volunteer-thank-you",
    banned: boolean
  ) {
    setError("");
    setSavedId(null);
    setBusyId(member.userId);
    try {
      if (member.isAdmin) {
        await setMemberStatus({ userId: member.userId, memberStatus });
        setSavedId(member.userId);
        return;
      }
      await setAssignment({ userId: member.userId, department, position, badge, memberStatus });
      if (banned !== member.isBanned) {
        await setBan({ userId: member.userId, banned, reason: "Staff access changed by an administrator" });
      }
      setSavedId(member.userId);
    } catch {
      setError("Could not save the assignment. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (me === undefined || (me?.isAdmin && status === "LoadingFirstPage")) {
    return <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-slate-400" /></div>;
  }
  if (!me?.isAdmin) {
    return <p className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm">Verified administrator access is required to view the company directory.</p>;
  }
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-slate-600">Private directory of every staff and admin account, including volunteers. Only verified administrators can view this roster or make access changes.</p>
      <p className="text-xs text-slate-500">{members.length} accounts loaded{status === "Exhausted" ? " · all accounts shown" : " · load more below to see the rest"}</p>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <datalist id="ow-departments">{DEPARTMENTS.map((item) => <option key={item} value={item} />)}</datalist>
      <datalist id="ow-positions">{POSITIONS.map((item) => <option key={item} value={item} />)}</datalist>
      {members.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm">No accounts found.</p>
      ) : (
        members.map((member) => (
          <TeamRow
            key={member.userId}
            member={member}
            busy={busyId === member.userId}
            saved={savedId === member.userId}
            onSave={save}
          />
        ))
      )}
      {status === "CanLoadMore" && <Button variant="outline" onClick={() => loadMore(50)}>Load more accounts</Button>}
      {status === "LoadingMore" && <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-slate-400" /></div>}
    </div>
  );
}

function TeamRow({ member, busy, saved, onSave }: TeamRowProps) {
  const defaultBadge = member.badge ?? deriveBadge(member.department, member.position);
  const [department, setDepartment] = useState(member.department ?? "");
  const [position, setPosition] = useState(member.position ?? "");
  const [badge, setBadge] = useState<"staff" | "dev">(defaultBadge);
  const [memberStatus, setMemberStatus] = useState<"none" | "volunteer-thank-you">(member.memberStatus ?? "none");
  const [banned, setBanned] = useState(member.isBanned);
  const isDirty = member.isAdmin
    ? memberStatus !== (member.memberStatus ?? "none")
    : department !== (member.department ?? "") ||
      position !== (member.position ?? "") ||
      badge !== defaultBadge ||
      memberStatus !== (member.memberStatus ?? "none") ||
      banned !== member.isBanned;
  const active = Boolean(department.trim() || position.trim());

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            {member.nickname || member.name || "Unnamed account"}
            {member.isAdmin ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                Admin
              </span>
            ) : member.isStaff && (
              <RoleBadge badge={member.badge ?? defaultBadge} />
            )}
          </p>
          <p className="text-xs text-slate-500">{member.email || "Email unavailable"}</p>
          <p className="mt-1 text-xs text-slate-600">
            {member.isAdmin ? "Administrator" : member.isStaff ? "Staff member" : "Player account"}
            {member.department ? ` · ${member.department}` : ""}
            {member.position ? ` · ${member.position}` : ""}
            {member.isBanned ? " · access restricted" : ""}
            {member.memberStatus === "volunteer-thank-you" ? " · volunteer · thank-you" : ""}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        {!member.isAdmin && (
          <>
            <div className="space-y-1">
              <Label htmlFor={`dept-${member.userId}`}>Department</Label>
              <Input
                id={`dept-${member.userId}`}
                list="ow-departments"
                maxLength={80}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`position-${member.userId}`}>Position</Label>
              <Input
                id={`position-${member.userId}`}
                list="ow-positions"
                maxLength={100}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Developer"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`badge-${member.userId}`}>Badge</Label>
              <select
                id={`badge-${member.userId}`}
                value={badge}
                onChange={(e) => setBadge(e.target.value as "staff" | "dev")}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="staff">Staff</option>
                <option value="dev">Dev</option>
              </select>
            </div>
          </>
        )}
        {!member.isAdmin && (
          <>
            <div className="space-y-1">
              <Label htmlFor={`member-status-${member.userId}`}>Status</Label>
              <select
                id={`member-status-${member.userId}`}
                value={memberStatus}
                onChange={(e) => setMemberStatus(e.target.value as "none" | "volunteer-thank-you")}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="none">No status</option>
                <option value="volunteer-thank-you">Volunteer</option>
              </select>
            </div>
            {member.isBanned && (
              <div className="space-y-1">
                <Label htmlFor={`member-ban-reason-${member.userId}`}>Ban reason</Label>
                <Input
                  id={`member-ban-reason-${member.userId}`}
                  maxLength={500}
                  value="Staff access updated by an administrator"
                  readOnly
                  placeholder="Why was this person restricted?"
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor={`member-ban-${member.userId}`}>Website access</Label>
              <select
                id={`member-ban-${member.userId}`}
                value={banned ? "banned" : "active"}
                onChange={(e) => setBanned(e.target.value === "banned")}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </>
        )}
      </div>
      {member.isAdmin && (
        <>
          <div className="space-y-1">
            <Label htmlFor={`member-status-${member.userId}`}>Status</Label>
            <select
              id={`member-status-${member.userId}`}
              value={memberStatus}
              onChange={(e) => setMemberStatus(e.target.value as "none" | "volunteer-thank-you")}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="none">No status</option>
              <option value="volunteer-thank-you">Volunteer</option>
            </select>
          </div>
        </>
      )}
      <div className="mt-3 flex items-center gap-3">
        <Button
          size="sm"
          disabled={!isDirty || busy || (!active && !member.isStaff && banned === member.isBanned)}
          onClick={() => void onSave(member, department, position, badge, memberStatus, banned)}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {member.isAdmin ? "Save" : member.isStaff ? "Save" : "Give staff access"}
        </Button>
        {saved && <span className="text-xs text-emerald-700">Saved</span>}
      </div>
    </article>
  );
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">OpenWorlds · Company operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">People directory</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">A private roster for managing staff access, departments, roles, and volunteer recognition. Email addresses are only returned to verified administrators.</p>
        <TeamPanel />
      </section>
    </main>
  );
}
