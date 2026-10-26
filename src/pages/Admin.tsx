import { useEffect, useState } from "react";
import { useAction, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/RoleBadge";
import { deriveBadge, type PublicBadge } from "@/lib/staff";
import { AlertCircle, BadgeCheck, Loader2, Mail, Save, ShieldCheck, Bell, CheckCircle2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
type AdminNotificationRecipientKind = "careers" | "support" | "both";

const ADMIN_NOTIFICATION_CHANNEL_OPTIONS: Array<readonly [AdminNotificationRecipientKind, string]> = [
  ["careers", "Careers only"],
  ["support", "Support only"],
  ["both", "Both"],
];

const ADMIN_NOTIFICATION_RECIPIENT_KINDS: Array<readonly [AdminNotificationRecipientKind, string]> = [
  ["careers", "Career applications and careers questions only"],
  ["support", "Support tickets only"],
  ["both", "Career applications and support tickets"],
];


type TeamMember = {
  userId: Id<"users">;
  name: string | null;
  nickname: string | null;
  email: string | null;
  department: string | null;
  position: string | null;
  isStaff: boolean;
  isAdmin: boolean;
  role: string | null;
  badge: PublicBadge | null;
  memberStatus: "volunteer-thank-you" | null;
  isBanned: boolean;
  isOfficialCreator: boolean;
  playerLogin: string | null;
  image: string | null;
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
    banned: boolean,
    accessLevel: "staff" | "admin"
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
  const rosterStatus = useQuery(api.adminRoster.rosterStatus);
  const requestCode = useAction(api.adminRoster.requestCode);
  const verifyCode = useMutation(api.adminRoster.verifyCode);
  const requestPermissionCode = useAction(api.adminRoster.requestPermissionCode);
  const verifyPermissionCode = useMutation(api.adminRoster.verifyPermissionCode);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationClock, setVerificationClock] = useState(Date.now());
  const [permissionCode, setPermissionCode] = useState("");
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [permissionMessage, setPermissionMessage] = useState("");
  const [permissionClock, setPermissionClock] = useState(Date.now());
  useEffect(() => {
    const verifiedUntil = rosterStatus?.verifiedUntil ?? 0;
    if (!verifiedUntil || verifiedUntil <= Date.now()) return;
    const timer = window.setTimeout(() => setVerificationClock(Date.now()), verifiedUntil - Date.now());
    return () => window.clearTimeout(timer);
  }, [rosterStatus?.verifiedUntil]);
  useEffect(() => {
    const verifiedUntil = rosterStatus?.permissionVerifiedUntil ?? 0;
    if (!verifiedUntil || verifiedUntil <= Date.now()) return;
    const timer = window.setTimeout(() => setPermissionClock(Date.now()), verifiedUntil - Date.now());
    return () => window.clearTimeout(timer);
  }, [rosterStatus?.permissionVerifiedUntil]);
  const isRosterVerified = Boolean(rosterStatus?.isAdmin && rosterStatus.verifiedUntil > verificationClock);
  const isPermissionVerified = Boolean(rosterStatus?.isAdmin && (rosterStatus.permissionVerifiedUntil ?? 0) > permissionClock);
  const { results: members, status, loadMore } = usePaginatedQuery(api.staff.listMembers, isRosterVerified ? {} : "skip", { initialNumItems: 50 });
  const setAssignment = useMutation(api.staff.setAssignment);
  const setMemberStatus = useMutation(api.staff.setMemberStatus);
  const setBan = useMutation(api.security.setBan);
  const setOfficialCreator = useMutation(api.staff.setOfficialCreator);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function save(
    member: TeamMember,
    department: string,
    position: string,
    badge: PublicBadge,
    memberStatus: "none" | "volunteer-thank-you",
    banned: boolean,
    accessLevel: "staff" | "admin"
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
      await setAssignment({ userId: member.userId, department, position, badge, accessLevel, memberStatus });
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

  async function sendRosterCode() {
    setVerificationBusy(true);
    setVerificationError("");
    setVerificationMessage("");
    try {
      await requestCode({});
      setVerificationMessage("A six-digit verification code was sent to careers@openworlds.dk. It expires in 10 minutes.");
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : "Could not send the verification code.");
    } finally {
      setVerificationBusy(false);
    }
  }

  async function sendPermissionCode() {
    setPermissionBusy(true);
    setPermissionError("");
    setPermissionMessage("");
    try {
      await requestPermissionCode({});
      setPermissionMessage("A six-digit code was sent to support@openworlds.dk. It expires in 10 minutes.");
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : "Could not send the verification code.");
    } finally {
      setPermissionBusy(false);
    }
  }

  async function verifyPermission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPermissionBusy(true);
    setPermissionError("");
    setPermissionMessage("");
    try {
      const result = await verifyPermissionCode({ code: permissionCode });
      if (!result.ok) throw new Error(result.message);
      setPermissionCode("");
      setPermissionMessage("Verified. Staff access changes are enabled for 15 minutes.");
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : "Could not verify the code.");
    } finally {
      setPermissionBusy(false);
    }
  }

  async function verifyRosterCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerificationBusy(true);
    setVerificationError("");
    setVerificationMessage("");
    try {
      const result = await verifyCode({ code: verificationCode });
      if (!result.ok) throw new Error(result.message);
      setVerificationCode("");
      setVerificationMessage("Verified. The account directory will remain available for 15 minutes.");
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : "Could not verify the code.");
    } finally {
      setVerificationBusy(false);
    }
  }

  if (me === undefined || (isRosterVerified && status === "LoadingFirstPage")) {
    return <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-slate-400" /></div>;
  }
  if (!me?.isAdmin) {
    return <p className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm">Verified administrator access is required to view the company directory.</p>;
  }
  if (!isRosterVerified) {
    return (
      <section className="mt-6 max-w-2xl rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#0066cc]"><ShieldCheck className="size-5" /></span><div><h2 className="font-semibold">Verify access to the account directory</h2><p className="mt-1 text-sm leading-6 text-slate-600">For additional protection, enter a one-time code sent to careers@openworlds.dk before viewing account details. Verification lasts 15 minutes.</p></div></div>
        <Button className="mt-5" variant="outline" onClick={() => void sendRosterCode()} disabled={verificationBusy}><Mail className="size-4" />{verificationBusy ? "Sending code..." : "Send code to Careers"}</Button>
        <form onSubmit={(event) => void verifyRosterCode(event)} className="mt-4 flex flex-wrap items-end gap-3"><div className="w-full max-w-xs space-y-2"><Label htmlFor="admin-roster-code">6-digit verification code</Label><Input id="admin-roster-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></div><Button type="submit" disabled={verificationBusy || verificationCode.length !== 6}><ShieldCheck className="size-4" />{verificationBusy ? "Verifying..." : "Verify"}</Button></form>
        {verificationMessage && <p role="status" className="mt-3 text-sm text-slate-600">{verificationMessage}</p>}
        {verificationError && <p role="alert" className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="size-4" />{verificationError}</p>}
      </section>
    );
  }
  return (
    <div className="mt-6 space-y-3">
      <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-800"><ShieldCheck className="size-5" /></span><div><h2 className="font-semibold">Verify staff-access changes</h2><p className="mt-1 text-sm leading-6 text-slate-600">A separate one-time code from support@openworlds.dk is required before changing staff access or assigning/removing an Official Content Creator badge. Verification lasts 15 minutes.</p></div></div>
        <Button className="mt-5" variant="outline" onClick={() => void sendPermissionCode()} disabled={permissionBusy || isPermissionVerified}><Mail className="size-4" />{isPermissionVerified ? "Access changes verified" : permissionBusy ? "Sending code..." : "Send code to Support"}</Button>
        {!isPermissionVerified && <form onSubmit={(event) => void verifyPermission(event)} className="mt-4 flex flex-wrap items-end gap-3"><div className="w-full max-w-xs space-y-2"><Label htmlFor="admin-permission-code">6-digit Support code</Label><Input id="admin-permission-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={permissionCode} onChange={(event) => setPermissionCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></div><Button type="submit" disabled={permissionBusy || permissionCode.length !== 6}><ShieldCheck className="size-4" />{permissionBusy ? "Verifying..." : "Verify access"}</Button></form>}
        {permissionMessage && <p role="status" className="mt-3 text-sm text-slate-600">{permissionMessage}</p>}
        {permissionError && <p role="alert" className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="size-4" />{permissionError}</p>}
      </section>
      <CreatorRosterPanel canChange={isPermissionVerified} />
      <p className="text-sm text-slate-600">Private directory of all non-anonymous accounts, including players, staff, admins, and volunteers. Viewing requires a Careers code; changing staff assignments also requires a Support code.</p>
      <p className="text-xs text-slate-500">{members.length} accounts loaded{status === "Exhausted" ? " - all accounts shown" : " - load more below to see the rest"}</p>
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
            onSetOfficialCreator={async (userId, isOfficialCreator) => {
              setError("");
              setBusyId(userId);
              try {
                await setOfficialCreator({ userId, isOfficialCreator });
                setSavedId(userId);
              } catch (error) {
                setError(error instanceof Error ? error.message : "Could not update Official Content Creator status.");
              } finally {
                setBusyId(null);
              }
            }}
            canChangeAccess={isPermissionVerified}
          />
        ))
      )}
      {status === "CanLoadMore" && <Button variant="outline" onClick={() => loadMore(50)}>Load more accounts</Button>}
      {status === "LoadingMore" && <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-slate-400" /></div>}
    </div>
  );
}

