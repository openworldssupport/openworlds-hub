import { useEffect, useState, type FormEvent } from "react";
import { useAction, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RoleBadge } from "@/components/RoleBadge";
import { StaffUnlock } from "@/components/StaffUnlock";
import { DEPARTMENTS, POSITIONS, deriveBadge, isChiefExecutivePosition, type PublicBadge } from "@/lib/staff";
import { AlertCircle, BadgeCheck, Bell, CheckCircle2, Download, FileSearch, Loader2, Save, ShieldAlert } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
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
  isOwnerAccount: boolean;
  isChiefExecutive: boolean;
  role: string | null;
  badge: PublicBadge | null;
  memberStatus: "volunteer-thank-you" | null;
  isBanned: boolean;
  isOfficialCreator: boolean;
  playerLogin: string | null;
  image: string | null;
};

type ConvertiblePlayer = {
  userId: Id<"users">;
  username: string | null;
  displayName: string | null;
};

type CompanyAccessAccount = {
  _id: Id<"companyAccess">;
  email: string;
  username: string | null;
  department: string | null;
  position: string;
  accessLevel: "staff" | "admin";
  isActive: boolean;
};

type PendingStaffConversion = {
  userId: Id<"users">;
  email: string;
  username: string | null;
  displayName: string | null;
  department: string;
  position: string;
  accessLevel: "staff" | "admin";
  createdAt: number;
  expiresAt: number;
  expired: boolean;
};

type InvestigationRequestType = "law-enforcement" | "legal";

type InvestigationSearchResult = {
  userId: Id<"users">;
  username: string | null;
  displayName: string | null;
  email: string | null;
  role: string | null;
  department: string | null;
  position: string | null;
  isBanned: boolean;
};

