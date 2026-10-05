import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link } from "react-router";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SiteNav } from "@/components/SiteNav";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Loader2,
  LockKeyhole,
  Mail,
  Send,
  Trash2,
  Users,
} from "lucide-react";

/** Keep in sync with MAX_MESSAGE_LENGTH in src/convex/staff.ts. */
const MAX_MESSAGE_LENGTH = 2000;

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "?"
  );
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Staff() {
  const me = useQuery(api.staff.me);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-12 text-white sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-100">
            <Building2 className="size-4" /> Company portal · staff only
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            OpenWorlds staff hub
          </h1>
          <p className="mt-2 text-blue-50">
            {me?.isStaff
              ? [me.department, me.position].filter(Boolean).join(" · ") ||
                "Your department and position have not been set yet."
              : "Internal messages and updates for the company team."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {me === undefined ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : !me.signedIn ? (
          <SignedOutCard />
        ) : !me.isStaff ? (
          <StaffOnlyCard />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <ProfileCard
              name={me.name}
              email={me.email}
              department={me.department}
              position={me.position}
              badge={me.badge}
              isAdmin={me.isAdmin}
            />
            <StaffBoard canDeleteAny={me.isAdmin} />
          </div>
        )}
      </section>
    </main>
  );
}

function SignedOutCard() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
      <LockKeyhole className="mx-auto size-6 text-slate-400" />
      <h2 className="mt-3 font-semibold">Sign in required</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        The company portal is only available to signed-in staff accounts.
      </p>
      <Button className="mt-4" asChild>
        <Link to="/auth?returnTo=%2Fstaff">Sign in</Link>
      </Button>
    </div>
  );
}

function StaffOnlyCard() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <LockKeyhole className="mx-auto size-6 text-amber-700" />
      <h2 className="mt-3 font-semibold text-amber-900">Staff accounts only</h2>
      <p className="mt-2 text-sm leading-6 text-amber-900">
        Your account does not have a department or position yet. An admin can
        give you one from the admin panel, which also unlocks this portal.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Button variant="outline" asChild>
          <Link to="/">Back to home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/support">Contact the team</Link>
        </Button>
      </div>
    </div>
  );
}

function ProfileCard({
  name,
  email,
  department,
  position,
  badge,
  isAdmin,
}: {
  name: string | null;
  email: string | null;
  department: string | null;
  position: string | null;
  badge: "staff" | "dev" | null;
  isAdmin: boolean;
}) {
  const displayName = name || email || "Team member";

  return (
    <aside className="h-fit rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-xl bg-violet-50 text-lg font-semibold text-[#7651c9]">
          {initials(displayName)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold tracking-tight">{displayName}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
            <Mail className="size-3.5 shrink-0" /> {email ?? "no email on file"}
          </p>
        </div>
      </div>

      <dl className="mt-6 space-y-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Department
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">
            {department || "Not assigned yet"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Position
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">
            {position || "Not assigned yet"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Public badge
          </dt>
          <dd className="mt-1.5 flex items-center gap-2">
            {badge ? (
              <RoleBadge badge={badge} />
            ) : (
              <span className="text-sm text-slate-500">—</span>
            )}
            <span className="text-xs text-slate-400">shown on the website</span>
          </dd>
        </div>
      </dl>

      <div className="mt-6 rounded-lg bg-[#f5f7fb] p-3 text-xs leading-5 text-slate-500">
        {isAdmin
          ? "Admin accounts can assign departments and positions from the admin panel."
          : "Ask an admin if your department or position should change."}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <Link to="/admin" className="font-medium text-[#7651c9] hover:underline">
          Admin panel
        </Link>
        <Link to="/" className="font-medium text-[#7651c9] hover:underline">
          Back to site
        </Link>
      </div>
    </aside>
  );
}

function StaffBoard({ canDeleteAny }: { canDeleteAny: boolean }) {
  const board = useQuery(api.staff.board);
  const post = useMutation(api.staff.post);
  const removeMessage = useMutation(api.staff.removeMessage);

  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    try {
      await post({ body });
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post the message.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(messageId: Id<"staffMessages">, authorName: string) {
    const prompt = canDeleteAny
      ? `Delete ${authorName}'s message? This cannot be undone.`
      : "Delete your message? This cannot be undone.";
    if (!window.confirm(prompt)) return;
    setError("");
    try {
      await removeMessage({ messageId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the message.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 border-t-2 border-t-[#0066cc] bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-[#0066cc]">
          <Users className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold tracking-tight">Staff message board</h2>
          <p className="text-xs text-slate-400">
            Internal updates for admins and company staff · newest first
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={3}
          placeholder="Share an update, ask the team something, or flag something that needs attention…"
          className="resize-none"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-400">
            {body.length}/{MAX_MESSAGE_LENGTH} characters
          </span>
          <Button type="submit" size="sm" disabled={busy || !body.trim()}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Post update
          </Button>
        </div>
      </form>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {board === undefined ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : board === null ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Staff access is required to read the message board.
          </p>
        ) : board.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-700">No messages yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
              Be the first to post an update for the company team.
            </p>
          </div>
        ) : (
          board.map((message) => (
            <article
              key={message._id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[#f5f7fb] text-sm font-semibold text-slate-600">
                    {initials(message.authorName)}
                  </span>
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {message.authorName}
                      {message.badge && <RoleBadge badge={message.badge} />}
                    </p>
                    <p className="text-xs text-slate-500">
                      {[message.department, message.position]
                        .filter(Boolean)
                        .join(" · ") || "Company team"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <time
                    className="text-xs text-slate-400"
                    dateTime={new Date(message.createdAt).toISOString()}
                  >
                    {formatTime(message.createdAt)}
                  </time>
                  <button
                    type="button"
                    aria-label="Delete message"
                    title="Delete message"
                    onClick={() => remove(message._id, message.authorName)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {message.body}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
