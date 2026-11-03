import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link, useSearchParams } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Check,
  Clock,
  Flag,
  Gavel,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  Network,
  ScrollText,
  Search,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SiteNav } from "@/components/SiteNav";
import { StaffUnlock } from "@/components/StaffUnlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { displayNameFor } from "@/lib/staff";

type Tab = "overview" | "reports" | "accounts" | "appeals" | "network" | "audit" | "permissions";
type Capability = "view" | "warn" | "suspend" | "ban" | "ip-ban" | "review-appeals" | "view-audit";

const TABS: Array<{ id: Tab; label: string; icon: typeof Shield }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "accounts", label: "Accounts", icon: Users },
  { id: "appeals", label: "Appeals", icon: Gavel },
  { id: "network", label: "Network blocks", icon: Network },
  { id: "audit", label: "Audit log", icon: ScrollText },
  { id: "permissions", label: "Permissions", icon: SlidersHorizontal },
];

const CAPABILITY_LABELS: Record<Capability, string> = {
  view: "View reports and accounts",
  warn: "Issue warnings",
  suspend: "Suspend accounts up to 30 days",
  ban: "Permanent bans",
  "ip-ban": "IP / CIDR network blocks",
  "review-appeals": "Review appeals",
  "view-audit": "View the audit log",
};

const CAPABILITY_SHORT: Record<Capability, string> = {
  view: "View",
  warn: "Warn",
  suspend: "Suspend",
  ban: "Ban",
  "ip-ban": "IP ban",
  "review-appeals": "Appeals",
  "view-audit": "Audit",
};

const REPORT_CATEGORIES: Record<string, string> = {
  harassment: "Harassment",
  "hate-speech": "Hate speech",
  scam: "Scam or fraud",
  cheating: "Cheating",
  "inappropriate-content": "Inappropriate content",
  "display-name": "Display name",
  "profile-picture": "Profile picture",
  "terms-violation": "Terms violation",
  other: "Other",
};

const AUDIT_ACTIONS: Record<string, string> = {
  "ban-temporary": "Temporary ban",
  "ban-permanent": "Permanent ban",
  unban: "Restriction lifted",
  "report-dismissed": "Report dismissed",
  "report-warned": "Player warned",
  "report-banned": "Banned from report",
  "automatic-warning": "Automatic warning",
  "automatic-ban": "Automatic temporary ban",
  "account-warned": "Warning issued",
  "account-suspended": "Account suspended",
  "account-banned": "Account banned",
  "ip-ban-added": "IP block added",
  "ip-ban-lifted": "IP block lifted",
  "permissions-updated": "Permissions updated",
  "appeal-approved": "Appeal approved",
  "appeal-declined": "Appeal declined",
  "image-blocked": "Image blocked",
  "image-reviewed": "Image reviewed",
};

type ReportItem = {
  _id: Id<"playerReports">;
  category: string;
  message: string;
  createdAt: number;
  reporterLabel: string;
  targetLabel: string;
  targetUsername: string | null;
  targetProfileKey: string | null;
  targetId: Id<"users">;
  evidenceLinks: string[];
};

type Access = {
  isAdmin: boolean;
  canView: boolean;
  canAct: boolean;
  canWarn: boolean;
  canSuspend: boolean;
  canBan: boolean;
  canPermanentBan: boolean;
  canIpBan: boolean;
  canViewAppeals: boolean;
  canReviewAppeals: boolean;
  canViewAudit: boolean;
  capabilities: Capability[];
  source: "admin" | "configured" | "default" | "none";
  department: string | null;
  position: string | null;
};

