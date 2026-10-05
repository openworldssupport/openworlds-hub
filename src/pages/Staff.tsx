import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link } from "react-router";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SiteNav } from "@/components/SiteNav";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  Building2,
  FileText,
  Loader2,
  LockKeyhole,
  Mail,
  Megaphone,
  Pencil,
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
    <main className="min-h-screen bg-[#f6f7f8] text-slate-900">
      <SiteNav />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-5 px-5 py-8 sm:px-8">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0066cc]">
              <Building2 className="size-4" /> Company workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[2.1rem]">
              Good to see you{me?.name ? `, ${me.name.split(" ")[0]}` : ""}.
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {me?.isStaff
                ? [me.department, me.position].filter(Boolean).join(" · ") ||
                  "Your OpenWorlds team workspace"
                : "Sign in with an approved staff account"}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Private staff area
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {me === undefined ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : !me.signedIn ? (
          <SignedOutCard />
        ) : !me.isStaff ? (
          <StaffOnlyCard />
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <ProfileCard
              name={me.name}
              email={me.email}
              department={me.department}
              position={me.position}
              badge={me.badge}
              isAdmin={me.isAdmin}
            />
            <StaffWorkspace isAdmin={me.isAdmin} userId={me.userId! as Id<"users">} />
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
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to="/auth?returnTo=%2Fstaff">Staff sign in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/auth?mode=staff-signup&returnTo=%2Fstaff">Staff sign up</Link>
        </Button>
      </div>
    </div>
  );
}

function StaffOnlyCard() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <LockKeyhole className="mx-auto size-6 text-amber-700" />
      <h2 className="mt-3 font-semibold text-amber-900">Staff accounts only</h2>
      <p className="mt-2 text-sm leading-6 text-amber-900">
        This email is not linked to an approved staff account. Ask a company admin to invite or approve your staff access.
      </p>
      <Link to="/auth?mode=staff-signup&returnTo=%2Fstaff" className="mt-4 inline-flex text-sm font-medium text-[#7651c9] hover:underline">Try staff sign-up</Link>
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
    <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
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