function formatConversionCode(code: string) {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

type TeamRowProps = {
  member: TeamMember;
  busy: boolean;
  saved: boolean;
  canGrantAdmin: boolean;
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

function TeamPanel() {
  const me = useQuery(api.staff.me);
  const rosterStatus = useQuery(api.adminRoster.rosterStatus);
  const [verificationClock, setVerificationClock] = useState(Date.now());
  useEffect(() => {
    const verifiedUntil = rosterStatus?.verifiedUntil ?? 0;
    if (!verifiedUntil || verifiedUntil <= Date.now()) return;
    const timer = window.setTimeout(() => setVerificationClock(Date.now()), verifiedUntil - Date.now());
    return () => window.clearTimeout(timer);
  }, [rosterStatus?.verifiedUntil]);
  const isRosterVerified = Boolean(rosterStatus?.isAdmin && rosterStatus.verifiedUntil > verificationClock);
  const isPermissionVerified = isRosterVerified;
  const canGrantAdmin = Boolean(me?.isOwnerAdmin);
  // The hidden CEO seat is owner-only, so non-owner admins never see it as a
  // suggested position. The server still rejects a manually typed value.
  const availablePositions = canGrantAdmin
    ? POSITIONS
    : POSITIONS.filter((position) => !isChiefExecutivePosition(position));
  const { results: members, status, loadMore } = usePaginatedQuery(api.staff.listMembers, isRosterVerified ? {} : "skip", { initialNumItems: 50 });
  const positionAvailability = useQuery(api.careerApplications.adminPositionAvailability, isRosterVerified ? {} : "skip");
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
      // The owner account itself is managed by the bootstrap flow. Every other
      // admin or CEO can be reassigned by the owner through this row.
      const canEditAdmin = member.isAdmin && canGrantAdmin && !member.isOwnerAccount;
      const defaultBadge = member.badge ?? deriveBadge(member.department, member.position);
      const assignmentChanged =
        department !== (member.department ?? "") ||
        position !== (member.position ?? "") ||
        badge !== defaultBadge ||
        accessLevel !== (member.isAdmin ? "admin" : "staff") ||
        banned !== member.isBanned;
      if (member.isAdmin && (!canEditAdmin || !assignmentChanged)) {
        await setMemberStatus({ userId: member.userId, memberStatus });
        setSavedId(member.userId);
        return;
      }
      await setAssignment({ userId: member.userId, department, position, badge, accessLevel, memberStatus });
      if (banned !== member.isBanned) {
        await setBan({ userId: member.userId, banned, reason: "Staff access changed by an administrator" });
      }
      setSavedId(member.userId);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save the assignment. Please try again.");
    } finally {
      setBusyId(null);
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
        <h2 className="font-semibold">Unlock admin tools</h2>
        <div className="mt-2"><StaffUnlock description="Enter the 6-digit code from your authenticator app. The staff directory and access changes stay available for 15 minutes." /></div>
      </section>
    );
  }
  return (
    <div className="mt-6 space-y-3">
      <CreatorRosterPanel canChange={isPermissionVerified} />
      <p className="text-sm text-slate-600">Staff directory. Administrators can change department and position; only the owner account can grant admin access, appoint the hidden CEO, or reassign an existing admin/CEO row. The bootstrap owner is managed separately. Set a member’s position to “Head of Department” to designate that department’s head. Each listed position has a fixed number of places; a full position refuses new assignments. To upgrade a normal player account, use “Convert a player account” below. Viewing and changing assignments both need the authenticator unlock above; appointing a high-power role without that unlock is refused by the server.</p>
      {positionAvailability && <details className="rounded-lg border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-800">Position limits</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {positionAvailability.map((role) => <div key={role.slug} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2 text-xs">
            <span className="min-w-0 truncate text-slate-700">{role.title}{role.isHidden && <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Hidden</span>}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 font-medium ${role.full ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{role.assignedCount}/{role.capacity}</span>
          </div>)}
        </div>
      </details>}
      <p className="text-xs text-slate-500">{members.length} accounts loaded{status === "Exhausted" ? " - all accounts shown" : " - load more below to see the rest"}</p>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <datalist id="ow-departments">{DEPARTMENTS.map((item) => <option key={item} value={item} />)}</datalist>
      <datalist id="ow-positions">{availablePositions.map((item) => <option key={item} value={item} />)}</datalist>
      <PendingStaffPanel canChange={isPermissionVerified} />
      <PlayerConversionPanel canChange={isPermissionVerified} />
      <StaffInvitePanel canChange={isPermissionVerified} canGrantAdmin={canGrantAdmin} />
      {canGrantAdmin && <InvestigationPanel canOpen={isPermissionVerified} />}
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
            canGrantAdmin={canGrantAdmin}
          />
        ))
      )}
      {status === "CanLoadMore" && <Button variant="outline" onClick={() => loadMore(50)}>Load more accounts</Button>}
      {status === "LoadingMore" && <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-slate-400" /></div>}
    </div>
  );
}

