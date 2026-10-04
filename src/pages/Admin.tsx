import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router";
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  Loader2,
  LockKeyhole,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";

const SUPPORT_EMAIL = "support@openworlds.dk";

const statusStyles: Record<string, string> = {
  open: "bg-blue-50 text-[#0052a3] border-blue-200",
  responded: "bg-violet-50 text-[#7651c9] border-violet-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
  new: "bg-blue-50 text-[#0052a3] border-blue-200",
  reviewing: "bg-violet-50 text-[#7651c9] border-violet-200",
  shortlisted: "bg-amber-50 text-amber-800 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
  declined: "bg-red-50 text-red-800 border-red-200",
  archived: "bg-slate-100 text-slate-600 border-slate-200",
};

const applicationStatuses = ["new", "reviewing", "shortlisted", "accepted", "declined", "archived"];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${statusStyles[status] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>
      {status}
    </span>
  );
}

export default function Admin() {
  const { isLoading, isAuthenticated, user } = useAuth();

  const authorized = useMemo(() => {
    if (!user) return false;
    const email = user.email?.trim().toLowerCase();
    return user.role === "admin" || email === SUPPORT_EMAIL;
  }, [user]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-12 text-white sm:px-8 sm:py-14">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-blue-100">
              <ShieldCheck className="size-4" /> OpenWorlds Team
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Admin dashboard</h1>
            <p className="mt-2 text-blue-50">Review support tickets and contributor applications.</p>
          </div>
          {isAuthenticated && (
            <div className="text-sm text-blue-50">
              <p className="flex items-center gap-2">
                <UserRound className="size-4" /> {user?.email ?? "signed in"}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : !isAuthenticated ? (
          <AdminSignIn />
        ) : !authorized ? (
          <AccessDenied email={user?.email ?? ""} />
        ) : (
          <AdminDashboard />
        )}
      </section>
    </main>
  );
}

function AdminSignIn() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState(SUPPORT_EMAIL);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn("email-otp", { email: email.trim().toLowerCase() });
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a code to that address.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn("email-otp", { email: email.trim().toLowerCase(), code });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code was not accepted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-7">
      <div className="flex size-11 items-center justify-center rounded-lg bg-violet-50 text-[#7651c9]">
        <LockKeyhole className="size-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Team sign in</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Only the verified OpenWorlds support address can access this dashboard. We will email you a
        one-time code.
      </p>

      {step === "email" ? (
        <form onSubmit={requestCode} className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Support email</Label>
            <Input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Sending code..." : "Email me a code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-5 space-y-4">
          <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            If a code was sent to <span className="font-medium">{email}</span>, enter it below. Codes expire
            after 15 minutes.
          </p>
          <div className="space-y-2">
            <Label htmlFor="admin-code">Code</Label>
            <Input
              id="admin-code"
              inputMode="numeric"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="6-digit code"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Verifying..." : "Sign in"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError("");
            }}
            className="w-full text-xs text-slate-500 hover:underline"
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="mt-5 text-xs leading-5 text-slate-500">
        If the code does not arrive, the support mailbox may not be reachable yet. Contact the site owner to
        configure a working admin sign-in.
      </p>
    </div>
  );
}

function AccessDenied({ email }: { email: string }) {
  const { signOut } = useAuth();
  return (
    <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <AlertCircle className="mx-auto size-6 text-amber-700" />
      <h2 className="mt-3 font-semibold text-amber-900">Access denied</h2>
      <p className="mt-2 text-sm leading-6 text-amber-900">
        {email ? `${email} is not authorized to view the admin dashboard.` : "You are not authorized to view the admin dashboard."}
      </p>
      <Button variant="outline" className="mt-4" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  );
}