function TeamRow({ member, busy, saved, onSave, onSetOfficialCreator, canChangeAccess }: TeamRowProps & { canChangeAccess: boolean; onSetOfficialCreator: (userId: Id<"users">, isOfficialCreator: boolean) => Promise<void> }) {
  const defaultBadge = member.badge ?? deriveBadge(member.department, member.position);
  const [department, setDepartment] = useState(member.department ?? "");
  const [position, setPosition] = useState(member.position ?? "");
  const [badge, setBadge] = useState<"staff" | "dev">(defaultBadge);
  const [memberStatus, setMemberStatus] = useState<"none" | "volunteer-thank-you">(member.memberStatus ?? "none");
  const [accessLevel, setAccessLevel] = useState<"staff" | "admin">(member.isAdmin ? "admin" : "staff");
  const [banned, setBanned] = useState(member.isBanned);
  const isDirty = member.isAdmin
    ? memberStatus !== (member.memberStatus ?? "none")
    : department !== (member.department ?? "") ||
      position !== (member.position ?? "") ||
      badge !== defaultBadge ||
      memberStatus !== (member.memberStatus ?? "none") ||
      accessLevel !== "staff" ||
      banned !== member.isBanned;
  const active = Boolean(department.trim() || position.trim());
  const canSave = member.isAdmin ? canChangeAccess && isDirty : isDirty && canChangeAccess && (active || member.isStaff || banned !== member.isBanned);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            {member.nickname || member.name || member.playerLogin || "Unnamed account"}
            {member.isAdmin ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                Admin
              </span>
            ) : member.isStaff && (
              <RoleBadge badge={member.badge ?? defaultBadge} />
            )}
          </p>
          <p className="text-xs text-slate-500">{member.email || "Email unavailable"}</p>
          {member.playerLogin && <p className="mt-1 text-xs text-slate-600">OpenWorlds username: <span className="font-medium">{member.playerLogin}</span></p>}
          <p className="mt-1 text-xs text-slate-600">
            {member.isAdmin ? "Administrator" : member.isStaff ? "Staff member" : "Player account"}
            {member.department ? ` - ${member.department}` : ""}
            {member.position ? ` - ${member.position}` : ""}
            {member.isBanned ? " - access restricted" : ""}
            {member.memberStatus === "volunteer-thank-you" ? " - volunteer - thank-you" : ""}
          </p>
        </div>
      </div>
      {member.role === "user" && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <span className="text-sm font-medium">Official Content Creator</span>
          {member.isOfficialCreator && <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800"><BadgeCheck className="size-3.5" /> Verified creator</span>}
          <Button
            type="button"
            size="sm"
            variant={member.isOfficialCreator ? "outline" : "default"}
            disabled={!canChangeAccess || busy || !member.playerLogin}
            onClick={() => void onSetOfficialCreator(member.userId, !member.isOfficialCreator)}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {member.isOfficialCreator ? "Remove verified badge" : "Assign verified badge"}
          </Button>
          {!member.playerLogin && <span className="text-xs text-slate-500">No OpenWorlds username on this account</span>}
          {!canChangeAccess && <span className="text-xs text-slate-500">Verify Support access to change the creator badge</span>}
        </div>
      )}
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
            <div className="space-y-1">
              <Label htmlFor={`access-level-${member.userId}`}>Permission</Label>
              <select id={`access-level-${member.userId}`} value={accessLevel} onChange={(event) => setAccessLevel(event.target.value as "staff" | "admin")} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="staff">Staff</option>
                <option value="admin" disabled={!canChangeAccess}>Admin</option>
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
        <div className="mt-3 max-w-xs space-y-1">
          <Label htmlFor={`admin-member-status-${member.userId}`}>Status</Label>
          <select
            id={`admin-member-status-${member.userId}`}
            value={memberStatus}
            onChange={(e) => setMemberStatus(e.target.value as "none" | "volunteer-thank-you")}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="none">No status</option>
            <option value="volunteer-thank-you">Volunteer</option>
          </select>
        </div>
      )}
      <div className="mt-3 flex items-center gap-3">
        <Button
          size="sm"
          disabled={!canSave || busy}
          onClick={() => void onSave(member, department, position, badge, memberStatus, banned, accessLevel)}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {member.isAdmin ? "Save" : accessLevel === "admin" ? "Give admin access" : member.isStaff ? "Save" : "Give staff access"}
        </Button>
        {saved && <span className="text-xs text-emerald-700">Saved</span>}
      </div>
    </article>
  );
}

