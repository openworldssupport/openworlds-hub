import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { SiteNav } from "@/components/SiteNav";
import { RoleBadge } from "@/components/RoleBadge";
import { DEPARTMENTS, POSITIONS, deriveBadge, type PublicBadge } from "@/lib/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Inbox,
  Loader2,
  LockKeyhole,
  LogOut,
  RefreshCcw,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";

const applicationStatuses = ["new", "reviewing", "shortlisted", "accepted", "declined", "archived"];
const statusStyles: Record<string, string> = {
  open: "border-blue-200 bg-blue-50 text-[#0052a3]",
  responded: "border-violet-200 bg-violet-50 text-[#7651c9]",
  closed: "border-slate-200 bg-slate-100 text-slate-600",
  new: "border-blue-200 bg-blue-50 text-[#0052a3]",
  reviewing: "border-violet-200 bg-violet-50 text-[#7651c9]",
  shortlisted: "border-amber-200 bg-amber-50 text-amber-800",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  declined: "border-red-200 bg-red-50 text-red-800",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
};

function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${statusStyles[status] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>{status}</span>;
}

export default function Admin() {
  const { isLoading, isAuthenticated } = useAuth();
  const companyAccess = useQuery(api.staff.me);
  const canOpenAdmin = companyAccess?.isAdmin === true;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-8 sm:px-8">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0066cc]"><ShieldCheck className="size-4" /> OpenWorlds company</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin</h1>
            <p className="mt-1 text-sm text-slate-500">Tickets, applications, and company accounts.</p>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {isLoading || companyAccess === undefined ? <div className="flex justify-center py-16"><Loader2 className="size-5 animate-spin text-slate-400" /></div> : !isAuthenticated ? <AdminSignIn /> : !canOpenAdmin ? <AccessDenied /> : <AdminDashboard canManageCompanyAccounts={canOpenAdmin} />}
      </section>
    </main>
  );
}

function AdminSignIn() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
      <LockKeyhole className="mx-auto size-6 text-slate-500" />
      <h2 className="mt-3 font-semibold">Admin access</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Sign in using an invited company email and its one-time code.</p>
      <Button asChild className="mt-5"><Link to="/auth?returnTo=%2Fadmin">Company sign in</Link></Button>
    </div>
  );
}

function AccessDenied() {
  const { signOut } = useAuth();
  return (
    <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <AlertCircle className="mx-auto size-6 text-amber-700" />
      <h2 className="mt-3 font-semibold text-amber-900">Admin access required</h2>
      <p className="mt-2 text-sm text-amber-900">This account does not have access to the Admin workspace.</p>
      <Button variant="outline" className="mt-4" onClick={() => signOut()}>Sign out</Button>
    </div>
  );
}