function PendingStaffPanel({ canChange }: { canChange: boolean }) {
  const accounts = useQuery(api.admin.listCompanyAccess, canChange ? {} : "skip");
  const revoke = useMutation(api.admin.revokeCompanyAccount);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const pending = (accounts ?? []).filter((account) => !account.isActive);

  async function handleRevoke(accountId: Id<"companyAccess">) {
    setError("");
    setBusyId(accountId);
    try {
      await revoke({ accountId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that pending staff account.");
    } finally {
      setBusyId(null);
    }
  }

  if (!canChange || pending.length === 0) return null;

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50/60 p-5">
      <h2 className="font-semibold">New staff waiting to sign in</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">These invited accounts are not active yet. They appear in the staff directory after their first email-code sign-in. Player conversions are managed under “Convert a player account” until the player confirms the code.</p>
      <ul className="mt-3 space-y-2">
        {pending.map((account: CompanyAccessAccount) => (
          <li key={account._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm">
            <span>
              <span className="font-medium">{account.email}</span>
              {account.username ? <span className="text-slate-500"> · @{account.username}</span> : null}
              <span className="text-slate-500"> — {account.department ?? "No department"} / {account.position}{account.accessLevel === "admin" ? " / admin" : ""}</span>
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busyId === account._id}
              onClick={() => void handleRevoke(account._id)}
            >
              {busyId === account._id ? "Removing…" : "Remove"}
            </Button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-3 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    </section>
  );
}

function PlayerConversionPanel({ canChange }: { canChange: boolean }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ConvertiblePlayer | null>(null);
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [badge, setBadge] = useState<"staff" | "dev">("staff");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState<{
    userId: Id<"users">;
    email: string;
    code: string;
    expiresAt: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingBusyId, setPendingBusyId] = useState<string | null>(null);
  const term = search.trim();
  const results = useQuery(
    api.admin.searchPlayerAccountsForCompany,
    canChange && term.length >= 2 ? { search: term } : "skip",
  );
  const pendingConversions = useQuery(
    api.admin.listPendingStaffConversions,
    canChange ? {} : "skip",
  );
  const convert = useMutation(api.admin.convertPlayerToCompany);
  const regenerateCode = useMutation(api.admin.regenerateStaffConversionCode);
  const cancelConversion = useMutation(api.admin.cancelStaffConversion);

  function choosePlayer(player: ConvertiblePlayer) {
    setSelected(player);
    // Never prefill or reveal an account's private email. The administrator
    // enters the company address they are authorized to assign.
    setEmail("");
    setDepartment("");
    setPosition("");
    setBadge("staff");
    setError("");
    setMessage("");
  }

  async function handleConvert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !canChange || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await convert({
        userId: selected.userId,
        email,
        department,
        position,
        publicBadge: badge,
      });
      setConfirmation({
        userId: selected.userId,
        email: result.email,
        code: result.confirmationCode,
        expiresAt: result.expiresAt,
      });
      setCopied(false);
      setMessage(`${selected.username ? `@${selected.username}` : selected.displayName ?? "The player account"} has NOT been converted yet. Give them the confirmation code below through a private channel. They must open their dashboard while signed in and enter it.`);
      setSelected(null);
      setSearch("");
      setEmail("");
      setDepartment("");
      setPosition("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not convert that account.");
    } finally {
      setBusy(false);
    }
  }

  async function copyConfirmationCode() {
    if (!confirmation) return;
    try {
      await navigator.clipboard.writeText(formatConversionCode(confirmation.code));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function handleRegenerate(userId: Id<"users">) {
    setError("");
    setMessage("");
    setPendingBusyId(userId);
    try {
      const result = await regenerateCode({ userId });
      setConfirmation({
        userId,
        email: result.email,
        code: result.confirmationCode,
        expiresAt: result.expiresAt,
      });
      setCopied(false);
      setMessage(`A new confirmation code was generated for ${result.email}. The previous code no longer works.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate a new confirmation code.");
    } finally {
      setPendingBusyId(null);
    }
  }

  async function handleCancel(userId: Id<"users">) {
    setError("");
    setMessage("");
    setPendingBusyId(userId);
    try {
      await cancelConversion({ userId });
      if (confirmation?.userId === userId) setConfirmation(null);
      setMessage("The pending staff conversion was cancelled. The player account was not changed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel the pending conversion.");
    } finally {
      setPendingBusyId(null);
    }
  }

  const pendingRows = pendingConversions ?? [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Convert a player account</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Search by OpenWorlds username, display name, or account email. The same account stays in place, including its profile, friends, messages, and game data. Converting takes two confirmations: you start it here, then the signed-in player enters the one-time code you receive. Nothing changes until they confirm.
      </p>
      <div className="mt-4 max-w-md space-y-1">
        <Label htmlFor="convert-player-search">Find a player account</Label>
        <Input
          id="convert-player-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          maxLength={80}
          placeholder="Username or display name"
          disabled={!canChange}
        />
        <p className="text-xs text-slate-500">Enter at least two characters.</p>
      </div>
      {canChange && term.length >= 2 && (
        <div className="mt-3 max-w-xl space-y-1">
          {results === undefined ? (
            <p className="text-sm text-slate-500">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-slate-500">No player accounts matched that search.</p>
          ) : (
            results.map((player) => (
              <button
                key={player.userId}
                type="button"
                onClick={() => choosePlayer(player)}
                className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm ${selected?.userId === player.userId ? "border-[#14583c] bg-[#f4f8f5]" : "border-slate-200 hover:bg-slate-50"}`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">{player.username ? `@${player.username}` : player.displayName ?? "Unnamed account"}</span>
                  {player.displayName && player.username && <span className="block truncate text-xs text-slate-500">{player.displayName}</span>}
                </span>
                <span className="shrink-0 text-xs font-medium text-[#14583c]">{selected?.userId === player.userId ? "Selected" : "Select"}</span>
              </button>
            ))
          )}
        </div>
      )}
      {selected && (
        <form onSubmit={(event) => void handleConvert(event)} className="mt-5 border-t border-slate-200 pt-4">
          <p className="text-sm font-medium">Converting {selected.username ? `@${selected.username}` : selected.displayName ?? "player account"}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="convert-email">Company email</Label>
              <Input id="convert-email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" />
              <p className="text-xs text-slate-500">This becomes their staff sign-in. Use an address they control.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="convert-department">Department</Label>
              <Input id="convert-department" list="ow-departments" required maxLength={80} value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Engineering" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="convert-position">Position</Label>
              <Input id="convert-position" list="ow-positions" required maxLength={100} value={position} onChange={(event) => setPosition(event.target.value)} placeholder="Developer" />
              {isChiefExecutivePosition(position) && <p className="text-xs text-slate-500">The CEO is hidden from careers, single-seat, and owner-only. This conversion will receive full admin authority.</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="convert-badge">Badge</Label>
              <select id="convert-badge" value={badge} onChange={(event) => setBadge(event.target.value as "staff" | "dev")} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="staff">Staff</option>
                <option value="dev">Dev</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!canChange || busy || !email.trim() || !department.trim() || !position.trim()}>
              {busy ? "Starting…" : "Start conversion"}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setSelected(null)}>Cancel</Button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {confirmation && (
        <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-950">Confirmation code for {confirmation.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code className="rounded-md border border-emerald-300 bg-white px-4 py-2 font-mono text-xl font-semibold tracking-[0.18em] text-emerald-950">{formatConversionCode(confirmation.code)}</code>
            <Button type="button" size="sm" variant="outline" onClick={() => void copyConfirmationCode()}>{copied ? "Copied" : "Copy code"}</Button>
          </div>
          <p className="mt-2 text-xs leading-5 text-emerald-900">Share this privately with the account holder. It expires {new Date(confirmation.expiresAt).toLocaleString()} and only works for their signed-in account.</p>
        </div>
      )}
      {canChange && pendingRows.length > 0 && (
        <div className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold">Conversions waiting for staff confirmation</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">Nothing has changed on these accounts yet. Generate a new code if the old one was lost or expired, or cancel the request.</p>
          <ul className="mt-3 space-y-2">
            {pendingRows.map((conversion: PendingStaffConversion) => (
              <li key={conversion.userId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-slate-900">{conversion.username ? `@${conversion.username}` : conversion.displayName ?? conversion.email}</span>
                  <span className="text-slate-500"> · {conversion.email} — {conversion.department} / {conversion.position}</span>
                  {conversion.expired && <span className="font-medium text-red-700"> · code expired</span>}
                </span>
                <span className="flex shrink-0 gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={pendingBusyId === conversion.userId} onClick={() => void handleRegenerate(conversion.userId)}>
                    {pendingBusyId === conversion.userId ? "Generating…" : "New code"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={pendingBusyId === conversion.userId} onClick={() => void handleCancel(conversion.userId)}>Cancel</Button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!canChange && <p className="mt-3 text-sm text-slate-500">Unlock admin tools to convert a player account.</p>}
    </section>
  );
}

function StaffInvitePanel({ canChange, canGrantAdmin }: { canChange: boolean; canGrantAdmin: boolean }) {
  const invite = useMutation(api.admin.inviteCompanyAccount);
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [badge, setBadge] = useState<"staff" | "dev">("staff");
  const [accessLevel, setAccessLevel] = useState<"staff" | "admin">("staff");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved("");
    setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await invite({
        email: normalizedEmail,
        department: department.trim(),
        position: position.trim(),
        publicBadge: badge,
        accessLevel,
      });
      setSaved("The staff account is ready. It can now sign in with a one-time email code.");
      setEmail("");
      setDepartment("");
      setPosition("");
      setBadge("staff");
      setAccessLevel("staff");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that staff account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Add a company email</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Staff access is assigned here only; there is no public staff sign-up. Use this form for a new company email. If the person already has a player account, use “Convert a player account” above instead so their existing account stays intact. The person signs in on the normal sign-in page with a one-time code sent to this email.
      </p>
      <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="staff-invite-email">Staff email</Label>
          <Input
            id="staff-invite-email"
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="staff-invite-department">Department</Label>
          <Input
            id="staff-invite-department"
            list="ow-departments"
            required
            maxLength={80}
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            placeholder="Engineering"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="staff-invite-position">Position</Label>
          <Input
            id="staff-invite-position"
            list="ow-positions"
            required
            maxLength={100}
            value={position}
            onChange={(event) => {
              const next = event.target.value;
              setPosition(next);
              if (canGrantAdmin && isChiefExecutivePosition(next)) setAccessLevel("admin");
            }}
            placeholder="Developer"
          />
          {isChiefExecutivePosition(position) && <p className="text-xs text-slate-500">The CEO is hidden from careers, single-seat, and owner-only. Admin access is selected automatically.</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="staff-invite-badge">Badge</Label>
          <select
            id="staff-invite-badge"
            value={badge}
            onChange={(event) => setBadge(event.target.value as "staff" | "dev")}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="staff">Staff</option>
            <option value="dev">Dev</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="staff-invite-level">Access level</Label>
          <select
            id="staff-invite-level"
            value={accessLevel}
            onChange={(event) => setAccessLevel(event.target.value as "staff" | "admin")}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="staff">Staff</option>
            <option value="admin" disabled={!canGrantAdmin}>Admin</option>
          </select>
          {!canGrantAdmin && <p className="text-xs text-slate-500">Only the owner account can grant admin access.</p>}
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={!canChange || busy || !email.trim()}>
            {busy ? "Adding…" : "Add staff account"}
          </Button>
        </div>
      </form>
      {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {saved && <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{saved}</p>}
    </section>
  );
}

function TeamRow({ member, busy, saved, onSave, onSetOfficialCreator, canChangeAccess, canGrantAdmin }: TeamRowProps & { canChangeAccess: boolean; onSetOfficialCreator: (userId: Id<"users">, isOfficialCreator: boolean) => Promise<void> }) {
  const defaultBadge = member.badge ?? deriveBadge(member.department, member.position);
  const [department, setDepartment] = useState(member.department ?? "");
  const [position, setPosition] = useState(member.position ?? "");
  const [badge, setBadge] = useState<"staff" | "dev">(defaultBadge);
  const [memberStatus, setMemberStatus] = useState<"none" | "volunteer-thank-you">(member.memberStatus ?? "none");
  const [accessLevel, setAccessLevel] = useState<"staff" | "admin">(member.isAdmin ? "admin" : "staff");
  const [banned, setBanned] = useState(member.isBanned);
  const canEditAssignment = !member.isAdmin || (canGrantAdmin && !member.isOwnerAccount);
  const assignmentDirty =
    department !== (member.department ?? "") ||
    position !== (member.position ?? "") ||
    badge !== defaultBadge ||
    accessLevel !== (member.isAdmin ? "admin" : "staff") ||
    banned !== member.isBanned;
  const isDirty = canEditAssignment
    ? assignmentDirty || memberStatus !== (member.memberStatus ?? "none")
    : memberStatus !== (member.memberStatus ?? "none");
  const active = Boolean(department.trim() || position.trim());
  const canSave = canEditAssignment
    ? isDirty && canChangeAccess && (active || member.isStaff || banned !== member.isBanned)
    : isDirty && canChangeAccess;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            {member.nickname || member.name || member.playerLogin || "Unnamed account"}
            {member.isOwnerAccount ? (
              <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">Owner</span>
            ) : member.isChiefExecutive ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">CEO</span>
            ) : member.isAdmin ? (
              <span className="text-xs font-medium text-slate-500">Admin</span>
            ) : member.isStaff && (
              <RoleBadge badge={member.badge ?? defaultBadge} />
            )}
          </p>
          <p className="text-xs text-slate-500">{member.email || "Email unavailable"}</p>
          {member.playerLogin && <p className="mt-1 text-xs text-slate-600">OpenWorlds username: <span className="font-medium">{member.playerLogin}</span></p>}
          <p className="mt-1 text-xs text-slate-600">
            {member.isOwnerAccount ? "Bootstrap owner (managed separately)" : member.isChiefExecutive ? "Chief Executive Officer" : member.isAdmin ? "Administrator" : member.isStaff ? "Staff member" : "Player account"}
            {member.department ? ` - ${member.department}` : ""}
            {member.position ? ` - ${member.position}` : ""}
            {member.isBanned ? " - access restricted" : ""}
            {member.memberStatus === "volunteer-thank-you" ? " - volunteer - thank-you" : ""}
          </p>
        </div>
      </div>
      {member.role === "user" && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">            <span className="text-sm font-medium">Official Content Creator</span>

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
        {canEditAssignment && (
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
                onChange={(e) => {
                  const next = e.target.value;
                  setPosition(next);
                  if (canGrantAdmin && isChiefExecutivePosition(next)) setAccessLevel("admin");
                }}
                placeholder="Developer"
              />
              {isChiefExecutivePosition(position) && <p className="text-xs text-slate-500">The CEO is a hidden, single-seat appointment with full operational authority. It always carries admin access and only the owner can assign it.</p>}
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
                <option value="admin" disabled={!canChangeAccess || !canGrantAdmin}>Admin</option>
              </select>
              {!canGrantAdmin && <p className="text-xs text-slate-500">Only the owner account can grant admin access.</p>}
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
      setMessage(result.linkedToAccount ? "Creator verified and linked to the player account. Their badge and public listing are active." : "The creator was not linked to a verified player account.");
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
      <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-800"><BadgeCheck className="size-5" /></span><div><h2 className="font-semibold">Official Content Creators</h2><p className="mt-1 text-sm leading-6 text-slate-600">Review the application, then enter the creator’s public details and the email verified on their OpenWorlds player account. Username and verified recovery email must match the same account before a badge or public listing is granted.</p></div></div>
      {!canChange ? <p className="mt-4 text-sm text-slate-600">Verify Support access above to manage the creator roster.</p> : (
        <>
          <form onSubmit={(event) => void addCreator(event)} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="creator-email">Player account recovery email (private)</Label><Input id="creator-email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="creator@example.com" /></div>
            <div className="space-y-2"><Label htmlFor="creator-username">OpenWorlds username</Label><Input id="creator-username" required minLength={2} maxLength={32} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Player username" /></div>
            <div className="space-y-2"><Label htmlFor="creator-display-name">Public creator name</Label><Input id="creator-display-name" required minLength={2} maxLength={60} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" /></div>
            <div className="space-y-2"><Label htmlFor="creator-social-platform">Social platform</Label><Input id="creator-social-platform" required maxLength={40} value={socialPlatform} onChange={(event) => setSocialPlatform(event.target.value)} placeholder="YouTube, Twitch, TikTok…" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="creator-social-url">Social profile link</Label><Input id="creator-social-url" type="url" required maxLength={500} value={socialUrl} onChange={(event) => setSocialUrl(event.target.value)} placeholder="https://…" /></div>
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
  const recipients = useQuery(api.adminNotifications.listAdminNotificationRecipients);
  const addRecipient = useMutation(api.adminNotifications.addAdminNotificationRecipient);
  const removeRecipient = useMutation(api.adminNotifications.removeAdminNotificationRecipient);
  const sendTestAlert = useAction(api.supportEmail.sendAdminNotificationTest);
  const [newEmail, setNewEmail] = useState("");
  const [newKind, setNewKind] = useState<AdminNotificationRecipientKind>("both");
  const [removeId, setRemoveId] = useState<string | null>(null);
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

      {!isVerified && <div className="mt-4"><StaffUnlock description="Unlock to add or remove alert recipients for the next 15 minutes." /></div>}
      {error && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-800"><AlertCircle className="size-4" />{error}</p>}
    </section>
  );
}

function InvestigationPanel({ canOpen }: { canOpen: boolean }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InvestigationSearchResult | null>(null);
  const [reason, setReason] = useState("");
  const [requestType, setRequestType] = useState<InvestigationRequestType>("law-enforcement");
  const [legalAuthority, setLegalAuthority] = useState("");
  const [legalReference, setLegalReference] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [legalConfirmed, setLegalConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const term = search.trim();
  const legalDetailsComplete =
    legalAuthority.trim().length >= 2 &&
    legalReference.trim().length >= 2 &&
    jurisdiction.trim().length >= 2 &&
    legalConfirmed;
  const results = useQuery(
    api.investigations.searchAccounts,
    canOpen && term.length >= 2 ? { search: term } : "skip",
  );
  const openInvestigation = useMutation(api.investigations.openAccountInvestigation);
  const recentAccess = useQuery(
    api.investigations.listRecentInvestigationAccess,
    canOpen ? {} : "skip",
  );

  async function handleOpen() {
    if (!selected) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const dossier = await openInvestigation({
        userId: selected.userId,
        reason: reason.trim(),
        requestType,
        legalAuthority: legalAuthority.trim(),
        legalReference: legalReference.trim(),
        jurisdiction: jurisdiction.trim(),
      });
      setResult(dossier);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the investigation file.");
    } finally {
      setBusy(false);
    }
  }

  function downloadDossier() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `openworlds-investigation-${selected?.username ?? "account"}-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-lg border border-amber-300 bg-amber-50/50 p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800"><ShieldAlert className="size-5" /></span>
        <div>
          <h2 className="font-semibold">Legal disclosure access</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Full private records are not available for internal review. This owner-only, authenticator-unlocked panel opens a record only after a valid law-enforcement or court/legal request has been received. The requesting authority, case or order reference, jurisdiction, your reason, and the time are logged. The JSON file contains unmasked personal data — disclose only what the request legally requires, store it securely, and delete it when no longer needed.
          </p>
        </div>
      </div>

      <div className="mt-4 max-w-xl space-y-1">
        <Label htmlFor="investigation-search">Find an account</Label>
        <Input
          id="investigation-search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setSelected(null);
            setResult(null);
            setLegalConfirmed(false);
            setError("");
          }}
          maxLength={80}
          placeholder="Username, display name, account ID, or exact email"
          disabled={!canOpen}
        />
        <p className="text-xs text-slate-500">Results are masked. The full record is revealed only after you enter a reason.</p>
      </div>

      {canOpen && term.length >= 2 && (
        <div className="mt-3 max-w-xl space-y-1">
          {results === undefined ? (
            <p className="text-sm text-slate-500">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-slate-500">No accounts matched that search.</p>
          ) : (
            results.map((account) => (
              <button
                key={account.userId}
                type="button"
                onClick={() => {
                  setSelected(account);
                  setResult(null);
                  setLegalConfirmed(false);
                  setError("");
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm ${selected?.userId === account.userId ? "border-amber-500 bg-white" : "border-amber-200 bg-white/70 hover:bg-white"}`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">{account.username ? `@${account.username}` : account.displayName ?? "Unnamed account"}</span>
                  <span className="block truncate text-xs text-slate-500">{account.email ?? "No email on file"}{account.role ? ` · ${account.role}` : ""}{account.position ? ` · ${account.position}` : ""}{account.isBanned ? " · restricted" : ""}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-amber-800">{selected?.userId === account.userId ? "Selected" : "Select"}</span>
              </button>
            ))
          )}
        </div>
      )}

      {selected && (
        <div className="mt-4 max-w-xl space-y-2 rounded-md border border-amber-200 bg-white p-4">
          <p className="text-sm font-medium">Opening the file for {selected.username ? `@${selected.username}` : selected.displayName ?? "this account"}</p>
          <div className="space-y-1">
            <Label htmlFor="investigation-request-type">Request type</Label>
            <select
              id="investigation-request-type"
              value={requestType}
              onChange={(event) => {
                setRequestType(event.target.value as InvestigationRequestType);
                setLegalConfirmed(false);
                setResult(null);
              }}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <option value="law-enforcement">Law-enforcement request</option>
              <option value="legal">Court order, subpoena, or other legal request</option>
            </select>
          </div>
          <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-xs leading-5 text-red-900">
                Verify the request is authentic and legally valid before exporting. Record only the details supplied by the requesting authority, and provide only the records covered by the request.
              </p>
              <div className="space-y-1">
                <Label htmlFor="investigation-authority">Requesting authority or agency</Label>
                <Input
                  id="investigation-authority"
                  value={legalAuthority}
                  onChange={(event) => setLegalAuthority(event.target.value)}
                  maxLength={160}
                  placeholder="Agency, court, or legal representative"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="investigation-reference">Case, ticket, or order reference</Label>
                <Input
                  id="investigation-reference"
                  value={legalReference}
                  onChange={(event) => setLegalReference(event.target.value)}
                  maxLength={120}
                  placeholder="Reference supplied by the requester"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="investigation-jurisdiction">Jurisdiction</Label>
                <Input
                  id="investigation-jurisdiction"
                  value={jurisdiction}
                  onChange={(event) => setJurisdiction(event.target.value)}
                  maxLength={80}
                  placeholder="City, state, country, or court"
                />
              </div>
              <label className="flex items-start gap-2 text-xs leading-5 text-red-950">
                <input
                  type="checkbox"
                  checked={legalConfirmed}
                  onChange={(event) => setLegalConfirmed(event.target.checked)}
                  className="mt-0.5 size-4 rounded border-red-300"
                />
                <span>I confirmed this request is valid and that the export will be limited to what it legally requires.</span>
              </label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="investigation-reason">Reason and scope of the legal request</Label>
            <Textarea
              id="investigation-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              minLength={10}
              placeholder="Describe the legal request and the records it covers."
            />
            <p className="text-xs text-slate-500">10–500 characters. This reason is written to the access log.</p>
          </div>
          <Button type="button" disabled={!canOpen || busy || reason.trim().length < 10 || !legalDetailsComplete} onClick={() => void handleOpen()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />}
            {busy ? "Building file…" : "Open legally requested file"}
          </Button>
        </div>
      )}

      {error && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-800"><AlertCircle className="size-4" />{error}</p>}

      {result !== null && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Investigation file ready</p>
            <Button type="button" size="sm" variant="outline" onClick={downloadDossier}><Download className="size-4" /> Download JSON</Button>
          </div>
          <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {canOpen && recentAccess && recentAccess.length > 0 && (
        <div className="mt-5 border-t border-amber-200 pt-4">
          <h3 className="text-sm font-semibold">Recent legal-disclosure access</h3>
          <p className="mt-1 text-xs text-slate-500">The most recent dossier openings. Target emails stay masked in this log; legacy internal-access rows remain visible for audit history.</p>
          <ul className="mt-3 space-y-2">
            {recentAccess.slice(0, 8).map((entry) => (
              <li key={entry._id} className="rounded-md border border-amber-200 bg-white/70 px-3 py-2 text-xs text-slate-600">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-slate-900">{entry.targetLabel}</span>
                  <span>{entry.targetEmail ?? "No email on file"}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                    {entry.requestType === "law-enforcement" ? "Law enforcement" : entry.requestType === "legal" ? "Legal request" : "Legacy access"}
                  </span>
                  <span>{new Date(entry.createdAt).toLocaleString()}</span>
                </p>
                <p className="mt-1 line-clamp-2">{entry.reason}</p>
                {entry.legalReference && (
                  <p className="mt-1 text-slate-500">
                    {entry.legalAuthority} · Ref {entry.legalReference}{entry.jurisdiction ? ` · ${entry.jurisdiction}` : ""}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin console</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Staff accounts only. Unlock with your authenticator app to view the directory, change access, or edit alert recipients.</p>
          </div>
          <Button asChild variant="outline"><Link to="/moderation?tab=permissions">Moderation permissions</Link></Button>
        </div>
        <TeamPanel />
        <SubmissionNotificationPanel />
      </section>
    </main>
  );
}
