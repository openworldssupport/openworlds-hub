import { useState, useLocation, type ChangeEvent, type FormEvent } from "react";
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
import { Bell, Building2, FileText, ImagePlus, Loader2, LockKeyhole, Mail, Megaphone, Pencil, Send, ShieldCheck, Trash2, Users } from "lucide-react";

const MAX_MESSAGE_LENGTH = 2000;
type AnnouncementCategory = "announcement" | "development" | "release" | "event";
type AnnouncementStatus = "draft" | "published";
type MediaItem = { storageId: Id<"storage">; mediaType: "image" | "video"; altText: string; url: string | null };
const categories: Array<[AnnouncementCategory, string]> = [
  ["announcement", "Announcement"],
  ["development", "Development update"],
  ["release", "Release notes"],
  ["event", "Event"],
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("") || "?";
}
function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function sectionsFor(path: string): "overview" | "announcements" | "messages" {
  if (path.endsWith("/announcements")) return "announcements";
  if (path.endsWith("/messages")) return "messages";
  return "overview";
}

function WorkspaceOverview({ isAdmin, onAnnouncements }: { isAdmin: boolean; onAnnouncements: () => void }) {
  const announcements = useQuery(api.staff.announcements);
  const applications = useQuery(api.careerApplications.listForAdmin);
  const recent = (announcements ?? []).slice(0, 3);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Announcements" value={announcements?.length ?? "—"} detail="Drafts and published updates" />
        <Stat label="Published" value={announcements?.filter((item) => item.status === "published").length ?? "—"} detail="Live on public News" />
        {isAdmin && <Stat label="Applications" value={applications?.length ?? "—"} detail="Private admin review queue" />}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Recent announcements</h2>
              <p className="mt-1 text-xs text-slate-500">Latest workspace activity</p>
            </div>
            <Button size="sm" variant="outline" onClick={onAnnouncements}>Manage posts</Button>
          </div>
          {announcements === undefined ? (
            <p className="mt-5 text-sm text-slate-500">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">No posts yet. Start with an announcement draft.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {recent.map((item) => (
                <article key={item._id} className="py-3 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">{item.title}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] capitalize text-slate-600">{item.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.summary}</p>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Quick links</h2>
          <p className="mt-1 text-xs text-slate-500">Common workspace destinations</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <QuickLink to="/admin" title="Admin console" detail="Tickets, company access & teams" />
            <QuickLink to="/applications" title="Applications" detail="Private contributor review queue" />
            <QuickLink to="/news" title="Public news" detail="View published announcements" />
            <QuickLink to="/careers" title="Careers" detail="View contributor opportunities" />
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function QuickLink({ to, title, detail }: { to: string; title: string; detail: string }) {
  return (
    <Link to={to} className="rounded-lg border border-slate-200 p-4 transition hover:border-[#0066cc] hover:bg-blue-50/30">
      <strong className="text-sm">{title}</strong>
      <span className="mt-1 block text-xs text-slate-500">{detail}</span>
    </Link>
  );
}

function AnnouncementsPanel({ isAdmin, userId }: { isAdmin: boolean; userId: Id<"users"> }) {
  const announcements = useQuery(api.staff.announcements);
  const saveAnnouncement = useMutation(api.staff.saveAnnouncement);
  const setStatus = useMutation(api.staff.setAnnouncementStatus);
  const removeAnnouncement = useMutation(api.staff.removeAnnouncement);
  const generateUploadUrl = useMutation(api.staff.generateAnnouncementUploadUrl);
  const finalizeUpload = useMutation(api.staff.finalizeAnnouncementUpload);
  const deleteUpload = useMutation(api.staff.deleteAnnouncementUpload);
  const [editingId, setEditingId] = useState<Id<"gameAnnouncements"> | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("announcement");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [persistedMediaIds, setPersistedMediaIds] = useState<Id<"storage">[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function resetForm(discardNewUploads = true) {
    if (discardNewUploads) {
      const unused = media.filter((asset) => !persistedMediaIds.includes(asset.storageId)).map((asset) => asset.storageId);
      void Promise.all(unused.map((storageId) => deleteUpload({ storageId }))).catch((err) => setError(err instanceof Error ? err.message : "Could not discard an unused upload."));
    }
    setEditingId(null); setTitle(""); setSummary(""); setBody(""); setCategory("announcement"); setMedia([]); setPersistedMediaIds([]); setError("");
  }

  function edit(item: NonNullable<typeof announcements>[number]) {
    setEditingId(item._id); setTitle(item.title); setSummary(item.summary); setBody(item.body); setCategory(item.category);
    setMedia(item.media.map((asset) => ({ storageId: asset.storageId, mediaType: asset.mediaType, altText: asset.altText ?? "", url: asset.url })));
    setPersistedMediaIds(item.media.map((asset) => asset.storageId)); setError("");
    document.getElementById("game-announcement-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function uploadMedia(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = "";
    if (!files.length) return;
    if (files.length + media.length > 5) { setError("You can attach up to 5 media files to an announcement."); return; }
    setUploading(true); setError("");
    try {
      for (const file of files) {
        const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
        if (!mediaType) throw new Error("Choose image or video files only.");
        if (file.size > 50 * 1024 * 1024) throw new Error("Each media file must be 50 MB or smaller.");
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        if (!response.ok) throw new Error(`Could not upload ${file.name}. Please try again.`);
        const result = await response.json() as { storageId: Id<"storage"> };
        const asset = await finalizeUpload({ storageId: result.storageId, mediaType });
        setMedia((current) => [...current, { storageId: asset.storageId, mediaType: asset.mediaType, altText: "", url: asset.url }]);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Could not upload media."); }
    finally { setUploading(false); }
  }

  async function save(status: AnnouncementStatus) {
    if (uploading) { setError("Wait for media uploads to finish before saving."); return; }
    if (title.trim().length < 3 || summary.trim().length < 10 || body.trim().length < 20) { setError("Add a headline, a short summary, and at least a few sentences of detail before saving."); return; }
    setBusy(true); setError("");
    try {
      await saveAnnouncement({ announcementId: editingId ?? undefined, title, summary, body, category, status, media: media.map(({ storageId, mediaType, altText }) => ({ storageId, mediaType, altText: altText.trim() || undefined })) });
      resetForm(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save this announcement."); }
    finally { setBusy(false); }
  }

  async function changeStatus(item: NonNullable<typeof announcements>[number], status: AnnouncementStatus) {
    setError("");
    try { await setStatus({ announcementId: item._id, status }); } catch (err) { setError(err instanceof Error ? err.message : "Could not change announcement status."); }
  }

  async function remove(item: NonNullable<typeof announcements>[number]) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    setError("");
    try { await removeAnnouncement({ announcementId: item._id }); if (editingId === item._id) resetForm(false); } catch (err) { setError(err instanceof Error ? err.message : "Could not delete this announcement."); }
  }

  const all = announcements ?? [];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7651c9]">Public-facing</p>
          <h2 className="mt-1 text-xl font-semibold">Game announcements</h2>
          <p className="mt-1 text-sm text-slate-500">Create polished updates with photos or video. Your personal name is never shown publicly.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => resetForm()}><FileText className="size-4" /> New post</Button>
      </div>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <section id="game-announcement-form" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]">{editingId ? <Pencil className="size-4" /> : <Megaphone className="size-4" />}</span><div><h3 className="font-semibold">{editingId ? "Edit announcement" : "Compose announcement"}</h3><p className="text-xs text-slate-500">Only published posts appear on the News and Events pages. Individual poster identities remain private.</p></div></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_210px]">
          <div className="space-y-1.5"><Label htmlFor="announcement-title">Headline</Label><Input id="announcement-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="What should players know?" /></div>
          <div className="space-y-1.5"><Label htmlFor="announcement-category">Type</Label><select id="announcement-category" value={category} onChange={(e) => setCategory(e.target.value as AnnouncementCategory)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        </div>
        <div className="mt-4 space-y-1.5"><Label htmlFor="announcement-summary">Short summary</Label><Input id="announcement-summary" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={240} placeholder="One sentence for the news preview" /><p className="text-right text-[11px] text-slate-400">{summary.length}/240</p></div>
        <div className="mt-3 space-y-1.5"><Label htmlFor="announcement-body">Details</Label><Textarea id="announcement-body" value={body} onChange={(e) => setBody(e.target.value)} rows={7} maxLength={10000} placeholder="Write the full update for players…" className="resize-y" /><p className="text-right text-[11px] text-slate-400">{body.length}/10,000</p></div>
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <Label htmlFor="announcement-media" className="flex items-center gap-2"><ImagePlus className="size-4" />Photos and videos <span className="font-normal text-slate-500">(up to 5 files, max 50 MB each)</span></Label>
          <Input id="announcement-media" type="file" accept="image/*,video/*" multiple disabled={uploading || media.length >= 5} onChange={(event) => void uploadMedia(event)} className="mt-2 cursor-pointer bg-white" />
          {uploading && <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Loader2 className="size-3.5 animate-spin" />Uploading…</p>}
          {media.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{media.map((asset, index) => (
            <div key={asset.storageId} className="rounded-lg border border-slate-200 bg-white p-2">
              {asset.url && (asset.mediaType === "image" ? <img src={asset.url} alt={asset.altText || "Announcement upload preview"} className="mb-2 max-h-40 w-full rounded object-contain" /> : <video src={asset.url} controls preload="metadata" className="mb-2 max-h-40 w-full rounded bg-black" />)}
              <div className="flex gap-2">
                <Input aria-label={`Description for media ${index + 1}`} value={asset.altText} onChange={(event) => setMedia((items) => items.map((item) => item.storageId === asset.storageId ? { ...item, altText: event.target.value } : item))} maxLength={200} placeholder="Accessibility description (optional)" />
                <Button type="button" size="sm" variant="outline" aria-label={`Remove media ${index + 1}`} onClick={() => { if (!persistedMediaIds.includes(asset.storageId)) void deleteUpload({ storageId: asset.storageId }).catch((err) => setError(err instanceof Error ? err.message : "Could not discard upload.")); setMedia((items) => items.filter((item) => item.storageId !== asset.storageId)); }}><Trash2 className="size-4" /></Button>
              </div>
            </div>
          ))}</div>}
        </div>
        <p className="mt-2 text-xs text-slate-500">Public media can be viewed by anyone when the announcement is published.</p>
      </section>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-500">Save a draft or publish immediately.</span>
        <div className="flex gap-2">
          {editingId && <Button type="button" variant="ghost" size="sm" onClick={() => resetForm()}>Cancel</Button>}
          <Button type="button" variant="outline" size="sm" disabled={busy || uploading} onClick={() => void save("draft")}>{busy ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}Save draft</Button>
          <Button type="button" size="sm" disabled={busy || uploading} onClick={() => void save("published")}><Send className="size-4" />Publish</Button>
        </div>
      </div>
    </section>
    {announcements === undefined ? <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin" /></div> : <div className="grid gap-5 xl:grid-cols-2">
      <AnnouncementList title="Drafts" items={all.filter((item) => item.status === "draft")} empty="No drafts yet." userId={userId} isAdmin={isAdmin} onEdit={edit} onStatus={(item) => void changeStatus(item, "published")} onRemove={(item) => void remove(item)} />
      <AnnouncementList title="Published" items={all.filter((item) => item.status === "published")} empty="No public announcements yet." userId={userId} isAdmin={isAdmin} onEdit={edit} onStatus={(item) => void changeStatus(item, "draft")} onRemove={(item) => void remove(item)} />
    </div>}
  );
}

function AnnouncementList({ title, items, empty, userId, isAdmin, onEdit, onStatus, onRemove }: {
  title: string;
  items: NonNullable<ReturnType<typeof useQuery<typeof api.staff.announcements>>>;
  empty: string;
  userId: Id<"users">;
  isAdmin: boolean;
  onEdit: (item: (typeof items)[number]) => void;
  onStatus: (item: (typeof items)[number]) => void;
  onRemove: (item: (typeof items)[number]) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">{title === "Drafts" ? <FileText className="size-4" /> : <Bell className="size-4" />}{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{items.length}</span>
      </div>
      {items.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">{empty}</p> : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const mayManage = isAdmin || item.authorId === userId;
            return (
              <article key={item._id} className="py-4">
                <p className="text-xs font-medium capitalize text-[#7651c9]">{item.category === "development" ? "Development update" : item.category}</p>
                <h4 className="mt-1 font-semibold">{item.title}</h4>
                <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                <p className="mt-2 text-xs text-slate-400">{formatTime(item.publishedAt ?? item.createdAt)} · {item.media.length} media</p>
                {mayManage && <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(item)}><Pencil className="size-3.5" />Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => onStatus(item)}>{item.status === "published" ? "Unpublish" : "Publish"}</Button>
                  <Button size="sm" variant="ghost" className="text-slate-500 hover:text-red-700" onClick={() => onRemove(item)}><Trash2 className="size-3.5" />Delete</Button>
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
  const board = useQuery(api.staff.board); const post = useMutation(api.staff.post); const removeMessage = useMutation(api.staff.removeMessage);
  const [body, setBody] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!body.trim()) return; setBusy(true); setError(""); try { await post({ body }); setBody(""); } catch (err) { setError(err instanceof Error ? err.message : "Could not post the message."); } finally { setBusy(false); } }
  async function remove(messageId: Id<"staffMessages">, authorId: Id<"users">) { if (!window.confirm("Delete this message? This cannot be undone.")) return; setError(""); try { await removeMessage({ messageId }); } catch (err) { setError(err instanceof Error ? err.message : "Could not delete the message."); } }
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-[#0066cc]"><Users className="size-5" /></span>
        <div>
          <h2 className="font-semibold">Staff message board</h2>
          <p className="text-xs text-slate-500">Internal updates for admins and company staff · newest first</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-5">
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={MAX_MESSAGE_LENGTH} rows={3} placeholder="Share an update or ask the team…" className="resize-none" />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">{body.length}/{MAX_MESSAGE_LENGTH}</span>
          <Button type="submit" size="sm" disabled={busy || !body.trim()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Post update</Button>
        </div>
      </form>
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mt-6 space-y-4">
        {board === undefined ? <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin" /></div> : board === null ? <p className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm">Staff access required.</p> : board.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No messages yet. Start a team update.</div> : board.map((message) => <article key={message._id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold">{initials(message.authorName)}</span>
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">{message.authorName}{message.badge && <RoleBadge badge={message.badge} />}</p>
                <p className="text-xs text-slate-500">{[message.department, message.position].filter(Boolean).join(" · ") || "Company team"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <time className="text-xs text-slate-400">{formatTime(message.createdAt)}</time>
              {(canDeleteAny || message.authorId === userId) && <button type="button" aria-label="Delete message" onClick={() => void remove(message._id, message.authorId)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button>}
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.body}</p>
        </article>)}
      </div>
    </section>
  );
}

type SafeStaffWorkspaceProps = { isAdmin: boolean; userId: string };

const SafeStaffWorkspace: React.FC<SafeStaffWorkspaceProps> = ({ isAdmin, userId }) => {
  const location = useLocation();
  const tabs = [{ id: "overview" as const, label: "Workspace", icon: Building2 }, { id: "announcements" as const, label: "Announcements", icon: Megaphone }, { id: "messages" as const, label: "Team board", icon: Users }];
  const active = tabs.find(({ id }) => location.pathname.endsWith("/staff/" + id)) ?? tabs[0];
  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-wrap gap-1 border-b border-slate-200" role="tablist" aria-label="Staff workspace">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Link key={id} to={`/staff/${id}`} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${location.pathname.endsWith("/staff/" + id) ? "border-[#0066cc] text-[#0052a3]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            <Icon className="size-4" />{label}
          </Link>
        ))}
      </div>
      {sectionsFor(location.pathname) === "overview" ? <WorkspaceOverview isAdmin={isAdmin} onAnnouncements={() => {}} /> : sectionsFor(location.pathname) === "announcements" ? <AnnouncementsPanel isAdmin={isAdmin} userId="" /> : <StaffBoard canDeleteAny={isAdmin} userId="" />}
    </div>
  );
};

export function StaffOverview() {
  return <div className="min-h-screen bg-[#f6f7f8] text-slate-900"><SiteNav /><SafeStaffWorkspace isAdmin={false} userId="" /></div>;
}

export function StaffAnnouncements() {
  return <div className="min-h-screen bg-[#f6f7f8] text-slate-900"><SiteNav /><SafeStaffWorkspace isAdmin={false} userId="" /></div>;
}

export function StaffMessages() {
  return <div className="min-h-screen bg-[#f6f7f8] text-slate-900"><SiteNav /><SafeStaffWorkspace isAdmin={false} userId="" /></div>;
}

type StaffWorkspaceProps = { isAdmin: boolean; userId: Id<"users"> };

export function StaffWorkspace({ isAdmin, userId }: StaffWorkspaceProps) {
  return <SafeStaffWorkspace isAdmin={isAdmin} userId="" />;
}
