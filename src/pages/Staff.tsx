import { useState, type ChangeEvent, type FormEvent } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Link, useLocation } from "react-router";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SiteNav } from "@/components/SiteNav";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  ImagePlus,
  Loader2,
  Pencil,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
  Check,
  AlertTriangle,
} from "lucide-react";
import { displayNameFor, displayInitials } from "@/lib/staff";
import { MAX_NICKNAME_LENGTH } from "@/convex/staff";
import { AccountSecuritySettings } from "@/pages/AccountSecurity";

const MAX_MESSAGE_LENGTH = 2000;
type AnnouncementCategory = "announcement" | "development" | "release" | "event";
type AnnouncementStatus = "draft" | "published";

type MediaItem = {
  storageId: Id<"_storage">;
  mediaType: "image" | "video";
  altText: string;
  url: string | null;
};

type StaffUserId = Id<"users">;
type AnyUserId = string | StaffUserId;

const categories: Array<[AnnouncementCategory, string]> = [
  ["announcement", "Announcement"],
  ["development", "Development update"],
  ["release", "Release notes"],
  ["event", "Event"],
];

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

type StaffSection = "overview" | "announcements" | "messages";

function MoreStaffTools() {
  return (
    <details className="mb-6 border-y border-slate-200">
      <summary className="cursor-pointer py-3 text-sm font-medium">Staff tools</summary>
      <div className="space-y-6 border-t border-slate-200 py-4">
        <SiteStatusControl />
        <StaffSecurityPanel />
      </div>
    </details>
  );
}

