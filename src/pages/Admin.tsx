import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { loadEnv } from "vite";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/RoleBadge";
import { deriveBadge, type PublicBadge } from "@/lib/staff";
import { Loader2, Save } from "lucide-react";

loadEnv("development", "VITE_");

type TeamMember = {
  userId: Id<"users">;
  name: string | null;
  department: string | null;
  position: string | null;
  isStaff: boolean;
  isAdmin: boolean;
  badge: PublicBadge | null;
  memberStatus: "volunteer-thank-you" | null;
  isBanned: boolean;
  assignedBy: Id<"users"> | null;
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
  assignedBy: Id<"users"> | null;
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

function TeamPanel({ members }: { members: TeamMember[] | null | undefined }) {
  const { user } = useAuth();
  const setAssignment = useMutation(api.staff.setAssignment);
  const setMemberStatus = useMutation(api.staff.setMemberStatus);
  const setBan = useMutation(api.security.setBan);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [assignedBy, setAssignedBy] = useState<Id<"users"> | null>(user?.userId ?? null);
  const [banReason, setBanReason] = useState<string>(user?.userId ?? "");

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
        return;
      }
      if (member.assignedBy !== assignedBy) {
        setError("Current ticket is not assigned to the same admin.");
        return;
      }
      await setAssignment({ userId: member.userId, department, position, badge, memberStatus });
      if (banned !== member.isBanned) {
        await setBan({ userId: member.userId, banned, reason: banReason || "Staff moderation" });
      }
      setSavedId(member.userId);
    } catch {
      setError("Could not save the assignment. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (members === undefined) {
    return <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-slate-400" /></div>;
  }
  if (members === null) {
    return <p className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm">Admin access required.</p>;
  }
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-slate-600">Assign a department and position to grant staff portal access. Clear both fields to remove it.</p>
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
            assignedBy={assignedBy ?? member.assignedBy ?? null}
          />
        ))
      )}
    </div>
  );
}

function TeamRow({ member, busy, saved, onSave, assignedBy }: TeamRowProps) {
  const defaultBadge = member.badge ?? deriveBadge(member.department, member.position);
  const [department, setDepartment] = useState(member.department ?? "");
  const [position, setPosition] = useState(member.position ?? "");
  const [badge, setBadge] = useState<"staff" | "dev">(defaultBadge);
  const [memberStatus, setMemberStatus] = useState<"none" | "volunteer-thank-you">(member.memberStatus ?? "none");
  const [assignedById, setAssignedById] = useState<string | null>(member.assignedBy ?? null);
  const [banReasonField, setBanReasonField] = useState<string>(member.isBanned ? (member.assignedBy ?? "") : "");
  const [banned, setBanned] = useState(member.isBanned);
  const isDirty = member.isAdmin
    ? memberStatus !== (member.memberStatus ?? "none") || assignedById !== (member.assignedBy ?? null)
    : department !== (member.department ?? "") ||
      position !== (member.position ?? "") ||
      badge !== defaultBadge ||
      memberStatus !== (member.memberStatus ?? "none") ||
      banned !== member.isBanned ||
      banReasonField !== "";
  const active = Boolean(department.trim() || position.trim());

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            {member.name || "Company account"}
            {member.isAdmin ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                Admin
              </span>
            ) : member.isStaff && (
              <RoleBadge badge={member.badge ?? defaultBadge} />
            )}
          </p>
          <p className="text-xs text-slate-500">
            {member.isAdmin ? "Admin access protected" : member.isStaff ? "Staff access on" : "Staff access off"}
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
                  value={banReasonField}
                  onChange={(e) => setBanReasonField(e.target.value)}
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
          <div className="space-y-1">
            <Label htmlFor={`assignee-${member.userId}`}>Assigned by</Label>
            <Input
              id={`assignee-${member.userId}`}
              value={assignedById ?? ""}
              readOnly
              aria-readonly="true"
              placeholder="See the admin log"
              className="bg-slate-50"
            />
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