function AdminDashboard({ canManageCompanyAccounts }: { canManageCompanyAccounts: boolean }) {
  const { signOut } = useAuth();
  const tickets = useQuery(api.supportTickets.listForAdmin);
  const applications = useQuery(api.careerApplications.listForAdmin);
  const members = useQuery(api.staff.listMembers, canManageCompanyAccounts ? {} : "skip");
  const accounts = useQuery(api.admin.listCompanyAccess, canManageCompanyAccounts ? {} : "skip");
  const markResponded = useMutation(api.supportTickets.markResponded);
  const closeTicket = useMutation(api.supportTickets.closeTicket);
  const reopenTicket = useMutation(api.supportTickets.reopenTicket);
  const removeTicket = useMutation(api.supportTickets.removeTicket);
  const setApplicationStatus = useMutation(api.careerApplications.setStatus);
  const removeApplication = useMutation(api.careerApplications.remove);
  const inviteCompanyAccount = useMutation(api.admin.inviteCompanyAccount);
  const revokeCompanyAccount = useMutation(api.admin.revokeCompanyAccount);

  const [tab, setTab] = useState<"tickets" | "applications" | "team" | "accounts">("tickets");
  const [filter, setFilter] = useState<"all" | "open" | "responded" | "closed">("all");
  const [error, setError] = useState("");
  const allTickets = tickets ?? [];
  const appList = applications ?? [];
  const visibleTickets = filter === "all" ? allTickets : allTickets.filter((ticket) => ticket.status === filter);

  async function run(action: () => Promise<unknown>) {
    setError("");
    try { await action(); } catch { setError("Action failed. Please try again."); }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant={tab === "tickets" ? "default" : "outline"} onClick={() => setTab("tickets")}><Inbox className="size-4" /> Tickets <span className="ml-1 rounded bg-white/20 px-1.5 text-xs">{allTickets.length}</span></Button>
          <Button variant={tab === "applications" ? "default" : "outline"} onClick={() => setTab("applications")}><UserRound className="size-4" /> Applications <span className="ml-1 rounded bg-white/20 px-1.5 text-xs">{appList.length}</span></Button>
          <Button asChild variant="outline"><Link to="/applications">Open review page</Link></Button>
          <Button asChild variant="outline"><Link to="/staff">Staff workspace</Link></Button>
          {canManageCompanyAccounts && <Button variant={tab === "team" ? "default" : "outline"} onClick={() => setTab("team")}><Briefcase className="size-4" /> Team</Button>}
          {canManageCompanyAccounts && <Button variant={tab === "accounts" ? "default" : "outline"} onClick={() => setTab("accounts")}><LockKeyhole className="size-4" /> Company accounts</Button>}
        </div>
        <Button variant="outline" onClick={() => signOut()}><LogOut className="size-4" /> Sign out</Button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {tickets === undefined || applications === undefined ? <div className="flex justify-center py-16"><Loader2 className="size-5 animate-spin text-slate-400" /></div> : tab === "tickets" ? (
        <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Open" value={allTickets.filter((t) => t.status === "open").length} />
            <StatCard label="Responded" value={allTickets.filter((t) => t.status === "responded").length} />
            <StatCard label="Closed" value={allTickets.filter((t) => t.status === "closed").length} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">{(["all", "open", "responded", "closed"] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-md border px-3 py-1.5 text-sm capitalize ${filter === item ? "border-[#0066cc] bg-[#0066cc] text-white" : "border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div>
          {visibleTickets.length === 0 ? <p className="mt-4 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">No tickets in this view.</p> : <div className="mt-4 space-y-3">{visibleTickets.map((ticket) => (
            <article key={ticket._id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="font-mono text-sm font-semibold">{ticket.reference ?? "—"}</span><StatusBadge status={ticket.status} /></div><p className="mt-2 text-sm text-slate-600">{ticket.name || "No name"}{ticket.username ? ` · @${ticket.username}` : ""}</p></div><time className="text-xs text-slate-500">{new Date(ticket.submittedAt).toLocaleString()}</time></div>
              <p className="mt-3 text-sm font-medium">{ticket.reason}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{ticket.message}</p>
              <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => run(() => markResponded({ ticketId: ticket._id }))}><CheckCircle2 className="size-4" /> Responded</Button><Button size="sm" variant="outline" onClick={() => run(() => closeTicket({ ticketId: ticket._id }))}><XCircle className="size-4" /> Close</Button><Button size="sm" variant="outline" onClick={() => run(() => reopenTicket({ ticketId: ticket._id }))}><RefreshCcw className="size-4" /> Reopen</Button><Button size="sm" variant="outline" onClick={() => { if (window.confirm("Delete this ticket?")) void run(() => removeTicket({ ticketId: ticket._id })); }}><Trash2 className="size-4" /> Delete</Button></div>
            </article>
          ))}</div>}
        </div>
      ) : tab === "applications" ? (
        <div className="mt-6 space-y-3">{appList.length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">No applications have been submitted.</p> : appList.map((app) => (
          <article key={app._id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{app.roleTitle}</h2><p className="mt-1 text-sm text-slate-600">{app.fullName}</p></div><StatusBadge status={app.status} /></div>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2"><p className="rounded-lg bg-slate-50 p-3"><strong>Experience:</strong><br />{app.experience}</p><p className="rounded-lg bg-slate-50 p-3"><strong>Motivation:</strong><br />{app.motivation}</p><p className="rounded-lg bg-slate-50 p-3"><strong>First weeks:</strong><br />{app.roleApproach}</p><p className="rounded-lg bg-slate-50 p-3"><strong>Collaboration:</strong><br />{app.collaboration}</p><p className="rounded-lg bg-slate-50 p-3"><strong>Availability:</strong><br />{app.availability}</p>{app.strategyScenario && <p className="rounded-lg bg-slate-50 p-3"><strong>Scenario:</strong><br />{app.strategyScenario}</p>}{app.successMeasures && <p className="rounded-lg bg-slate-50 p-3"><strong>Success measures:</strong><br />{app.successMeasures}</p>}{app.decisionMaking && <p className="rounded-lg bg-slate-50 p-3"><strong>Decision making:</strong><br />{app.decisionMaking}</p>}{app.stakeholderCommunication && <p className="rounded-lg bg-slate-50 p-3"><strong>Stakeholder communication:</strong><br />{app.stakeholderCommunication}</p>}{app.toolsAndStrengths && <p className="rounded-lg bg-slate-50 p-3"><strong>Tools &amp; strengths:</strong><br />{app.toolsAndStrengths}</p>}{app.portfolio && <p className="rounded-lg bg-slate-50 p-3"><strong>Work samples:</strong><br />{app.portfolio}</p>}{app.weeklyHours && <p><strong>Weekly contribution:</strong> {app.weeklyHours}</p>}{app.timeZone && <p><strong>Time zone:</strong> {app.timeZone}</p>}{app.availabilityStart && <p><strong>Can start:</strong> {app.availabilityStart}</p>}{app.linkedin && <p><strong>LinkedIn:</strong> <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#0066cc] underline">Profile</a></p>}</div>
            <div className="mt-4 flex flex-wrap items-center gap-2"><label htmlFor={`status-${app._id}`} className="text-sm">Status</label><select id={`status-${app._id}`} defaultValue={app.status} onChange={(e) => void run(() => setApplicationStatus({ applicationId: app._id, status: e.target.value }))} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">{applicationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select><Button size="sm" variant="outline" onClick={() => { if (window.confirm("Delete this application?")) void run(() => removeApplication({ applicationId: app._id })); }}><Trash2 className="size-4" /> Delete</Button></div>
            <p className="mt-3 text-xs text-slate-500">Submitted {new Date(app.submittedAt).toLocaleString()} · Voluntary and unpaid</p>
          </article>
        ))}</div>
      ) : tab === "team" && canManageCompanyAccounts ? <TeamPanel members={members} /> : tab === "accounts" && canManageCompanyAccounts ? (
        <CompanyAccountsPanel
          accounts={accounts}
          onInvite={(args) => run(() => inviteCompanyAccount(args))}
          onRevoke={(accountId) => run(() => revokeCompanyAccount({ accountId }))}
        />
      ) : <AccessDenied />}
      <div className="mt-8 flex gap-4 text-sm"><Link to="/" className="font-medium text-[#0066cc] hover:underline">Website</Link><Link to="/staff" className="font-medium text-[#0066cc] hover:underline">Staff portal</Link></div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}