function WorkspaceOverview({
  isAdmin,
  me,
}: {
  isAdmin: boolean;
  me: ReturnType<typeof useQuery<typeof api.staff.me>>;
}) {
  const announcements = useQuery(api.staff.announcements);
  const recent = (announcements ?? []).slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Signed-in staff header: nickname first, never the email. */}
      {me && me.signedIn && (
        <section>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{displayNameFor(me)}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {me.isAdmin ? "Company admin" : me.isStaff ? "Company staff" : "Signed in"}
                {me.department || me.position ? ` · ${[me.department, me.position].filter(Boolean).join(" · ")}` : ""}
                {me.memberStatus === "volunteer-thank-you" ? " · Volunteer" : ""}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {me.nickname ? "Public nickname set · email stays private" : "Pick a nickname to replace your name on the staff portal"}
              </p>
            </div>
            {me.badge && (
              <RoleBadge badge={me.badge} className="shrink-0" />
            )}
          </div>
        </section>
      )}

      {/* Nickname settings: first-login pick + always-change control. */}
      {me && me.signedIn && (
        <details className="border-t border-slate-200 pt-3">
          <summary className="cursor-pointer text-sm font-medium">
            Account settings <span className="ml-2 text-xs font-normal text-slate-500">Nickname and security</span>
          </summary>
          <div className="space-y-4 pt-4">
            {me.isStaff && <NicknameSettings me={me} />}
            <AccountSecuritySettings />
          </div>
        </details>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <h2 className="font-semibold">Recent announcements</h2>
          <Link to="/staff/announcements" className="text-sm text-[#14583c] hover:underline">Manage posts</Link>
        </div>

        {announcements === undefined ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No posts yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {recent.map((item) => (
              <li key={item._id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium">{item.title}</h3>
                  <span className="text-xs capitalize text-slate-500">{item.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Staff links</h2>
        <ul className="mt-2 divide-y divide-slate-200 border-y border-slate-200">
          <QuickLink to="/staff/announcements" title="Announcements" />
          <QuickLink to="/staff/messages" title="Team board" />
          <QuickLink to="/staff/creators" title="Creator verification" />
          {isAdmin && <QuickLink to="/admin" title="Admin console" />}
          <QuickLink to="/news" title="Public news" />
        </ul>
      </section>
    </div>
  );
}

function QuickLink({ to, title }: { to: string; title: string }) {
  return (
    <li>
      <Link to={to} className="block py-2.5 text-sm hover:text-[#14583c] hover:underline">
        {title}
      </Link>
    </li>
  );
}

/**
 * Staff nickname settings. On first login, when the account has no nickname,
 * this shows a “pick a nickname” form. Once set, the same control is always
 * available to change it. Emails are never shown as the user’s name.
 */
function NicknameSettings({
  me,
}: {
  me: ReturnType<typeof useQuery<typeof api.staff.me>>;
}) {
  const setNick = useMutation(api.staff.setNick);
  const [nickname, setNickname] = useState(me?.nickname ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function resetSaved() {
    setSaved(false);
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nickname.trim()) {
      setError("Enter a nickname first.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await setNick({ nickname: nickname.trim() });
      setSaved(true);
      setTimeout(resetSaved, 2500);
    } catch (err) {
      setError("Could not save the nickname. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const editing = nickname !== (me?.nickname ?? "");

  return (
    <section>
      <h3 className="text-sm font-semibold">Public nickname</h3>

      <p className="mt-1 text-xs text-slate-500">
        This is the name shown on the staff portal, board, and announcements. It is not listed on the public About page.
      </p>

      {saved ? (
        <p className="mt-3 text-sm text-[#14583c]">
          Nickname saved. It may take a moment to appear everywhere.
        </p>
      ) : null}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={save} className="mt-3 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="staff-nickname" className="text-xs">
            {me?.nickname ? "Change nickname" : "Pick a nickname"}
          </Label>
          <Input
            id="staff-nickname"
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value);
              resetSaved();
            }}
            maxLength={MAX_NICKNAME_LENGTH}
            placeholder="How should the team and public see you?"
            disabled={busy}
          />
          <p className="flex justify-between text-[11px] text-slate-400">
            <span>{me?.nickname ? `${me.nickname.length}/${MAX_NICKNAME_LENGTH}` : `${nickname.length}/${MAX_NICKNAME_LENGTH}`}</span>
            <span>Letters, numbers, spaces, hyphens and underscores</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="sm"
            disabled={busy || !nickname.trim()}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : editing ? (
              <>
                <Pencil className="size-4" />
                Update nickname
              </>
            ) : null}
          </Button>

          {editing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setNickname(me?.nickname ?? "");
                resetSaved();
              }}
            >
              Revert
            </Button>
          )}

          {!editing && me?.nickname && (
            <span className="text-xs text-slate-500">
              Current: {me.nickname}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

function AnnouncementList({
  title,
  items,
  empty,
  userId,
  isAdmin,
  onEdit,
  onStatus,
  onRemove,
}: {
  title: string;
  items: NonNullable<ReturnType<typeof useQuery<typeof api.staff.announcements>>>;
  empty: string;
  userId: AnyUserId;
  isAdmin: boolean;
  onEdit: (item: (typeof items)[number]) => void;
  onStatus: (item: (typeof items)[number]) => void;
  onRemove: (item: (typeof items)[number]) => void;
}) {
  return (
    <section>
      <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold">
        {title} ({items.length})
      </h3>

      {items.length === 0 ? (
        <p className="py-6 text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="divide-y divide-slate-200">
          {items.map((item) => {
            const mayManage = isAdmin || item.authorId === userId;
            return (
              <article key={item._id} className="py-4">
                <p className="text-xs capitalize text-slate-500">
                  {item.category === "development" ? "Development update" : item.category}
                </p>
                <h4 className="mt-1 font-semibold">{item.title}</h4>
                <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {formatTime(item.publishedAt ?? item.createdAt)} · {item.media.length} media
                </p>

                {mayManage && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onStatus(item)}>
                      {item.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-slate-500 hover:text-red-700" onClick={() => onRemove(item)}>
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function AnnouncementsPanel({
  isAdmin,
  userId,
}: {
  isAdmin: boolean;
  userId: AnyUserId;
}) {
  const announcements = useQuery(api.staff.announcements);
  const newsPostingStatus = useQuery(api.security.newsPostingStatus);
  const sendNewsCode = useAction(api.newsVerification.sendCode);
  const verifyNewsCode = useMutation(api.security.verifyNewsPostingCode);
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
  const [persistedMediaIds, setPersistedMediaIds] = useState<Id<"_storage">[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newsCode, setNewsCode] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeMessage, setCodeMessage] = useState("");

  function resetForm(discardNewUploads = true) {
    if (discardNewUploads) {
      const unused = media
        .filter((asset) => !persistedMediaIds.includes(asset.storageId))
        .map((asset) => asset.storageId);

      void Promise.all(
        unused.map((storageId) => deleteUpload({ storageId })),
      ).catch((err) =>
        setError("Could not discard an unused upload."),
      );
    }

    setEditingId(null);
    setTitle("");
    setSummary("");
    setBody("");
    setCategory("announcement");
    setMedia([]);
    setPersistedMediaIds([]);
    setError("");
  }

  function edit(item: NonNullable<typeof announcements>[number]) {
    setEditingId(item._id);
    setTitle(item.title);
    setSummary(item.summary);
    setBody(item.body);
    setCategory(item.category);
    setMedia(
      item.media.map((asset) => ({
        storageId: asset.storageId,
        mediaType: asset.mediaType,
        altText: asset.altText ?? "",
        url: asset.url,
      })),
    );
    setPersistedMediaIds(item.media.map((asset) => asset.storageId));
    setError("");
    document.getElementById("game-announcement-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function uploadMedia(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";

    if (!files.length) return;
    if (files.length + media.length > 5) {
      setError("You can attach up to 5 media files to an announcement.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      for (const file of files) {
        const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;

        if (!mediaType) throw new Error("Choose image or video files only.");
        if (file.size > 50 * 1024 * 1024) throw new Error("Each media file must be 50 MB or smaller.");

        const uploadUrl = await generateUploadUrl();
        if (!uploadUrl) throw new Error("Verify your news-posting code before uploading media.");
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!response.ok) throw new Error(`Could not upload ${file.name}. Please try again.`);

        const result = await response.json() as { storageId: Id<"_storage"> };
        const asset = await finalizeUpload({ storageId: result.storageId, mediaType });
        if (!asset.url) throw new Error("Verify your news-posting code before uploading media.");

        setMedia((current) => [
          ...current,
          { storageId: asset.storageId, mediaType: asset.mediaType, altText: "", url: asset.url },
        ]);
      }
    } catch (err) {
      setError("Could not upload media.");
    } finally {
      setUploading(false);
    }
  }

  async function requestNewsCode() {
    setCodeBusy(true);
    setCodeMessage("");
    try {
      await sendNewsCode({});
      setCodeMessage("A verification code was sent to the company mailbox. It expires in 10 minutes.");
    } catch {
      setCodeMessage("Could not send a code. Check your eligibility and try again later.");
    } finally {
      setCodeBusy(false);
    }
  }

  async function confirmNewsCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCodeBusy(true);
    setCodeMessage("");
    try {
      const result = await verifyNewsCode({ code: newsCode });
      if (result.verified) {
        setNewsCode("");
        setCodeMessage("Verified. You can publish news for the next hour.");
      } else {
        setCodeMessage(result.banned ? "Too many incorrect attempts. Website access has been restricted; submit an appeal for review." : `That code was not accepted. ${result.remainingAttempts ?? 0} attempts remain.`);
      }
    } catch {
      setCodeMessage("Could not verify the code. Request a new one and try again.");
    } finally {
      setCodeBusy(false);
    }
  }

  async function save(status: AnnouncementStatus) {
    if (uploading) {
      setError("Wait for media uploads to finish before saving.");
      return;
    }

    if (title.trim().length < 3 || summary.trim().length < 10 || body.trim().length < 20) {
      setError(
        "Add a headline, a short summary, and at least a few sentences of detail before saving.",
      );
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await saveAnnouncement({
        announcementId: editingId ?? undefined,
        title,
        summary,
        body,
        category,
        status,
        media: media.map(({ storageId, mediaType, altText }) => ({
          storageId,
          mediaType,
          altText: altText.trim() || undefined,
        })),
      });

      if ("restricted" in result) {
        setError("Verify your news-posting code before saving.");
        return;
      }
      resetForm(false);
    } catch (err) {
      setError("Could not save this announcement.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(
    item: NonNullable<typeof announcements>[number],
    status: AnnouncementStatus,
  ) {
    setError("");
    try {
      const result = await setStatus({ announcementId: item._id, status });
      if ("ok" in result && result.ok === false) setError("Verify your news-posting code before publishing.");
    } catch (err) {
      setError("Could not change announcement status.");
    }
  }

  async function remove(item: NonNullable<typeof announcements>[number]) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;

    setError("");
    try {
      await removeAnnouncement({ announcementId: item._id });
      if (editingId === item._id) resetForm(false);
    } catch (err) {
      setError("Could not delete this announcement.");
    }
  }

  const all = announcements ?? [];

  function handleCategoryChange(value: string) {
    const next = value as AnnouncementCategory;
    setCategory(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Announcements</h2>
          <p className="mt-1 text-sm text-slate-600">
            Updates shown on the public News page. Your name is never shown publicly.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => resetForm()}>
          New post
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {newsPostingStatus?.eligible && (
        <section className="border-y border-slate-200 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold">News publishing verification</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Verify your company email before creating, editing, or publishing announcements. Verification stays active for one hour.</p>
            </div>
            {newsPostingStatus.verifiedUntil > Date.now() ? (
              <span className="text-xs font-semibold text-[#14583c]">Verified</span>
            ) : (
              <Button type="button" variant="outline" disabled={codeBusy} onClick={() => void requestNewsCode()}>{codeBusy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send verification code</Button>
            )}
          </div>
          {newsPostingStatus.verifiedUntil <= Date.now() && (
            <form onSubmit={(event) => void confirmNewsCode(event)} className="mt-4 flex flex-wrap items-end gap-3">
              <div className="w-full max-w-xs space-y-1.5"><Label htmlFor="news-verification-code">6-digit code</Label><Input id="news-verification-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={newsCode} onChange={(event) => setNewsCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></div>
              <Button type="submit" variant="outline" disabled={codeBusy || newsCode.length !== 6}>{codeBusy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Verify code</Button>
            </form>
          )}
          {codeMessage && <p role="status" className="mt-3 text-sm text-slate-700">{codeMessage}</p>}
        </section>
      )}

      <section id="game-announcement-form" className="scroll-mt-24 border-y border-slate-200 py-5">
        <div>
          <h3 className="font-semibold">{editingId ? "Edit announcement" : "Compose announcement"}</h3>
          <p className="text-xs text-slate-500">
            Only published posts appear on the News and Events pages. Individual poster identities remain private.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_210px]">
          <div className="space-y-1.5">
            <Label htmlFor="announcement-title">Headline</Label>
            <Input
              id="announcement-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="What should players know?"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="announcement-category">Type</Label>
            <select
              id="announcement-category"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              {categories.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="announcement-summary">Short summary</Label>
          <Input
            id="announcement-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={240}
            placeholder="One sentence for the news preview"
          />
          <p className="text-right text-[11px] text-slate-400">{summary.length}/240</p>
        </div>

        <div className="mt-3 space-y-1.5">
          <Label htmlFor="announcement-body">Details</Label>
          <Textarea
            id="announcement-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={7}
            maxLength={10000}
            placeholder="Write the full update for players…"
            className="resize-y"
          />
          <p className="text-right text-[11px] text-slate-400">{body.length}/10,000</p>
        </div>

        <div className="mt-5 border border-slate-200 p-4">
          <Label htmlFor="announcement-media" className="flex items-center gap-2">
            <ImagePlus className="size-4" />
            Photos and videos
            <span className="font-normal text-slate-500">(up to 5 files, max 50 MB each)</span>
          </Label>
          <Input
            id="announcement-media"
            type="file"
            accept="image/*,video/*"
            multiple
            disabled={uploading || media.length >= 5}
            onChange={(event) => void uploadMedia(event)}
            className="mt-2 cursor-pointer bg-white"
          />

          {uploading && (
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="size-3.5 animate-spin" />
              Uploading…
            </p>
          )}

          {media.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {media.map((asset, index) => (
                <div key={asset.storageId} className="border border-slate-200 p-2">
                  {asset.url && (
                    asset.mediaType === "image" ? (
                      <img
                        src={asset.url}
                        alt={asset.altText || "Announcement upload preview"}
                        className="mb-2 max-h-40 w-full rounded object-contain"
                      />
                    ) : (
                      <video
                        src={asset.url}
                        controls
                        preload="metadata"
                        className="mb-2 max-h-40 w-full rounded bg-black"
                      />
                    )
                  )}

                  <div className="flex gap-2">
                    <Input
                      aria-label={`Description for media ${index + 1}`}
                      value={asset.altText}
                      onChange={(event) =>
                        setMedia(
                          (items) =>
                            items.map((item) =>
                              item.storageId === asset.storageId
                                ? { ...item, altText: event.target.value }
                                : item,
                            ),
                        )
                      }
                      maxLength={200}
                      placeholder="Accessibility description (optional)"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label={`Remove media ${index + 1}`}
                      onClick={() => {
                        if (!persistedMediaIds.includes(asset.storageId)) {
                          void deleteUpload({
                            storageId: asset.storageId,
                          }).catch((err) =>
                            setError("Could not discard upload."),
                          );
                        }

                        setMedia((items) =>
                          items.filter((item) => item.storageId !== asset.storageId),
                        );
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Public media can be viewed by anyone when the announcement is published.
        </p>
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-500">Save a draft or publish immediately.</span>
        <div className="flex gap-2">
          {editingId && (
            <Button type="button" variant="ghost" size="sm" onClick={() => resetForm()}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || uploading}
            onClick={() => void save("draft")}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            Save draft
          </Button>
          <Button type="button" size="sm" disabled={busy || uploading} onClick={() => void save("published")}>
            <Send className="size-4" />
            Publish
          </Button>
        </div>
      </div>

      {announcements === undefined ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <AnnouncementList
            title="Drafts"
            items={all.filter((item) => item.status === "draft")}
            empty="No drafts yet."
            userId={userId}
            isAdmin={isAdmin}
            onEdit={edit}
            onStatus={(item) => void changeStatus(item, "published")}
            onRemove={(item) => void remove(item)}
          />
          <AnnouncementList
            title="Published"
            items={all.filter((item) => item.status === "published")}
            empty="No public announcements yet."
            userId={userId}
            isAdmin={isAdmin}
            onEdit={edit}
            onStatus={(item) => void changeStatus(item, "draft")}
            onRemove={(item) => void remove(item)}
          />
        </div>
      )}
    </div>
  );
}

function StaffBoard({
  canDeleteAny,
  userId,
}: {
  canDeleteAny: boolean;
  userId: AnyUserId;
}) {
  const board = useQuery(api.staff.board);
  const post = useMutation(api.staff.post);
  const removeMessage = useMutation(api.staff.removeMessage);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;

    setBusy(true);
    setError("");

    try {
      await post({ body });
      setBody("");
    } catch (err) {
      setError("Could not post the message.");
    } finally {
      setBusy(false);
    }
  }

  async function removeMessageFromBoard(
    messageId: Id<"staffMessages">,
    authorId: AnyUserId,
  ) {
    if (!window.confirm("Delete this message? This cannot be undone.")) return;

    setError("");
    try {
      await removeMessage({ messageId });
    } catch (err) {
      setError("Could not delete the message.");
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Team board</h2>
        <p className="mt-1 text-sm text-slate-600">Internal notes for staff. Newest first.</p>
      </div>

      <form onSubmit={submit} className="mt-5">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={3}
          placeholder="Share an update or ask the team…"
          className="resize-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">{body.length}/{MAX_MESSAGE_LENGTH}</span>
          <Button
            type="submit"
            size="sm"
            disabled={busy || !body.trim()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Post update
          </Button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="divide-y divide-slate-200 border-t border-slate-200">
        {board === undefined ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : board === null ? (
          <p className="py-4 text-sm text-slate-600">Staff access required.</p>
        ) : board.length === 0 ? (
          <p className="py-6 text-sm text-slate-500">No messages yet.</p>
        ) : (
          board.map((message) => (
            <article key={message._id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {message.authorName}
                    {message.badge && <RoleBadge badge={message.badge} />}
                  </p>
                  <p className="text-xs text-slate-500">
                    {[message.department, message.position].filter(Boolean).join(" · ") || "Company team"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <time className="text-xs text-slate-400">
                    {formatTime(message.createdAt)}
                  </time>
                  {(canDeleteAny || message.authorId === userId) && (
                    <button
                      type="button"
                      aria-label="Delete message"
                      onClick={() => void removeMessageFromBoard(message._id, message.authorId)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
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

type SafeStaffWorkspaceProps = { isAdmin: boolean; userId: StaffUserId | undefined };

const SafeStaffWorkspace: React.FC<SafeStaffWorkspaceProps> = ({ isAdmin, userId }) => {
  const location = useLocation();
  const me = useQuery(api.staff.me);
  const tabs = [
    { id: "overview" as const, label: "Workspace" },
    { id: "announcements" as const, label: "Announcements" },
    { id: "messages" as const, label: "Team board" },
  ];

  const selectedTab: StaffSection =
    tabs.find((tab) => location.pathname.endsWith("/staff/" + tab.id))?.id ?? "overview";
  const adminView = isAdmin || me?.isAdmin === true;
  return (
    <div className="staff-workspace min-h-screen bg-white pb-12">
      <header className="border-b border-slate-200 px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold">Staff workspace</h1>
          <p className="mt-1 text-sm text-slate-600">
            {me?.signedIn ? `Signed in as ${displayNameFor(me)}.` : "For OpenWorlds employees and volunteers."}
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
        <nav className="mb-6 flex flex-wrap gap-5 border-b border-slate-200 pb-3 text-sm" aria-label="Staff workspace">
          {tabs.map(({ id, label }) => (
            <Link
              key={id}
              to={`/staff/${id}`}
              className={selectedTab === id ? "font-semibold text-[#14583c]" : "text-slate-500 hover:text-slate-900"}
            >
              {label}
            </Link>
          ))}
        </nav>

      {selectedTab === "overview" && me?.isStaff && <MoreStaffTools />}

      {selectedTab === "overview" ? (
        <WorkspaceOverview isAdmin={adminView} me={me} />
      ) : selectedTab === "announcements" ? (
        <AnnouncementsPanel isAdmin={adminView} userId={userId ?? (me?.userId ?? "")} />
      ) : (
        <StaffBoard canDeleteAny={adminView} userId={userId ?? (me?.userId ?? "")} />
      )}
      </div>
    </div>
  );
};

function SiteStatusControl() {
  const status = useQuery(api.siteStatus.staffStatus);
  const requestCode = useAction(api.siteStatus.requestChangeCode);
  const confirmChange = useMutation(api.siteStatus.confirmChange);
  const [targetStatus, setTargetStatus] = useState<"available" | "unavailable">("available");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"choose" | "verify">("choose");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await requestCode({ status: targetStatus });
      setStep("verify");
      setMessage("A six-digit verification code was sent to the support email. It expires in 10 minutes.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send the verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function applyStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await confirmChange({ code });
      if (!result.ok) throw new Error(result.message);
      setStep("choose");
      setCode("");
      setMessage("Website status updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update website status.");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel = status === "unavailable" ? "The site is under construction or currently unavailable" : status === "available" ? "Default" : "Loading…";
  return (
    <section>
      <div>
        <h2 className="font-semibold">Website status</h2>
        <p className="mt-1 text-sm text-slate-600">Current status: <strong>{statusLabel}</strong>. A verified code from support@openworlds.dk is required for each change.</p>
        {step === "choose" ? (
          <form onSubmit={(event) => void sendCode(event)} className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-0 space-y-2"><Label htmlFor="site-status-target">Set site to</Label><select id="site-status-target" value={targetStatus} onChange={(event) => setTargetStatus(event.target.value as typeof targetStatus)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="available">Default</option><option value="unavailable">The site is under construction or currently unavailable</option></select></div>
            <Button type="submit" disabled={busy || status === targetStatus}>{busy ? "Sending code…" : "Send verification code"}</Button>
          </form>
        ) : (
          <form onSubmit={(event) => void applyStatus(event)} className="mt-4 flex flex-wrap items-end gap-3">
            <div className="w-full max-w-xs space-y-2"><Label htmlFor="site-status-code">Support email code</Label><Input id="site-status-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6 digits" /></div>
            <Button type="submit" disabled={busy || code.length !== 6}>{busy ? "Updating…" : "Verify & apply"}</Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => { setStep("choose"); setCode(""); setMessage(""); }}>Cancel</Button>
          </form>
        )}
        {message && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-slate-600">{step === "verify" && <AlertTriangle className="size-4" />}{message}</p>}
      </div>
    </section>
  );
}

function StaffSecurityPanel() {
  const data = useQuery(api.security.listBansAndAppeals);
  const setBan = useMutation(api.security.setBan);
  const reviewAppeal = useMutation(api.security.reviewAppeal);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function perform(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setError("");
    try { await action(); }
    catch { setError("Could not complete moderation action. Please try again."); }
    finally { setBusyId(null); }
  }

  if (!data) return null;
  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-semibold">Website access review</h2><p className="mt-1 text-sm text-slate-600">Remove a ban or approve an appeal to restore access.</p></div>
        <span className="text-xs text-slate-500">{data.bans.length} active · {data.appeals.length} appeals</span>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {data.appeals.length > 0 && <div className="divide-y divide-slate-200 border-t border-slate-200">{data.appeals.map((appeal) => <article key={appeal._id} className="border-t border-slate-200 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{appeal.name}</p><p className="text-xs text-slate-500">{appeal.email} · {new Date(appeal.createdAt).toLocaleString()}</p></div><span className="text-xs text-slate-500">Appeal pending</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{appeal.message}</p><div className="mt-3 flex gap-2"><Button size="sm" disabled={busyId === appeal._id} onClick={() => void perform(appeal._id, () => reviewAppeal({ appealId: appeal._id, decision: "approved" }))}><Check className="size-4" /> Approve &amp; unban</Button><Button size="sm" variant="outline" disabled={busyId === appeal._id} onClick={() => void perform(appeal._id, () => reviewAppeal({ appealId: appeal._id, decision: "declined" }))}><XCircle className="size-4" /> Decline</Button></div></article>)}</div>}
      {data.appeals.length === 0 && data.bans.length === 0 ? <p className="mt-4 text-sm text-slate-500">No restrictions or appeals need attention.</p> : data.bans.length > 0 && <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200">{data.bans.map((ban) => <li key={ban.userId} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{ban.name}</p><p className="text-sm text-slate-500">{ban.email} · {ban.reason}</p></div><Button size="sm" variant="outline" disabled={busyId === ban.userId} onClick={() => void perform(ban.userId, () => setBan({ userId: ban.userId, banned: false }))}>{busyId === ban.userId ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Unban</Button></li>)}</ul>}
    </section>
  );
}

export function StaffOverview() {
  return (
    <div className="staff-portal min-h-screen">
      <SiteNav />
      <SafeStaffWorkspace isAdmin={false} userId={undefined} />
    </div>
  );
}

export function StaffAnnouncements() {
  return (
    <div className="staff-portal min-h-screen">
      <SiteNav />
      <SafeStaffWorkspace isAdmin={false} userId={undefined} />
    </div>
  );
}

export function StaffMessages() {
  return (
    <div className="staff-portal min-h-screen">
      <SiteNav />
      <SafeStaffWorkspace isAdmin={false} userId={undefined} />
    </div>
  );
}

type StaffWorkspaceProps = { isAdmin: boolean; userId: StaffUserId };

export function StaffWorkspace({ isAdmin, userId }: StaffWorkspaceProps) {
  return (
    <div className="staff-portal min-h-screen">
      <SafeStaffWorkspace isAdmin={isAdmin} userId={userId} />
    </div>
  );
}