function StaffWorkspace({ isAdmin, userId }: { isAdmin: boolean; userId: Id<"users"> }) {
  const [section, setSection] = useState<"announcements" | "messages">("announcements");

  return (
    <div className="min-w-0">
      <div className="mb-5 flex gap-1 border-b border-slate-200">
        <button type="button" onClick={() => setSection("announcements")} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${section === "announcements" ? "border-[#0066cc] text-[#0052a3]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
          <Megaphone className="size-4" /> Game announcements
        </button>
        <button type="button" onClick={() => setSection("messages")} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${section === "messages" ? "border-[#0066cc] text-[#0052a3]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
          <Users className="size-4" /> Team chat
        </button>
      </div>
      {section === "announcements" ? (
        <AnnouncementsPanel isAdmin={isAdmin} userId={userId} />
      ) : (
        <StaffBoard canDeleteAny={isAdmin} userId={userId} />
      )}
    </div>
  );
}

const announcementCategories = [
  ["announcement", "Announcement"],
  ["development", "Development update"],
  ["release", "Release notes"],
  ["event", "Event"],
] as const;

type AnnouncementCategory = (typeof announcementCategories)[number][0];
type AnnouncementStatus = "draft" | "published";

function AnnouncementsPanel({ isAdmin, userId }: { isAdmin: boolean; userId: Id<"users"> }) {
  const announcements = useQuery(api.staff.announcements);
  const saveAnnouncement = useMutation(api.staff.saveAnnouncement);
  const setStatus = useMutation(api.staff.setAnnouncementStatus);
  const removeAnnouncement = useMutation(api.staff.removeAnnouncement);

  const [editingId, setEditingId] = useState<Id<"gameAnnouncements"> | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("announcement");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSummary("");
    setBody("");
    setCategory("announcement");
    setError("");
  }

  function edit(item: NonNullable<typeof announcements>[number]) {
    setEditingId(item._id);
    setTitle(item.title);
    setSummary(item.summary);
    setBody(item.body);
    setCategory(item.category);
    setError("");
    document.getElementById("game-announcement-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function save(status: AnnouncementStatus) {
    if (title.trim().length < 3 || summary.trim().length < 10 || body.trim().length < 20) {
      setError("Add a headline, a short summary, and at least a few sentences of detail before saving.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveAnnouncement({
        announcementId: editingId ?? undefined,
        title,
        summary,
        body,
        category,
        status,
      });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this announcement.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(item: NonNullable<typeof announcements>[number], status: AnnouncementStatus) {
    setError("");
    try {
      await setStatus({ announcementId: item._id, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the announcement status.");
    }
  }

  async function remove(item: NonNullable<typeof announcements>[number]) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    setError("");
    try {
      await removeAnnouncement({ announcementId: item._id });
      if (editingId === item._id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this announcement.");
    }
  }

  const items = announcements ?? [];
  const drafts = items.filter((item) => item.status === "draft");
  const published = items.filter((item) => item.status === "published");
  const editorError = error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7651c9]">For players</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Game announcements</h2>
          <p className="mt-1 text-sm text-slate-500">Write updates, save drafts, and publish straight to News.</p>
        </div>
        <Button variant="outline" size="sm" onClick={resetForm}><FileText className="size-4" /> New post</Button>
      </div>

      {editorError}

      <section id="game-announcement-form" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]">{editingId ? <Pencil className="size-4" /> : <Megaphone className="size-4" />}</span>
          <div>
            <h3 className="font-semibold">{editingId ? "Edit post" : "Write a post"}</h3>
            <p className="text-xs text-slate-500">Published announcements are visible to everyone on the News page.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_210px]">
          <div className="space-y-1.5">
            <Label htmlFor="announcement-title">Headline</Label>
            <Input id="announcement-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="What should players know?" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="announcement-category">Type</Label>
            <select id="announcement-category" value={category} onChange={(e) => setCategory(e.target.value as AnnouncementCategory)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
              {announcementCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="announcement-summary">Short summary</Label>
          <Input id="announcement-summary" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={240} placeholder="One sentence for the news preview" />
          <p className="text-right text-[11px] text-slate-400">{summary.length}/240</p>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="announcement-body">Details</Label>
          <Textarea id="announcement-body" value={body} onChange={(e) => setBody(e.target.value)} rows={7} maxLength={10000} placeholder="Write the full update for players…" className="resize-y" />
          <p className="text-right text-[11px] text-slate-400">{body.length}/10,000</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-500">{editingId ? "Saving updates this post." : "You can publish now or keep it as a draft."}</span>
          <div className="flex gap-2">
            {editingId && <Button type="button" variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>}
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void save("draft")}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />} Save draft
            </Button>
            <Button type="button" size="sm" disabled={busy} onClick={() => void save("published")}>
              <Send className="size-4" /> Publish
            </Button>
          </div>
        </div>
      </section>

      {announcements === undefined ? (
        <div className="flex justify-center py-8 text-slate-400"><Loader2 className="size-5 animate-spin" /></div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <AnnouncementList title="Drafts" items={drafts} empty="No drafts yet." userId={userId} isAdmin={isAdmin} onEdit={edit} onPublish={(item) => void togglePublished(item, "published")} onUnpublish={(item) => void togglePublished(item, "draft")} onRemove={(item) => void remove(item)} />
          <AnnouncementList title="Published" items={published} empty="No public announcements yet." userId={userId} isAdmin={isAdmin} onEdit={edit} onPublish={(item) => void togglePublished(item, "published")} onUnpublish={(item) => void togglePublished(item, "draft")} onRemove={(item) => void remove(item)} />
        </div>
      )}
    </div>
  );
}

function AnnouncementList({ title, items, empty, userId, isAdmin, onEdit, onPublish, onUnpublish, onRemove }: {
  title: string;
  items: NonNullable<ReturnType<typeof useQuery<typeof api.staff.announcements>>>;
  empty: string;
  userId: Id<"users">;
  isAdmin: boolean;
  onEdit: (item: (typeof items)[number]) => void;
  onPublish: (item: (typeof items)[number]) => void;
  onUnpublish: (item: (typeof items)[number]) => void;
  onRemove: (item: (typeof items)[number]) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">{title === "Drafts" ? <FileText className="size-4" /> : <Bell className="size-4" />}{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{items.length}</span>
      </div>
      {items.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">{empty}</p> : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const mayManage = isAdmin || item.authorId === userId;
            return (
              <article key={item._id} className="py-4 first:pt-4 last:pb-0">
                <p className="text-xs font-medium capitalize text-[#7651c9]">{item.category.replace("development", "Development update")}</p>
                <h4 className="mt-1 font-semibold leading-5">{item.title}</h4>
                <p className="mt-1 text-sm leading-5 text-slate-600">{item.summary}</p>
                <p className="mt-2 text-xs text-slate-400">By {item.authorName} · {formatTime(item.publishedAt ?? item.createdAt)}</p>
                {mayManage && <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(item)}><Pencil className="size-3.5" /> Edit</Button>
                  {item.status === "published" ? <Button size="sm" variant="outline" onClick={() => onUnpublish(item)}><FileText className="size-3.5" /> Unpublish</Button> : <Button size="sm" variant="outline" onClick={() => onPublish(item)}><Send className="size-3.5" /> Publish</Button>}
                  <Button size="sm" variant="ghost" className="text-slate-500 hover:text-red-700" onClick={() => onRemove(item)}><Trash2 className="size-3.5" /> Delete</Button>
                </div>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StaffBoard({ canDeleteAny, userId }: { canDeleteAny: boolean; userId: Id<"users"> }) {
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

  async function remove(messageId: Id<"staffMessages">, authorId: Id<"users">, authorName: string) {
    const prompt = canDeleteAny && authorId !== userId
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
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
                  {(canDeleteAny || message.authorId === userId) && (
                    <button
                      type="button"
                      aria-label="Delete message"
                      title="Delete message"
                      onClick={() => remove(message._id, message.authorId, message.authorName)}
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
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