function formatTime(timestamp: number | null | undefined) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function shortDate(timestamp: number | null | undefined) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function StatCard({ label, value, detail, tone = "default" }: {
  label: string;
  value: number | string;
  detail: string;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass = tone === "danger"
    ? "border-red-200 bg-red-50/70"
    : tone === "warning"
      ? "border-amber-200 bg-amber-50/70"
      : "border-[#dce5df] bg-white";
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function CapabilityPill({ capability }: { capability: Capability }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#c9d9ce] bg-[#eef4ef] px-2 py-0.5 text-[11px] font-medium text-[#14583c]">
      {CAPABILITY_SHORT[capability]}
    </span>
  );
}

function ReportCard({ report, access }: { report: ReportItem; access: Access }) {
  const review = useMutation(api.moderation.reviewReport);
  const [note, setNote] = useState("");
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ready = note.trim().length >= 10;

  async function decide(decision: "dismiss" | "warn" | "ban-temporary" | "ban-permanent") {
    setBusy(true);
    setError("");
    try {
      await review({ reportId: report._id, decision, reason: note, days });
      setNote("");
    } catch (err) {
      setError(errorMessage(err, "Could not save this decision."));
    } finally {
      setBusy(false);
    }
  }

  const tooLongForSuspend = days > 30 && !access.canBan;
  return (
    <article className="rounded-xl border border-[#dce5df] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">
            {report.targetLabel}
            {report.targetProfileKey && (
              <Link to={`/players/${encodeURIComponent(report.targetProfileKey)}`} className="ml-2 text-xs font-medium text-[#14583c] hover:underline">
                {report.targetUsername ? `@${report.targetUsername}` : "View profile"}
              </Link>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">Reported by {report.reporterLabel} · {formatTime(report.createdAt)}</p>
        </div>
        <span className="rounded-full border border-[#dce5df] bg-[#f8faf8] px-2.5 py-1 text-xs font-medium text-slate-600">
          {REPORT_CATEGORIES[report.category] ?? report.category}
        </span>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{report.message}</p>
      <div className="mt-4 rounded-lg border border-[#e1e8e3] bg-[#f8faf8] p-3">
        <p className="text-xs font-semibold text-slate-700">Evidence supplied by the reporter</p>
        {report.evidenceLinks.length ? (
          <ul className="mt-1.5 space-y-1">
            {report.evidenceLinks.map((link) => (
              <li key={link} className="truncate text-xs">
                <a href={link} target="_blank" rel="noopener noreferrer nofollow" className="text-[#14583c] underline">{link}</a>
              </li>
            ))}
          </ul>
        ) : <p className="mt-1 text-xs text-slate-500">No evidence links. Review the report carefully before acting.</p>}
        <p className="mt-1.5 text-[11px] text-slate-400">OpenWorlds does not fetch external evidence links. Check them yourself.</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <div className="space-y-1.5">
          <Label htmlFor={`review-note-${report._id}`} className="text-xs">Decision note (10–300 characters, saved to the audit log)</Label>
          <Input id={`review-note-${report._id}`} value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} placeholder="What did you check, and why is this the right outcome?" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`review-days-${report._id}`} className="text-xs">Days (1–{access.canBan ? 90 : 30})</Label>
          <Input id={`review-days-${report._id}`} type="number" min={1} max={access.canBan ? 90 : 30} value={days} onChange={(event) => setDays(Number(event.target.value))} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={!access.canAct || !ready || busy} onClick={() => void decide("dismiss")}>Dismiss</Button>
        <Button size="sm" variant="outline" disabled={!access.canWarn || !ready || busy} onClick={() => void decide("warn")}><AlertTriangle className="size-4" /> Warn</Button>
        <Button size="sm" disabled={!access.canSuspend || !ready || busy || tooLongForSuspend} onClick={() => void decide("ban-temporary")}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Clock className="size-4" />} Suspend
        </Button>
        <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" disabled={!access.canBan || !ready || busy} onClick={() => void decide("ban-permanent")}>
          <Ban className="size-4" /> Permanent ban
        </Button>
        {!access.canAct && <span className="text-xs text-slate-500">Your role can view reports but cannot take action.</span>}
        {tooLongForSuspend && <span className="text-xs text-amber-700">Suspensions over 30 days need ban permission.</span>}
      </div>
      {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-800">{error}</p>}
    </article>
  );
}

function AccountActionPanel({ account, access, onDone }: {
  account: {
    userId: Id<"users">;
    label: string;
    isBanned: boolean;
    isStaffAccount: boolean;
    isAdmin: boolean;
  };
  access: Access;
  onDone: () => void;
}) {
  const warn = useMutation(api.moderation.warnAccount);
  const restrict = useMutation(api.moderation.applyAccountAction);
  const unban = useMutation(api.moderation.unbanAccount);
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState<"warn" | "suspend" | "ban" | "unban" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const ready = reason.trim().length >= 10;
  const protectedAccount = account.isAdmin || (account.isStaffAccount && !access.isAdmin);

  async function run(action: "warn" | "suspend" | "ban" | "unban") {
    setBusy(action);
    setError("");
    setNotice("");
    try {
      if (action === "warn") await warn({ userId: account.userId, severity, reason });
      else if (action === "unban") await unban({ userId: account.userId, reason });
      else await restrict({ userId: account.userId, action, days, reason });
      setReason("");
      setNotice(action === "warn" ? "Warning issued and audited." : action === "unban" ? "Restriction lifted and audited." : action === "suspend" ? "Suspension applied and audited." : "Permanent ban applied and audited.");
      onDone();
    } catch (err) {
      setError(errorMessage(err, "Could not apply this moderation action."));
    } finally {
      setBusy(null);
    }
  }

  if (account.isBanned) {
    return (
      <section className="rounded-xl border border-[#dce5df] bg-white p-5">
        <h3 className="font-semibold">Restoration</h3>
        <p className="mt-1 text-sm text-slate-600">The account is currently restricted. Lifting it is recorded in the audit log.</p>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="account-unban-reason" className="text-xs">Reason for lifting (10–300 characters)</Label>
          <Input id="account-unban-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} />
        </div>
        <Button className="mt-3" size="sm" disabled={!ready || busy !== null || (account.isStaffAccount && !access.isAdmin)} onClick={() => void run("unban")}>
          {busy === "unban" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Lift restriction
        </Button>
        {account.isStaffAccount && !access.isAdmin && <p className="mt-2 text-xs text-slate-500">Only an administrator can change a staff account restriction.</p>}
        {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[#dce5df] bg-white p-5">
      <h3 className="font-semibold">Take action</h3>
      <p className="mt-1 text-sm text-slate-600">Every decision is tied to your account and saved to the audit log. The person receives the reason on their restriction screen.</p>
      {protectedAccount && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
          Only an administrator can restrict a staff or administrator account.
        </p>
      )}
      <div className="mt-4 space-y-1.5">
        <Label htmlFor="account-action-reason" className="text-xs">Reason (10–300 characters, shown to the account)</Label>
        <Textarea id="account-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} rows={3} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="account-warning-severity" className="text-xs">Warning severity</Label>
          <select id="account-warning-severity" value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)} className="h-10 w-full rounded-md border border-[#cfdad3] bg-white px-3 text-sm">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="account-suspend-days" className="text-xs">Suspension length (1–30 days)</Label>
          <Input id="account-suspend-days" type="number" min={1} max={30} value={days} onChange={(event) => setDays(Number(event.target.value))} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={!access.canWarn || !ready || busy !== null || protectedAccount} onClick={() => void run("warn")}>
          {busy === "warn" ? <Loader2 className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />} Warn
        </Button>
        <Button size="sm" disabled={!access.canSuspend || !ready || busy !== null || protectedAccount || days < 1 || days > 30} onClick={() => void run("suspend")}>
          {busy === "suspend" ? <Loader2 className="size-4 animate-spin" /> : <Clock className="size-4" />} Suspend
        </Button>
        <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" disabled={!access.canBan || !ready || busy !== null || protectedAccount} onClick={() => void run("ban")}>
          {busy === "ban" ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />} Permanent ban
        </Button>
      </div>
      {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
    </section>
  );
}

function AccountWorkspace({ access }: { access: Access }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<Id<"users"> | null>(null);
  const results = useQuery(api.moderation.searchAccounts, search.trim().length >= 2 ? { search: search.trim() } : "skip");
  const snapshot = useQuery(api.moderation.accountSnapshot, selectedId ? { userId: selectedId } : "skip");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-xl border border-[#dce5df] bg-white p-5">
        <h2 className="font-semibold">Find an account</h2>
        <p className="mt-1 text-sm text-slate-600">Search by OpenWorlds username, display name, or staff nickname. Emails are never returned.</p>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="username or display name" className="pl-9" />
        </div>
        <div className="mt-4 divide-y divide-[#edf1ee]">
          {search.trim().length < 2 ? (
            <p className="py-4 text-sm text-slate-500">Type at least two characters.</p>
          ) : results === undefined ? (
            <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-slate-400" /></div>
          ) : results.accounts.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">No matching account.</p>
          ) : results.accounts.map((account) => (
            <button
              key={account.userId}
              type="button"
              onClick={() => setSelectedId(account.userId)}
              className={`flex w-full items-center justify-between gap-3 py-3 text-left transition ${selectedId === account.userId ? "text-[#14583c]" : "hover:text-[#14583c]"}`}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{account.label}</span>
                <span className="block truncate text-xs text-slate-500">
                  {account.username ? `@${account.username}` : "No username"}
                  {account.isStaffAccount ? " · Staff account" : ""}
                </span>
              </span>
              {account.isBanned ? (
                <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] text-red-700">{account.banType === "permanent" ? "Banned" : "Suspended"}</span>
              ) : (
                <ArrowRight className="size-4 shrink-0 text-slate-300" />
              )}
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-5">
        {!selectedId ? (
          <section className="rounded-xl border border-dashed border-[#cfdad3] bg-[#f8faf8] p-8 text-center">
            <UserRound className="mx-auto size-8 text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-700">Choose an account to review</p>
            <p className="mt-1 text-sm text-slate-500">You will see warnings, reports, restriction state, and the actions your role can take.</p>
          </section>
        ) : snapshot === undefined ? (
          <div className="flex justify-center rounded-xl border border-[#dce5df] bg-white py-16"><Loader2 className="size-5 animate-spin text-slate-400" /></div>
        ) : snapshot === null ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">That account could not be loaded.</p>
        ) : (
          <>
            <section className="rounded-xl border border-[#dce5df] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  {snapshot.image ? (
                    <img src={snapshot.image} alt="" className="size-14 rounded-full border border-[#dce5df] object-cover" />
                  ) : (
                    <span className="flex size-14 items-center justify-center rounded-full bg-[#eef4ef] text-lg font-semibold text-[#14583c]">{(snapshot.label[0] ?? "?").toUpperCase()}</span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{snapshot.label}</h2>
                    <p className="text-xs text-slate-500">{snapshot.username ? `@${snapshot.username}` : "No public username"}{snapshot.isStaffAccount ? " · Staff account" : ""}</p>
                    {snapshot.bio && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{snapshot.bio}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {snapshot.profileKey && <Button asChild size="sm" variant="outline"><Link to={`/players/${encodeURIComponent(snapshot.profileKey)}`}>Open profile</Link></Button>}
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${snapshot.isBanned ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                    {snapshot.isBanned ? snapshot.banType === "permanent" ? "Permanently banned" : "Suspended" : "Active"}
                  </span>
                </div>
              </div>
              {snapshot.isBanned && (
                <div className="mt-4 rounded-lg border border-red-100 bg-red-50/60 p-3 text-sm text-red-900">
                  <p className="font-medium">{snapshot.banReason ?? "No reason recorded"}</p>
                  <p className="mt-1 text-xs text-red-700">{snapshot.banType === "permanent" ? "No expiry" : `Ends ${formatTime(snapshot.banExpiresAt)}`}</p>
                </div>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div><p className="text-xs text-slate-500">Warnings</p><p className="text-lg font-semibold">{snapshot.warnings.length}</p></div>
                <div><p className="text-xs text-slate-500">Reports</p><p className="text-lg font-semibold">{snapshot.reports.length}</p></div>
                <div><p className="text-xs text-slate-500">Audit entries</p><p className="text-lg font-semibold">{snapshot.log.length}</p></div>
              </div>
            </section>

            <AccountActionPanel account={snapshot} access={access} onDone={() => setSelectedId(snapshot.userId)} />

            {snapshot.warnings.length > 0 && (
              <section className="rounded-xl border border-[#dce5df] bg-white p-5">
                <h3 className="font-semibold">Warnings</h3>
                <ul className="mt-3 space-y-3">
                  {snapshot.warnings.map((warning) => (
                    <li key={warning._id} className="rounded-lg border border-[#e3e9e5] bg-[#f8faf8] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium capitalize">{warning.severity} · {warning.source}</p>
                        <span className="text-xs text-slate-500">{formatTime(warning.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{warning.reason}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {snapshot.reports.length > 0 && (
              <section className="rounded-xl border border-[#dce5df] bg-white p-5">
                <h3 className="font-semibold">Report history</h3>
                <ul className="mt-3 divide-y divide-[#edf1ee]">
                  {snapshot.reports.map((report) => (
                    <li key={report._id} className="py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{REPORT_CATEGORIES[report.category] ?? report.category}</p>
                        <span className="text-xs text-slate-500">{report.status}{report.resolution ? ` · ${report.resolution}` : ""} · {shortDate(report.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{report.message}</p>
                      {report.evidenceLinks.length > 0 && <p className="mt-1 text-xs text-slate-500">{report.evidenceLinks.length} evidence link{report.evidenceLinks.length === 1 ? "" : "s"}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

type AppealItem = {
  _id: Id<"securityAppeals">;
  message: string;
  createdAt: number;
  email: string;
  userId: Id<"users">;
  name: string;
  username: string | null;
  profileKey: string | null;
  targetIsStaff: boolean;
  banType: "temporary" | "permanent";
  banReason: string;
  banExpiresAt: number | null;
  bannedAt: number | null;
  reports: Array<{ _id: Id<"playerReports">; category: string; message: string; evidenceLinks: string[]; resolution: string | null; createdAt: number }>;
  assessments: Array<{ _id: Id<"moderationAssessments">; category: string; severity: string; evidenceScore: number; status: string; actionTaken: string; reasons: string[]; createdAt: number }>;
};

function AppealCard({ appeal, access }: { appeal: AppealItem; access: Access }) {
  const review = useMutation(api.security.reviewAppeal);
  const [busy, setBusy] = useState<"approved" | "declined" | null>(null);
  const [error, setError] = useState("");
  const needsAdmin = appeal.targetIsStaff || (appeal.banType === "permanent" && !access.canBan);
  const staffBlocked = appeal.targetIsStaff && !access.isAdmin;
  const canApprove = access.canReviewAppeals && !staffBlocked && (appeal.banType !== "permanent" || access.canBan);

  async function decide(decision: "approved" | "declined") {
    setBusy(decision);
    setError("");
    try {
      await review({ appealId: appeal._id, decision });
    } catch (err) {
      setError(errorMessage(err, "Could not save this appeal decision."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="rounded-xl border border-[#dce5df] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{appeal.name}{appeal.username ? ` · @${appeal.username}` : ""}</p>
          <p className="mt-1 text-xs text-slate-500">Appeal received {formatTime(appeal.createdAt)} · {appeal.email || "No email on file"}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${appeal.banType === "permanent" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {appeal.banType === "permanent" ? "Permanent ban" : `Suspension · ends ${shortDate(appeal.banExpiresAt)}`}
        </span>
      </div>
      <div className="mt-4 rounded-lg border border-[#e3e9e5] bg-[#f8faf8] p-3">
        <p className="text-xs font-semibold text-slate-600">Original decision</p>
        <p className="mt-1 text-sm text-slate-800">{appeal.banReason}</p>
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Appeal message</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{appeal.message}</p>
      </div>
      {appeal.reports.length > 0 && (
        <details className="mt-4 rounded-lg border border-[#e3e9e5] p-3">
          <summary className="cursor-pointer text-sm font-medium">Original reports ({appeal.reports.length})</summary>
          <ul className="mt-3 space-y-3">
            {appeal.reports.map((report) => (
              <li key={report._id} className="border-t border-[#edf1ee] pt-3 first:border-0 first:pt-0">
                <p className="text-xs font-medium">{REPORT_CATEGORIES[report.category] ?? report.category} · {shortDate(report.createdAt)}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{report.message}</p>
                {report.evidenceLinks.length > 0 && (
                  <ul className="mt-1 space-y-1">{report.evidenceLinks.map((link) => <li key={link}><a href={link} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-[#14583c] underline">{link}</a></li>)}</ul>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
      {appeal.assessments.length > 0 && (
        <details className="mt-3 rounded-lg border border-[#e3e9e5] p-3">
          <summary className="cursor-pointer text-sm font-medium">Evidence assessments ({appeal.assessments.length})</summary>
          <ul className="mt-2 space-y-2 text-xs text-slate-600">
            {appeal.assessments.map((assessment) => (
              <li key={assessment._id}>{assessment.status.replace(/-/g, " ")} · {assessment.category} · score {assessment.evidenceScore}/100 · {assessment.reasons.join("; ")}</li>
            ))}
          </ul>
        </details>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={!canApprove || busy !== null} onClick={() => void decide("approved")}>
          {busy === "approved" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve &amp; restore access
        </Button>
        <Button size="sm" variant="outline" disabled={!access.canReviewAppeals || staffBlocked || busy !== null} onClick={() => void decide("declined")}>
          {busy === "declined" ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />} Decline
        </Button>
        {!access.canReviewAppeals && <span className="text-xs text-slate-500">Your role cannot decide appeals.</span>}
        {needsAdmin && access.canReviewAppeals && <span className="text-xs text-slate-500">This case needs an administrator or ban-level permission.</span>}
      </div>
      {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-800">{error}</p>}
    </article>
  );
}

function NetworkPanel({ access }: { access: Access }) {
  const data = useQuery(api.moderation.networkBans, access.canIpBan ? {} : "skip");
  const add = useMutation(api.moderation.addNetworkBan);
  const lift = useMutation(api.moderation.liftNetworkBan);
  const [network, setNetwork] = useState("");
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(0);
  const [busy, setBusy] = useState(false);
  const [lifting, setLifting] = useState<Id<"networkBans"> | null>(null);
  const [liftReason, setLiftReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await add({ network, reason, days });
      setNotice(`Network block saved for ${result.network}.`);
      setNetwork("");
      setReason("");
      setDays(0);
    } catch (err) {
      setError(errorMessage(err, "Could not save this network block."));
    } finally {
      setBusy(false);
    }
  }

  async function remove(banId: Id<"networkBans">) {
    setLifting(banId);
    setError("");
    setNotice("");
    try {
      await lift({ banId, reason: liftReason });
      setLiftReason("");
      setNotice("Network block lifted and audited.");
    } catch (err) {
      setError(errorMessage(err, "Could not lift this network block."));
    } finally {
      setLifting(null);
    }
  }

  if (!access.canIpBan) {
    return <Denied title="Network blocks" message="Your role does not include IP/CIDR network blocks. An administrator can add that capability in Permissions." />;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#dce5df] bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eef4ef] text-[#14583c]"><Network className="size-5" /></span>
          <div>
            <h2 className="font-semibold">IP / CIDR network blocks</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              These records are enforced at the edge or game server. The website runtime never exposes a visitor’s IP address to a Convex mutation, so an active block here is not applied by the website itself. The hosting edge can poll <code className="rounded bg-[#eef4ef] px-1 py-0.5 font-mono text-[11px]">GET /moderation/network-bans</code> with the <code className="rounded bg-[#eef4ef] px-1 py-0.5 font-mono text-[11px]">NETWORK_BLOCKLIST_SECRET</code> header once configured.
            </p>
          </div>
        </div>
        <form onSubmit={(event) => void submit(event)} className="mt-5 grid gap-3 sm:grid-cols-[1fr_8rem]">
          <div className="space-y-1.5">
            <Label htmlFor="network-block">IP address or CIDR range</Label>
            <Input id="network-block" value={network} onChange={(event) => setNetwork(event.target.value)} placeholder="203.0.113.42 or 203.0.113.0/24" required />
            <p className="text-xs leading-5 text-slate-500">IPv4 /16–/32 or IPv6 /48–/128 only, so a mistyped range cannot block the whole internet.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="network-days">Days (0 = permanent)</Label>
            <Input id="network-days" type="number" min={0} max={3650} value={days} onChange={(event) => setDays(Number(event.target.value))} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="network-reason">Reason (10–300 characters, saved to the audit log)</Label>
            <Input id="network-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} required />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy || network.trim().length < 3 || reason.trim().length < 10}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />} Add network block
            </Button>
          </div>
        </form>
        {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
      </section>

      <section className="rounded-xl border border-[#dce5df] bg-white">
        <div className="border-b border-[#edf1ee] p-5">
          <h2 className="font-semibold">Active network blocks</h2>
          <p className="mt-1 text-sm text-slate-600">Only roles with the IP ban capability can see this list.</p>
        </div>
        {data === undefined ? (
          <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-slate-400" /></div>
        ) : data.bans.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No active network blocks.</p>
        ) : (
          <ul className="divide-y divide-[#edf1ee]">
            {data.bans.map((ban) => (
              <li key={ban._id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold">{ban.network}</p>
                    <p className="mt-1 text-sm text-slate-600">{ban.reason}</p>
                    <p className="mt-1 text-xs text-slate-500">Added by {ban.createdByLabel} · {formatTime(ban.createdAt)} · {ban.expiresAt ? `ends ${formatTime(ban.expiresAt)}` : "no expiry"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input value={liftReason} onChange={(event) => setLiftReason(event.target.value)} placeholder="Reason for lifting" className="h-9 w-52" aria-label="Reason for lifting network block" />
                    <Button size="sm" variant="outline" disabled={lifting === ban._id || liftReason.trim().length < 10} onClick={() => void remove(ban._id)}>
                      {lifting === ban._id ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />} Lift
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type PermissionRole = {
  department: string;
  position: string;
  capabilities: Capability[];
  defaultCapabilities: Capability[];
  source: "default" | "configured";
};

function PermissionEditor({ role, onDone }: { role: PermissionRole; onDone: () => void }) {
  const save = useMutation(api.moderation.setRolePermissions);
  const reset = useMutation(api.moderation.resetRolePermissions);
  const [capabilities, setCapabilities] = useState<Capability[]>([...role.capabilities]);
  const [busy, setBusy] = useState<"save" | "reset" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dirty = capabilities.slice().sort().join("|") !== role.capabilities.slice().sort().join("|");

  function toggle(capability: Capability) {
    setCapabilities((current) => current.includes(capability) ? current.filter((item) => item !== capability) : [...current, capability]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("save");
    setError("");
    setNotice("");
    try {
      const result = await save({ department: role.department, position: role.position, capabilities });
      setCapabilities([...result.capabilities] as Capability[]);
      setNotice("Permissions saved. They apply immediately.");
      onDone();
    } catch (err) {
      setError(errorMessage(err, "Could not save these permissions."));
    } finally {
      setBusy(null);
    }
  }

  async function restoreDefault() {
    setBusy("reset");
    setError("");
    setNotice("");
    try {
      await reset({ department: role.department, position: role.position });
      setCapabilities([...role.defaultCapabilities]);
      setNotice("Custom permissions removed. The built-in default is active again.");
      onDone();
    } catch (err) {
      setError(errorMessage(err, "Could not reset these permissions."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="rounded-xl border border-[#dce5df] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Editing role</p>
          <h3 className="mt-1 font-semibold">{role.position}</h3>
          <p className="text-sm text-slate-600">{role.department}</p>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${role.source === "configured" ? "border-sky-200 bg-sky-50 text-sky-800" : "border-[#dce5df] bg-[#f8faf8] text-slate-600"}`}>
          {role.source === "configured" ? "Custom" : "Built-in default"}
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(Object.keys(CAPABILITY_LABELS) as Capability[]).map((capability) => (
          <label key={capability} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition ${capabilities.includes(capability) ? "border-[#b9d0bf] bg-[#f2f7f3]" : "border-[#e3e9e5] hover:bg-[#f8faf8]"}`}>
            <input type="checkbox" checked={capabilities.includes(capability)} onChange={() => toggle(capability)} className="mt-0.5 size-4 accent-[#14583c]" />
            <span>
              <span className="font-medium">{CAPABILITY_LABELS[capability]}</span>
              {capability === "ban" && <span className="mt-0.5 block text-xs text-slate-500">Staff and administrator accounts always need an administrator.</span>}
              {capability === "ip-ban" && <span className="mt-0.5 block text-xs text-slate-500">Records a block for edge/game-server enforcement.</span>}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={busy !== null || !dirty}>{busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save permissions</Button>
        {role.source === "configured" && <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => void restoreDefault()}>{busy === "reset" ? <Loader2 className="size-4 animate-spin" /> : null} Reset to default</Button>}
        {!dirty && role.source === "default" && <span className="text-xs text-slate-500">Change a capability to save an override.</span>}
      </div>
      {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
    </form>
  );
}

function PermissionsPanel({ access }: { access: Access }) {
  const matrix = useQuery(api.moderation.permissionMatrix, access.isAdmin ? {} : "skip");
  const [selectedKey, setSelectedKey] = useState("");
  const [custom, setCustom] = useState(false);
  const [customDepartment, setCustomDepartment] = useState("");
  const [customPosition, setCustomPosition] = useState("");
  const [customRole, setCustomRole] = useState<PermissionRole | null>(null);

  if (!access.isAdmin) {
    return <Denied title="Permissions" message="Only a verified administrator can change moderation capabilities." />;
  }
  if (matrix === undefined) {
    return <div className="flex justify-center rounded-xl border border-[#dce5df] bg-white py-16"><Loader2 className="size-5 animate-spin text-slate-400" /></div>;
  }
  if (!matrix) return <Denied title="Permissions" message="Only a verified administrator can change moderation capabilities." />;

  const roles = matrix.roles as PermissionRole[];
  const fallbackKey = roles[0] ? `${roles[0].department}||${roles[0].position}` : "";
  const activeKey = selectedKey || fallbackKey;
  const selected = customRole ?? roles.find((role) => `${role.department}||${role.position}` === activeKey) ?? roles[0];
  const departments = [...new Set(roles.map((role) => role.department))];

  function chooseRole(key: string) {
    setSelectedKey(key);
    setCustom(false);
    setCustomRole(null);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#dce5df] bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eef4ef] text-[#14583c]"><KeyRound className="size-5" /></span>
          <div>
            <h2 className="font-semibold">Moderation permissions</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Only administrators can edit these grants. Choose a department and position, then tick the exact powers it should have. Administrators keep every capability. Changes apply on the next request and every change is written to the audit log.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="permission-role">Department and position</Label>
            <select id="permission-role" value={activeKey} onChange={(event) => chooseRole(event.target.value)} className="h-10 w-full rounded-md border border-[#cfdad3] bg-white px-3 text-sm">
              {departments.map((department) => (
                <optgroup key={department} label={department}>
                  {roles.filter((role) => role.department === department).map((role) => (
                    <option key={`${role.department}||${role.position}`} value={`${role.department}||${role.position}`}>{role.position}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={() => { setCustom(true); setCustomRole(null); setSelectedKey(""); }}>
              Add custom role
            </Button>
          </div>
        </div>
        {custom && (
          <div className="mt-4 grid gap-3 rounded-lg border border-[#e3e9e5] bg-[#f8faf8] p-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="custom-department">Department</Label>
              <Input id="custom-department" value={customDepartment} onChange={(event) => setCustomDepartment(event.target.value)} placeholder="Community Operations & Player Engagement" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-position">Position</Label>
              <Input id="custom-position" value={customPosition} onChange={(event) => setCustomPosition(event.target.value)} placeholder="Community Operations Coordinator" />
            </div>
            <div className="sm:col-span-2">
              <Button type="button" size="sm" disabled={!customDepartment.trim() || !customPosition.trim()} onClick={() => setCustomRole({ department: customDepartment.trim(), position: customPosition.trim(), capabilities: ["view"], defaultCapabilities: [], source: "configured" })}>
                Create role editor
              </Button>
            </div>
          </div>
        )}
      </section>

      {selected && <PermissionEditor key={`${selected.department}||${selected.position}`} role={selected} onDone={() => { setCustomRole(null); }} />}

      <section className="rounded-xl border border-[#dce5df] bg-white">
        <div className="border-b border-[#edf1ee] p-5">
          <h2 className="font-semibold">Effective roles</h2>
          <p className="mt-1 text-sm text-slate-600">The built-in defaults are suggestions. Any custom row overrides the default for that department and position.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-2.5 font-medium">Department</th><th className="px-5 py-2.5 font-medium">Position</th><th className="px-5 py-2.5 font-medium">Capabilities</th><th className="px-5 py-2.5 font-medium">Source</th></tr>
            </thead>
            <tbody className="divide-y divide-[#edf1ee]">
              {roles.map((role) => (
                <tr key={`${role.department}||${role.position}`} className="hover:bg-[#f8faf8]">
                  <td className="px-5 py-3 text-slate-600">{role.department}</td>
                  <td className="px-5 py-3 font-medium">{role.position}</td>
                  <td className="px-5 py-3"><div className="flex flex-wrap gap-1">{role.capabilities.length ? role.capabilities.map((capability) => <CapabilityPill key={capability} capability={capability} />) : <span className="text-xs text-slate-400">No access</span>}</div></td>
                  <td className="px-5 py-3 text-xs capitalize text-slate-500">{role.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Denied({ title, message }: { title: string; message: string }) {
  return (
    <section className="rounded-xl border border-[#dce5df] bg-white p-8 text-center">
      <Lock className="mx-auto size-8 text-slate-400" />
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-600">{message}</p>
    </section>
  );
}

export default function ModerationPage() {
  const access = useQuery(api.moderation.myAccess);
  const me = useQuery(api.staff.me);
  const queue = useQuery(api.moderation.queue);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") as Tab | null;
  const tab: Tab = requestedTab && TABS.some((item) => item.id === requestedTab) ? requestedTab : "overview";
  const appeals = useQuery(api.moderation.appealsQueue, tab === "appeals" && access?.canViewAppeals ? {} : "skip");

  function setTab(next: Tab) {
    setSearchParams({ tab: next });
  }

  const visibleTabs = TABS.filter((item) => {
    if (item.id === "appeals") return Boolean(access?.canViewAppeals);
    if (item.id === "network") return Boolean(access?.canIpBan);
    if (item.id === "audit") return Boolean(access?.canViewAudit);
    if (item.id === "permissions") return Boolean(access?.isAdmin);
    return true;
  });

  useEffect(() => {
    if (!visibleTabs.some((item) => item.id === tab)) setTab("overview");
  }, [tab, visibleTabs, setTab]);

  return (
    <div className="min-h-screen bg-[#f4f6f2] text-slate-900">
      <SiteNav />
      <header className="border-b border-[#244435] bg-[#0d2f22] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15"><ShieldCheck className="size-6" /></span>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a9c8b6]">OpenWorlds Trust &amp; Safety</p>
              <h1 className="text-xl font-semibold tracking-tight">Moderation console</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {me?.signedIn && <span className="text-[#cfe0d5]">{displayNameFor(me)}{access?.position ? ` · ${access.position}` : ""}</span>}
            <Link to="/staff/overview" className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10">Staff workspace</Link>
            <Link to="/rules" className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10">Community rules</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        {access === undefined || queue === undefined ? (
          <div className="flex justify-center py-24"><Loader2 className="size-6 animate-spin text-[#14583c]" /></div>
        ) : !access.canView ? (
          <div className="mx-auto max-w-2xl rounded-xl border border-[#dce5df] bg-white p-8 text-center">
            <Lock className="mx-auto size-9 text-slate-400" />
            <h2 className="mt-3 text-lg font-semibold">Moderation access is limited</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {me?.signedIn ? "Your account does not have a moderation department and position assignment. Ask an administrator to review your role." : "Sign in with an approved staff account to open the moderation console."}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button asChild variant="outline"><Link to="/staff/overview">Staff workspace</Link></Button>
              <Button asChild><Link to="/support">Contact support</Link></Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
            <aside className="min-w-0">
              <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[#dce5df] bg-white p-1.5 lg:flex-col lg:overflow-visible" aria-label="Moderation sections">
                {visibleTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${tab === id ? "bg-[#14583c] font-semibold text-white" : "text-slate-600 hover:bg-[#f3f7f4] hover:text-slate-900"}`}
                  >
                    <Icon className="size-4" /> {label}
                  </button>
                ))}
              </nav>
              <section className="mt-4 rounded-xl border border-[#dce5df] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your access</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {access.capabilities.map((capability) => <CapabilityPill key={capability} capability={capability} />)}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {access.isAdmin ? "Administrator · all capabilities" : `${access.department ?? "No department"} · ${access.position ?? "No position"}`}
                </p>
                <div className="mt-3"><StaffUnlock description="Unlock enforcement actions for this session." /></div>
              </section>
              <p className="mt-4 px-1 text-[11px] leading-5 text-slate-500">Sensitive actions require the authenticator unlock. Every warning, restriction, appeal decision, permission change, and network block is attributed in the audit log.</p>
            </aside>

            <main className="min-w-0">
              {tab === "overview" && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">Today at a glance</h2>
                      <p className="mt-1 text-sm text-slate-600">Reports and restrictions from across OpenWorlds.</p>
                    </div>
                    <Button size="sm" onClick={() => setTab("reports")}>Open report queue <ArrowRight className="size-4" /></Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Open reports" value={queue.reports.length} detail="Awaiting a decision" tone={queue.reports.length ? "warning" : "default"} />
                    <StatCard label="Active restrictions" value={queue.bans.length} detail="Accounts currently banned or suspended" tone={queue.bans.length ? "danger" : "default"} />
                    <StatCard label="Pending appeals" value={access.canViewAppeals ? queue.appeals.length : "—"} detail={access.canViewAppeals ? "Waiting for review" : "Not visible to your role"} />
                    <StatCard label="Image cases" value={queue.media.length} detail="Automatic image-safety reviews" />
                  </div>
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <section className="rounded-xl border border-[#dce5df] bg-white">
                      <div className="flex items-center justify-between border-b border-[#edf1ee] p-5">
                        <div><h3 className="font-semibold">Recent decisions</h3><p className="mt-0.5 text-xs text-slate-500">Accountability trail for moderation actions.</p></div>
                        {access.canViewAudit && <button type="button" className="text-xs font-medium text-[#14583c] hover:underline" onClick={() => setTab("audit")}>View all</button>}
                      </div>
                      {!access.canViewAudit ? <p className="p-5 text-sm text-slate-500">Your role does not include the audit log.</p> : queue.audit.length === 0 ? <p className="p-5 text-sm text-slate-500">No moderation decisions recorded yet.</p> : (
                        <ul className="divide-y divide-[#edf1ee]">
                          {queue.audit.slice(0, 6).map((entry) => (
                            <li key={entry._id} className="p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium">{AUDIT_ACTIONS[entry.action] ?? entry.action}</p>
                                <span className="text-xs text-slate-500">{formatTime(entry.createdAt)}</span>
                              </div>
                              <p className="mt-1 text-xs text-slate-600">{entry.targetLabel} · {entry.actorLabel}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{entry.reason}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                    <section className="rounded-xl border border-[#dce5df] bg-white p-5">
                      <h3 className="font-semibold">Role and safeguards</h3>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Department</dt><dd className="text-right font-medium">{access.department ?? "—"}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Position</dt><dd className="text-right font-medium">{access.position ?? "—"}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Permission source</dt><dd className="text-right font-medium capitalize">{access.source}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Permanent bans</dt><dd className="text-right font-medium">{access.canBan ? "Allowed" : "Not allowed"}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Staff-account cases</dt><dd className="text-right font-medium">{access.isAdmin ? "Admin only" : "No access"}</dd></div>
                      </dl>
                      <div className="mt-4 rounded-lg border border-[#e3e9e5] bg-[#f8faf8] p-3 text-xs leading-5 text-slate-600">
                        Permanent bans, staff-account restrictions, and staff-account appeals always require an administrator. A moderator cannot review an appeal for a ban they issued.
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {tab === "reports" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div><h2 className="text-2xl font-semibold tracking-tight">Report queue</h2><p className="mt-1 text-sm text-slate-600">Read the evidence, then dismiss, warn, suspend, or ban.</p></div>
                    <span className="text-sm text-slate-500">{queue.reports.length} open</span>
                  </div>
                  {queue.reports.length === 0 ? <section className="rounded-xl border border-[#dce5df] bg-white p-8 text-center text-sm text-slate-500">No open reports.</section> : queue.reports.map((report) => <ReportCard key={report._id} report={report as ReportItem} access={access as Access} />)}
                </div>
              )}

              {tab === "accounts" && <AccountWorkspace access={access as Access} />}

              {tab === "appeals" && (
                <div className="space-y-4">
                  <div><h2 className="text-2xl font-semibold tracking-tight">Appeals</h2><p className="mt-1 text-sm text-slate-600">Review the original decision and evidence before restoring access.</p></div>
                  {appeals === undefined ? <div className="flex justify-center py-16"><Loader2 className="size-5 animate-spin text-slate-400" /></div> : !appeals.canView ? <Denied title="Appeals" message="Your role can view moderation cases but not appeal messages." /> : appeals.appeals.length === 0 ? <section className="rounded-xl border border-[#dce5df] bg-white p-8 text-center text-sm text-slate-500">No appeals waiting.</section> : appeals.appeals.map((appeal) => <AppealCard key={appeal._id} appeal={appeal as AppealItem} access={access as Access} />)}
                </div>
              )}

              {tab === "network" && <NetworkPanel access={access as Access} />}

              {tab === "audit" && (
                <div className="space-y-4">
                  <div><h2 className="text-2xl font-semibold tracking-tight">Audit log</h2><p className="mt-1 text-sm text-slate-600">Every moderation decision is attributed to an account.</p></div>
                  {!access.canViewAudit ? <Denied title="Audit log" message="Your role does not include the moderation audit log." /> : queue.audit.length === 0 ? <section className="rounded-xl border border-[#dce5df] bg-white p-8 text-center text-sm text-slate-500">No entries yet.</section> : (
                    <section className="overflow-hidden rounded-xl border border-[#dce5df] bg-white">
                      <ul className="divide-y divide-[#edf1ee]">
                        {queue.audit.map((entry) => (
                          <li key={entry._id} className="p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold">{AUDIT_ACTIONS[entry.action] ?? entry.action}</p>
                              <span className="text-xs text-slate-500">{formatTime(entry.createdAt)}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">Target: {entry.targetLabel} · Actor: {entry.actorLabel}</p>
                            <p className="mt-1 text-sm text-slate-700">{entry.reason}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}

              {tab === "permissions" && <PermissionsPanel access={access as Access} />}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