function CreatorRosterPanel({ canChange }: { canChange: boolean }) {
  const creators = useQuery(api.users.adminOfficialCreators, canChange ? {} : "skip");
  const saveCreator = useMutation(api.users.saveOfficialCreator);
  const removeCreator = useMutation(api.users.removeOfficialCreator);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function addCreator(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await saveCreator({ email, username, displayName, socialPlatform, socialUrl });
      setEmail("");
      setUsername("");
      setDisplayName("");
      setSocialPlatform("");
      setSocialUrl("");
      setMessage(result.linkedToAccount ? "Creator added and matched to the player account; the verified badge is active." : "Creator added to the public roster. The badge will link to the player account when the submitted username or email matches an account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this creator.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCreator(creatorId: Id<"officialCreators">) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await removeCreator({ creatorId });
      setMessage("Creator removed from the official roster.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove this creator.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-800"><BadgeCheck className="size-5" /></span><div><h2 className="font-semibold">Official Content Creators</h2><p className="mt-1 text-sm leading-6 text-slate-600">Add approved creators after reviewing their application. Contact email stays private; approved public details appear on the creator program page. Entries are matched to existing player accounts by username or email to show their account badge.</p></div></div>
      {!canChange ? <p className="mt-4 text-sm text-slate-600">Verify Support access above to manage the creator roster.</p> : (
        <>
          <form onSubmit={(event) => void addCreator(event)} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="creator-email">Contact email (private)</Label><Input id="creator-email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="creator@example.com" /></div>
            <div className="space-y-2"><Label htmlFor="creator-username">OpenWorlds username</Label><Input id="creator-username" required minLength={2} maxLength={32} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Player username" /></div>
            <div className="space-y-2"><Label htmlFor="creator-display-name">Public creator name</Label><Input id="creator-display-name" required minLength={2} maxLength={60} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" /></div>
            <div className="space-y-2"><Label htmlFor="creator-social-platform">Social platform (optional)</Label><Input id="creator-social-platform" maxLength={40} value={socialPlatform} onChange={(event) => setSocialPlatform(event.target.value)} placeholder="YouTube, Twitch, TikTok…" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="creator-social-url">Social profile link (optional)</Label><Input id="creator-social-url" type="url" maxLength={500} value={socialUrl} onChange={(event) => setSocialUrl(event.target.value)} placeholder="https://…" /></div>
            <div className="sm:col-span-2"><Button type="submit" disabled={busy || !canChange}><BadgeCheck className="size-4" />{busy ? "Saving…" : "Add approved creator"}</Button></div>
          </form>
          {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold">Approved roster</h3>
            {creators === undefined ? <p className="text-sm text-slate-500">Loading…</p> : creators.length === 0 ? <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No creators have been added yet.</p> : creators.map((creator) => (
              <article key={creator._id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                <div className="min-w-0"><p className="flex items-center gap-2 font-medium">{creator.displayName}<BadgeCheck className="size-4 text-sky-600" /></p><p className="text-xs text-slate-600">@{creator.username} · {creator.email} · {creator.isLinked ? "Linked to player account" : "No matching player account"}</p>{creator.socialUrl && <a className="text-xs text-[#0066cc] underline" href={creator.socialUrl} target="_blank" rel="noopener noreferrer">{creator.socialPlatform || "Social profile"}</a>}</div>
                <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void deleteCreator(creator._id)}>Remove</Button>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function SubmissionNotificationPanel() {
  const me = useQuery(api.staff.me);
  const rosterStatus = useQuery(api.adminRoster.rosterStatus);
  const requestPermissionCode = useAction(api.adminRoster.requestPermissionCode);
  const verifyPermissionCode = useMutation(api.adminRoster.verifyPermissionCode);
  const recipients = useQuery(api.adminNotifications.listAdminNotificationRecipients);
  const addRecipient = useMutation(api.adminNotifications.addAdminNotificationRecipient);
  const removeRecipient = useMutation(api.adminNotifications.removeAdminNotificationRecipient);
  const sendTestAlert = useAction(api.supportEmail.sendAdminNotificationTest);
  const [newEmail, setNewEmail] = useState("");
  const [newKind, setNewKind] = useState<AdminNotificationRecipientKind>("both");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [testBusy, setTestBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [clock, setClock] = useState(Date.now());

  const verifiedUntil = rosterStatus?.permissionVerifiedUntil ?? 0;
  useEffect(() => {
    if (!verifiedUntil || verifiedUntil <= Date.now()) return;
    const timer = window.setTimeout(() => setClock(Date.now()), verifiedUntil - Date.now());
    return () => window.clearTimeout(timer);
  }, [verifiedUntil]);

  const isAdmin = Boolean(me?.isAdmin);
  const isVerified = Boolean(isAdmin && (verifiedUntil > clock));
  const canChange = isAdmin && isVerified;

  async function refreshCode() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await requestPermissionCode({});
      setMessage("A six-digit code was sent to support@openworlds.dk. It expires in 10 minutes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await verifyPermissionCode({ code: code });
      if (!result.ok) throw new Error(result.message);
      setCode("");
      setMessage("Verified. You can add or remove recipients for the next 15 minutes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd() {
    if (!canChange) return;
    if (!newEmail.trim()) {
      setError("Enter the email address that should receive alerts.");
      return;
    }
    setError("");
    setAddBusy(true);
    try {
      await addRecipient({ email: newEmail, kind: newKind });
      setNewEmail("");
      setMessage("Recipient added. They will receive a short alert whenever a matching submission comes in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the recipient.");
    } finally {
      setAddBusy(false);
    }
  }

  async function handleRemove(recipientId: string, email: string) {
    if (!canChange) return;
    setRemoveId(recipientId);
    setRemoveBusy(true);
    setError("");
    try {
      await removeRecipient({ recipientId: recipientId as any as Id<"adminNotificationRecipients"> });
      setMessage(`Removed ${email} from submission alerts.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the recipient.");
    } finally {
      setRemoveBusy(false);
      setRemoveId(null);
    }
  }

  async function handleTest(recipientId: Id<"adminNotificationRecipients">, channel: "careers" | "support") {
    if (!canChange) return;
    const key = `${recipientId}:${channel}`;
    setTestBusy(key);
    setError("");
    setMessage("");
    try {
      await sendTestAlert({ recipientId, channel });
      setMessage(`The email provider accepted the ${channel} test alert for this saved address. Check that inbox and its spam folder.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deliver the test alert.");
    } finally {
      setTestBusy(null);
    }
  }

  if (me === undefined) return <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-slate-400" /></div>;
  if (!isAdmin) return <p className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm">Verified administrator access is required to manage submission alerts.</p>;

  return (
    <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-800"><Bell className="size-5" /></span><div><h2 className="font-semibold">Submission alerts</h2><p className="mt-1 text-sm leading-6 text-slate-600">Configure addresses for generic ready-for-review emails: careers only, support only, or both. Recipient addresses are not verified, so add only addresses approved to receive alerts. Alert emails do not contain applicant or ticket details. Support tickets are stored in the site database; career submissions go to the Careers inbox and are not saved as application records in the database.</p></div></div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ADMIN_NOTIFICATION_CHANNEL_OPTIONS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-slate-100 ${newKind === value ? "border-[#0066cc] bg-blue-50 text-[#0066cc]" : "border-slate-200 text-slate-700"}`}
            onClick={() => setNewKind(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleAdd();
        }}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="admin-notification-email">Email address to notify</Label>
          <Input
            id="admin-notification-email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="alerts@openworlds.dk"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-notification-kind">Alerts for</Label>
          <select
            id="admin-notification-kind"
            value={newKind}
            onChange={(event) => setNewKind(event.target.value as AdminNotificationRecipientKind)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            {ADMIN_NOTIFICATION_CHANNEL_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={!canChange || addBusy || !newEmail.trim()}>{addBusy ? "Adding..." : "Add recipient"}</Button>
      </form>

      {message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p role="alert" className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="size-4" />{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Recipients</span>
        <span className="text-xs text-slate-500">These addresses get a short "ready for review" email when a matching submission is received. Send a test first to confirm the provider accepts mail for the saved address.</span>
      </div>

      {recipients === null ? (
        <p className="mt-2 text-sm text-slate-600">No recipients loaded.</p>
      ) : !recipients ? (
        <p className="mt-2 text-sm text-slate-600">Recipients not loaded yet.</p>
      ) : recipients.length === 0 ? (
        <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No recipients yet. Add the email address that should receive submission alerts.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {recipients.map((recipient) => {
            const kindLabel = ADMIN_NOTIFICATION_RECIPIENT_KINDS.find(([kind]) => kind === recipient.kind)?.[1] ?? "Both";
            return (
              <li
                key={recipient._id}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{recipient.email}</p>
                    <p className="text-xs text-slate-600">{kindLabel} · admin-configured, address ownership not verified</p>
                  </div>
                  {canChange && (
                    <div className="flex flex-wrap gap-2">
                      {(recipient.kind === "careers" || recipient.kind === "both") && (
                        <Button type="button" size="sm" variant="outline" disabled={testBusy !== null || removeBusy} onClick={() => void handleTest(recipient._id, "careers")}>
                          {testBusy === `${recipient._id}:careers` ? <Loader2 className="size-4 animate-spin" /> : "Test careers"}
                        </Button>
                      )}
                      {(recipient.kind === "support" || recipient.kind === "both") && (
                        <Button type="button" size="sm" variant="outline" disabled={testBusy !== null || removeBusy} onClick={() => void handleTest(recipient._id, "support")}>
                          {testBusy === `${recipient._id}:support` ? <Loader2 className="size-4 animate-spin" /> : "Test support"}
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={removeBusy || testBusy !== null}
                        onClick={() => void handleRemove(recipient._id, recipient.email)}
                      >
                        {removeId === recipient._id ? <Loader2 className="size-4 animate-spin" /> : "Remove"}
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!isVerified ? (
        <>
          <Button className="mt-5" variant="outline" onClick={() => void refreshCode()} disabled={busy}><Mail className="size-4" />{busy ? "Sending code..." : "Send code to Support"}</Button>
          <form onSubmit={(event) => void verify(event)} className="mt-4 flex flex-wrap items-end gap-3"><div className="w-full max-w-xs space-y-2"><Label htmlFor="admin-notification-code">6-digit Support code</Label><Input id="admin-notification-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></div><Button type="submit" disabled={busy || code.length !== 6}><ShieldCheck className="size-4" />{busy ? "Verifying..." : "Verify"}</Button></form>
          {error && <p role="alert" className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="size-4" />{error}</p>}
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-600">Verified. You can add or remove recipients for the next 15 minutes.</p>
      )}
    </section>
  );
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">OpenWorlds - Company operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin console</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Manage the private account directory and generic submission-alert recipients. Only verified admins can access these controls. Viewing account records requires a Careers email code; changing staff/admin permissions or alert recipients requires a separate Support email code. The directory includes player and staff account emails and role/restriction details, so use it only for legitimate administration.</p>
        <TeamPanel />
        <SubmissionNotificationPanel />
      </section>
    </main>
  );
}