function AdminDashboard() {
  const { signOut, user } = useAuth();
  const tickets = useQuery(api.supportTickets.listForAdmin);
  const applications = useQuery(api.careerApplications.listForAdmin);

  const markResponded = useMutation(api.supportTickets.markResponded);
  const closeTicket = useMutation(api.supportTickets.closeTicket);
  const reopenTicket = useMutation(api.supportTickets.reopenTicket);
  const removeTicket = useMutation(api.supportTickets.removeTicket);
  const setApplicationStatus = useMutation(api.careerApplications.setStatus);
  const removeApplication = useMutation(api.careerApplications.remove);

  const [tab, setTab] = useState<"tickets" | "applications">("tickets");
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "responded" | "closed">("all");
  const [actionError, setActionError] = useState("");

  const allTickets = tickets ?? [];
  const applicationList = applications ?? [];
  const visibleTickets = ticketFilter === "all" ? allTickets : allTickets.filter((t) => t.status === ticketFilter);

  const ticketCounts = {
    open: allTickets.filter((t) => t.status === "open").length,
    responded: allTickets.filter((t) => t.status === "responded").length,
    closed: allTickets.filter((t) => t.status === "closed").length,
  };

  async function run(action: () => Promise<unknown>) {
    setActionError("");
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button variant={tab === "tickets" ? "default" : "outline"} onClick={() => setTab("tickets")}>
            <Inbox className="size-4" /> Tickets
            <span className="ml-1 rounded bg-white/20 px-1.5 text-xs">{allTickets.length}</span>
          </Button>
          <Button variant={tab === "applications" ? "default" : "outline"} onClick={() => setTab("applications")}>
            <UserRound className="size-4" /> Applications
            <span className="ml-1 rounded bg-white/20 px-1.5 text-xs">{applicationList.length}</span>
          </Button>
        </div>
        <Button variant="outline" onClick={() => signOut()}>
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>

      <p className="mt-3 text-xs text-slate-500">Signed in as {user?.email}. Lists update in real time.</p>

      {actionError && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{actionError}</p>
      )}

      {tickets === undefined || applications === undefined ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : tab === "tickets" ? (
        <div className="mt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Open" value={ticketCounts.open} />
            <StatCard label="Responded" value={ticketCounts.responded} />
            <StatCard label="Closed" value={ticketCounts.closed} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(["all", "open", "responded", "closed"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTicketFilter(filter)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition ${
                  ticketFilter === filter
                    ? "border-[#0066cc] bg-[#0066cc] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {visibleTickets.length === 0 ? (
            <p className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              No tickets in this view.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {visibleTickets.map((ticket) => (
                <article key={ticket._id} className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{ticket.reference ?? "—"}</span>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {ticket.name || "No name"} ·{" "}
                        <a href={`mailto:${ticket.email}`} className="text-[#0066cc] hover:underline">
                          {ticket.email}
                        </a>
                        {ticket.username ? ` · @${ticket.username}` : ""}
                      </p>
                    </div>
                    <time className="text-xs text-slate-500" dateTime={new Date(ticket.submittedAt).toISOString()}>
                      {new Date(ticket.submittedAt).toLocaleString()}
                    </time>
                  </div>

                  <p className="mt-3 text-sm font-medium text-slate-700">{ticket.reason}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{ticket.message}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => run(() => markResponded({ ticketId: ticket._id }))}
                    >
                      <CheckCircle2 className="size-4" /> Mark responded
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => run(() => closeTicket({ ticketId: ticket._id }))}>
                      <XCircle className="size-4" /> Close
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => run(() => reopenTicket({ ticketId: ticket._id }))}>
                      <RefreshCcw className="size-4" /> Reopen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700"
                      onClick={() => {
                        if (window.confirm(`Delete ticket ${ticket.reference ?? ""}? This cannot be undone.`)) {
                          run(() => removeTicket({ ticketId: ticket._id }));
                        }
                      }}
                    >
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {applicationList.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              No applications have been submitted.
            </p>
          ) : (
            applicationList.map((application) => (
              <article key={application._id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{application.roleTitle}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {application.fullName} ·{" "}
                      <a href={`mailto:${application.email}`} className="text-[#0066cc] hover:underline">
                        {application.email}
                      </a>
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>

                <div className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                  <p className="whitespace-pre-wrap"><strong>Experience:</strong> {application.experience}</p>
                  <p className="whitespace-pre-wrap"><strong>Why this role:</strong> {application.motivation}</p>
                  <p className="whitespace-pre-wrap"><strong>First weeks:</strong> {application.roleApproach}</p>
                  <p className="whitespace-pre-wrap"><strong>Collaboration:</strong> {application.collaboration}</p>
                  <p className="whitespace-pre-wrap"><strong>Availability:</strong> {application.availability}</p>
                  {application.portfolio && (
                    <p className="whitespace-pre-wrap"><strong>Work samples:</strong> {application.portfolio}</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <label className="text-sm text-slate-600" htmlFor={`status-${application._id}`}>
                    Status
                  </label>
                  <select
                    id={`status-${application._id}`}
                    defaultValue={application.status}
                    onChange={(event) =>
                      run(() => setApplicationStatus({ applicationId: application._id, status: event.target.value }))
                    }
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm capitalize outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    {applicationStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700"
                    onClick={() => {
                      if (window.confirm(`Delete the application from ${application.fullName}? This cannot be undone.`)) {
                        run(() => removeApplication({ applicationId: application._id }));
                      }
                    }}
                  >
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Submitted {new Date(application.submittedAt).toLocaleString()} · Voluntary · unpaid
                </p>
              </article>
            ))
          )}
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link to="/" className="font-medium text-[#7651c9] hover:underline">Back to site</Link>
        <Link to="/support" className="font-medium text-[#7651c9] hover:underline">Support page</Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