type CompanyAccount = { _id: Id<"companyAccess">; department: string; position: string; publicBadge: PublicBadge; accessLevel: "admin" | "staff" };

function CompanyAccountsPanel({ accounts, onInvite, onRevoke }: {
  accounts: CompanyAccount[] | null | undefined;
  onInvite: (args: { email: string; department: string; position: string; publicBadge: PublicBadge; accessLevel: "admin" | "staff" }) => Promise<void>;
  onRevoke: (accountId: Id<"companyAccess">) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [publicBadge, setPublicBadge] = useState<PublicBadge>("staff");
  const [accessLevel, setAccessLevel] = useState<"admin" | "staff">("staff");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy("invite");
    try { await onInvite({ email, department, position, publicBadge, accessLevel }); setEmail(""); setDepartment(""); setPosition(""); }
    catch { setError("Could not invite the account. Please check the details and try again."); }
    finally { setBusy(""); }
  }

  async function revoke(accountId: Id<"companyAccess">) {
    if (!window.confirm("Revoke company access for this account?")) return;
    setBusy(accountId); setError("");
    try { await onRevoke(accountId); }
    catch { setError("Could not revoke the account. Please try again."); }
    finally { setBusy(""); }
  }

  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Invite a company account</h2><p className="mt-1 text-sm text-slate-600">Invited addresses can request a one-time email code. Other addresses qualify after their staff application is accepted or their staff assignment is approved. Public player sign-up remains disabled.</p>
        <form onSubmit={invite} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="invite-email">Email</Label><Input id="invite-email" type="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></div>
          <div className="space-y-1.5"><Label htmlFor="invite-dept">Department</Label><Input id="invite-dept" list="ow-departments" required maxLength={80} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Engineering" /></div>
          <div className="space-y-1.5"><Label htmlFor="invite-position">Position</Label><Input id="invite-position" list="ow-positions" required maxLength={100} value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Developer" /></div>
          <div className="space-y-1.5"><Label htmlFor="invite-badge">Public badge</Label><select id="invite-badge" value={publicBadge} onChange={(e) => setPublicBadge(e.target.value as PublicBadge)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="staff">Staff</option><option value="dev">Dev</option></select></div>
          <div className="space-y-1.5"><Label htmlFor="invite-level">Access</Label><select id="invite-level" value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as "admin" | "staff")} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="staff">Staff</option><option value="admin">Admin</option></select></div>
          <div className="sm:col-span-2"><Button type="submit" disabled={Boolean(busy)}>{busy === "invite" ? <Loader2 className="size-4 animate-spin" /> : <UserRound className="size-4" />} Invite account</Button></div>
        </form>
        <datalist id="ow-departments">{DEPARTMENTS.map((item) => <option key={item} value={item} />)}</datalist>
        <datalist id="ow-positions">{POSITIONS.map((item) => <option key={item} value={item} />)}</datalist>
        {error && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      </section>
      <section className="rounded-lg border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-5 py-4 font-semibold">Company accounts</h2>
        {accounts === undefined ? <p className="p-5 text-sm text-slate-500">Loading accounts…</p> : accounts === null ? <p className="p-5 text-sm text-slate-600">Admin access required.</p> : accounts.length === 0 ? <p className="p-5 text-sm text-slate-500">No invited accounts yet.</p> : <ul className="divide-y divide-slate-100">{accounts.map((account) => <li key={account._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-medium">Company account</p><p className="mt-0.5 text-xs text-slate-500">{account.department} · {account.position} · {account.accessLevel}</p></div><div className="flex items-center gap-3"><RoleBadge badge={account.publicBadge} /><Button type="button" size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void revoke(account._id)}>{busy === account._id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Revoke</Button></div></li>)}</ul>}
      </section>
    </div>
  );
}

type TeamMember = { userId: Id<"users">; name: string | null; role: string | null; department: string | null; position: string | null; isStaff: boolean; badge: PublicBadge | null };

function TeamPanel({ members }: { members: TeamMember[] | null | undefined }) {
  const setAssignment = useMutation(api.staff.setAssignment);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function save(member: TeamMember, department: string, position: string, badge: PublicBadge) {
    setError(""); setSavedId(null); setBusyId(member.userId);
    try { await setAssignment({ userId: member.userId, department, position, badge }); setSavedId(member.userId); }
    catch { setError("Could not save the assignment. Please try again."); }
    finally { setBusyId(null); }
  }

  if (members === undefined) return <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-slate-400" /></div>;
  if (members === null) return <p className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm">Admin access required.</p>;
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-slate-600">Assign a department and position to grant staff portal access. Clear both fields to remove it.</p>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <datalist id="ow-departments">{DEPARTMENTS.map((item) => <option key={item} value={item} />)}</datalist>
      <datalist id="ow-positions">{POSITIONS.map((item) => <option key={item} value={item} />)}</datalist>
      {members.length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm">No accounts found.</p> : members.map((member) => <TeamRow key={member.userId} member={member} busy={busyId === member.userId} saved={savedId === member.userId} onSave={save} />)}
    </div>
  );
}

function TeamRow({ member, busy, saved, onSave }: { member: TeamMember; busy: boolean; saved: boolean; onSave: (member: TeamMember, department: string, position: string, badge: PublicBadge) => Promise<void> }) {
  const defaultBadge = member.badge ?? deriveBadge(member.department, member.position);
  const [department, setDepartment] = useState(member.department ?? "");
  const [position, setPosition] = useState(member.position ?? "");
  const [badge, setBadge] = useState<PublicBadge>(defaultBadge);
  const isDirty = department !== (member.department ?? "") || position !== (member.position ?? "") || badge !== defaultBadge;
  const active = Boolean(department.trim() || position.trim());
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="flex items-center gap-2 text-sm font-semibold">{member.name || "Company account"}{member.isStaff && <RoleBadge badge={member.badge ?? defaultBadge} />}</p><p className="text-xs text-slate-500">{member.isStaff ? "Staff access on" : "Staff access off"}</p></div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-1"><Label htmlFor={`dept-${member.userId}`}>Department</Label><Input id={`dept-${member.userId}`} list="ow-departments" maxLength={80} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Engineering" /></div>
        <div className="space-y-1"><Label htmlFor={`position-${member.userId}`}>Position</Label><Input id={`position-${member.userId}`} list="ow-positions" maxLength={100} value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Developer" /></div>
        <div className="space-y-1"><Label htmlFor={`badge-${member.userId}`}>Badge</Label><select id={`badge-${member.userId}`} value={badge} onChange={(e) => setBadge(e.target.value as PublicBadge)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="staff">Staff</option><option value="dev">Dev</option></select></div>
      </div>
      <div className="mt-3 flex items-center gap-3"><Button size="sm" disabled={!isDirty || busy || (!active && !member.isStaff)} onClick={() => void onSave(member, department, position, badge)}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{member.isStaff ? "Save" : "Give staff access"}</Button>{saved && <span className="text-xs text-emerald-700">Saved</span>}</div>
    </article>
  );
}
