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
  Bell,
  Building2,
  FileText,
  ImagePlus,
  Loader2,
  Megaphone,
  Pencil,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
  Users,
  UserCircle,
  Check,
  Construction,
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

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("") || "?";
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

type StaffSection = "overview" | "announcements" | "messages";

function MoreStaffTools() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-5 rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>
          <span className="block text-sm font-semibold">More staff tools</span>
          <span className="mt-1 block text-xs text-slate-500">Website status and account access reviews</span>
        </span>
        <span aria-hidden="true" className="text-slate-500">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-slate-100 p-4">
          <SiteStatusControl />
          <StaffSecurityPanel />
        </div>
      )}
    </section>
  );
}

const POSITION_JOB_DESCRIPTIONS: Record<string, string> = {
  "chief executive officer": "Set OpenWorlds’ direction, make key leadership decisions, and keep the organization focused on its goals.",
  "chief technology officer": "Guide the technical direction, architecture, security, and reliability of OpenWorlds.",
  "chief design officer": "Guide the product and experience design direction across OpenWorlds.",
  "chief marketing officer": "Lead OpenWorlds’ messaging, marketing plans, and audience growth.",
  "chief people officer": "Support the team, coordinate people practices, and help contributors do their best work.",
  "chief finance officer": "Oversee budgeting, financial planning, and clear reporting on project resources.",
  "chief legal officer": "Help the organization identify legal risks and keep policies and agreements in good order.",
  "head of community": "Guide community programs and help keep OpenWorlds spaces welcoming and useful to players.",
  "lead game designer": "Lead gameplay and systems design, turning ideas and player feedback into clear, balanced features.",
  "lead programmer": "Guide software implementation, review engineering work, and help keep the codebase reliable.",
  "lead artist": "Guide the visual direction and coordinate art production across OpenWorlds.",
  "senior developer": "Build and maintain platform features, review technical work, and support other developers.",
  developer: "Build, test, and maintain software features for OpenWorlds with the rest of the development team.",
  producer: "Coordinate schedules, priorities, and communication so project work moves forward smoothly.",
  "community manager": "Support community conversations, share useful updates, and help players feel welcome.",
  "customer support lead": "Coordinate player support, help resolve complex requests, and improve support processes.",
  "senior qa engineer": "Plan and lead quality checks, find and document defects, and help prevent regressions.",
  "data analyst": "Analyze project data and communicate clear, evidence-based findings to the team.",
  "ai researcher": "Explore and evaluate AI approaches that could support OpenWorlds’ goals.",
  "ai engineer": "Build, integrate, and maintain AI-powered systems for OpenWorlds.",
  "art director": "Set and maintain the visual style, reviewing artwork for consistency and quality.",
  "technical writer": "Write and maintain clear technical guides and documentation for the team and users.",
};

function WorkspaceOverview({
  isAdmin,
  me,
  onAnnouncements,
}: {
  isAdmin: boolean;
  me: ReturnType<typeof useQuery<typeof api.staff.me>>;
  onAnnouncements: () => void;
}) {
  const announcements = useQuery(api.staff.announcements);
  const recent = (announcements ?? []).slice(0, 3);

  return (
    <div className="space-y-5">
      {/* Signed-in staff header: nickname first, never the email. */}
      {me && me.signedIn && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-sm font-semibold text-[#7651c9]">
                  {displayInitials(me)}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{displayNameFor(me)}</h2>
                  <p className="text-xs text-slate-500">
                    {me.isAdmin ? "Company admin" : me.isStaff ? "Company staff" : "Signed in"}
                    {me.department || me.position ? ` · ${[me.department, me.position].filter(Boolean).join(" · ")}` : ""}
                  </p>
                  {me.memberStatus === "volunteer-thank-you" && <span className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">Volunteer</span>}
                </div>
              </div>
              {me.nickname ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <UserCircle className="size-3.5 text-slate-400" />
                  Public nickname set · email stays private
                </p>
              ) : (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                  <UserCircle className="size-3.5 text-amber-600" />
                  Pick a nickname to replace your name on the staff portal
                </p>
              )}
            </div>
            {me.badge && (
              <RoleBadge badge={me.badge} className="shrink-0" />
            )}
          </div>
        </section>
      )}

      {/* Nickname settings: first-login pick + always-change control. */}
      {me && me.signedIn && (
        <details className="rounded-xl border border-slate-200 bg-white">
          <summary className="cursor-pointer list-none p-4 text-sm font-semibold marker:hidden">
            Account settings <span className="ml-2 text-xs font-normal text-slate-500">Nickname and security</span>
          </summary>
          <div className="space-y-4 border-t border-slate-100 p-4">
            {me.isStaff && <NicknameSettings me={me} />}
            <AccountSecuritySettings />
          </div>
        </details>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Announcements" value={announcements?.length ?? "—"} detail="Drafts and published updates" />
        <Stat label="Published" value={announcements?.filter((item) => item.status === "published").length ?? "—"} detail="Live on public News" />
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
          <h2 className="font-semibold">Staff links</h2>
          <p className="mt-1 text-xs text-slate-500">Choose the area you need.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <QuickLink to="/staff/announcements" title="Announcements" detail="Draft and publish updates" />
            <QuickLink to="/staff/messages" title="Team board" detail="Read and share internal updates" />
            <QuickLink to="/staff/creators" title="Creator verification" detail="Review creator applications" />
            {isAdmin && <QuickLink to="/admin" title="Admin console" detail="Manage company access and operations" />}
            <QuickLink to="/news" title="Public news" detail="View published announcements" />
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
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <UserCircle className="size-4 text-slate-500" />
        <h3 className="font-semibold text-sm">Public nickname</h3>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        This is the name shown on the staff portal, board, and announcements. It is not listed on the public About page.
      </p>

      {saved ? (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <Check className="size-4 shrink-0" />
          Nickname saved. It may take a moment to appear everywhere.
        </div>
      ) : null}

      {error && (
        <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
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
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {title === "Drafts" ? <FileText className="size-4" /> : <Bell className="size-4" />}
          {title}
        </h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const mayManage = isAdmin || item.authorId === userId;
            return (
              <article key={item._id} className="py-4">
                <p className="text-xs font-medium capitalize text-[#7651c9]">
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7651c9]">Public-facing</p>
          <h2 className="mt-1 text-xl font-semibold">Game announcements</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create polished updates with photos or video. Your personal name is never shown publicly.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => resetForm()}>
          <FileText className="size-4" />
          New post
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {newsPostingStatus?.eligible && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-900">News publishing verification</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Verify your company email before creating, editing, or publishing announcements. Verification stays active for one hour.</p>
            </div>
            {newsPostingStatus.verifiedUntil > Date.now() ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Verified</span>
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

      <section id="game-announcement-form" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]">
            {editingId ? <Pencil className="size-4" /> : <Megaphone className="size-4" />}
          </span>

          <div>
            <h3 className="font-semibold">{editingId ? "Edit announcement" : "Compose announcement"}</h3>
            <p className="text-xs text-slate-500">
              Only published posts appear on the News and Events pages. Individual poster identities remain private.
            </p>
          </div>
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

        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
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
                <div key={asset.storageId} className="rounded-lg border border-slate-200 bg-white p-2">
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-[#0066cc]">
          <Users className="size-5" />
        </span>

        <div>
          <h2 className="font-semibold">Staff message board</h2>
          <p className="text-xs text-slate-500">
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
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {board === undefined ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : board === null ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm">
            Staff access required.
          </p>
        ) : board.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No messages yet. Start a team update.
          </div>
        ) : (
          board.map((message) => (
            <article key={message._id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold">
                    {initials(message.authorName)}
                  </span>

                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {message.authorName}
                      {message.badge && <RoleBadge badge={message.badge} />}
                    </p>
                    <p className="text-xs text-slate-500">
                      {[message.department, message.position].filter(Boolean).join(" · ") || "Company team"}
                    </p>
                  </div>
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
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
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
    { id: "overview" as const, label: "Workspace", icon: Building2 },
    { id: "announcements" as const, label: "Announcements", icon: Megaphone },
    { id: "messages" as const, label: "Team board", icon: Users },
  ];

  const selectedTab: StaffSection =
    tabs.find((tab) => location.pathname.endsWith("/staff/" + tab.id))?.id ?? "overview";
  const adminView = isAdmin || me?.isAdmin === true;
  const welcomePosition = me?.position?.trim() || (adminView ? "Company admin" : "Company staff");
  const welcomeJob = POSITION_JOB_DESCRIPTIONS[welcomePosition.toLowerCase()] || "Work with the OpenWorlds team to support players and help the project move forward.";
  const selectedLabel = tabs.find((tab) => tab.id === selectedTab)?.label ?? "Workspace";

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#f4f5f2] px-4 pb-12 pt-6 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 border-b-2 border-[#176b45] pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#176b45]">OpenWorlds / Company Staff</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff workspace</h1>
              <p className="mt-1 text-sm text-slate-600">{me?.signedIn ? `Welcome, ${displayNameFor(me)}.` : "Team updates and tools."} {selectedLabel}</p>
            </div>
            {me?.signedIn && <p className="max-w-xl text-sm leading-6 text-slate-600"><span className="font-semibold text-slate-900">{welcomePosition}:</span> {welcomeJob}</p>}
          </div>
        </header>
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap gap-1 border-b border-slate-300" role="tablist" aria-label="Staff workspace">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            to={`/staff/${id}`}
            className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${
              selectedTab === id
                ? "border-[#176b45] text-[#14583c]"
                : "border-transparent text-slate-500 hover:border-slate-400 hover:text-slate-800"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </div>

      {selectedTab === "overview" && me?.isStaff && <MoreStaffTools />}

      {selectedTab === "overview" ? (
        <WorkspaceOverview isAdmin={adminView} me={me} onAnnouncements={() => {}} />
      ) : selectedTab === "announcements" ? (
        <AnnouncementsPanel isAdmin={adminView} userId={userId ?? (me?.userId ?? "")} />
      ) : (
        <StaffBoard canDeleteAny={adminView} userId={userId ?? (me?.userId ?? "")} />
      )}
        </div>
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
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800"><Construction className="size-5" /></span>
        <div className="min-w-0 flex-1">
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
    <section className="rounded-xl border border-amber-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-semibold">Website access review</h2><p className="mt-1 text-sm text-slate-600">Review active restrictions and player appeals. Remove a ban or approve an appeal to restore access.</p></div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">{data.bans.length} active · {data.appeals.length} appeals</span>
      </div>
      {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {data.appeals.length > 0 && <div className="mt-4 space-y-3">{data.appeals.map((appeal) => <article key={appeal._id} className="rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{appeal.name}</p><p className="text-xs text-slate-500">{appeal.email} · {new Date(appeal.createdAt).toLocaleString()}</p></div><span className="rounded-full border border-amber-200 bg-white px-2 py-1 text-xs text-amber-800">Appeal pending</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{appeal.message}</p><div className="mt-3 flex gap-2"><Button size="sm" disabled={busyId === appeal._id} onClick={() => void perform(appeal._id, () => reviewAppeal({ appealId: appeal._id, decision: "approved" }))}><Check className="size-4" /> Approve &amp; unban</Button><Button size="sm" variant="outline" disabled={busyId === appeal._id} onClick={() => void perform(appeal._id, () => reviewAppeal({ appealId: appeal._id, decision: "declined" }))}><XCircle className="size-4" /> Decline</Button></div></article>)}</div>}
      {data.appeals.length === 0 && data.bans.length === 0 ? <p className="mt-4 text-sm text-slate-500">No restrictions or appeals need attention.</p> : data.bans.length > 0 && <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">{data.bans.map((ban) => <li key={ban.userId} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{ban.name}</p><p className="text-sm text-slate-500">{ban.email} · {ban.reason}</p></div><Button size="sm" variant="outline" disabled={busyId === ban.userId} onClick={() => void perform(ban.userId, () => setBan({ userId: ban.userId, banned: false }))}>{busyId === ban.userId ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Unban</Button></li>)}</ul>}
    </section>
  );
}

export function StaffOverview() {
  return (
    <div className="min-h-screen bg-[#f5f7f6] text-slate-900">
      <SiteNav />
      <SafeStaffWorkspace isAdmin={false} userId={undefined} />
    </div>
  );
}

export function StaffAnnouncements() {
  return (
    <div className="min-h-screen bg-[#f5f7f6] text-slate-900">
      <SiteNav />
      <SafeStaffWorkspace isAdmin={false} userId={undefined} />
    </div>
  );
}

export function StaffMessages() {
  return (
    <div className="min-h-screen bg-[#f5f7f6] text-slate-900">
      <SiteNav />
      <SafeStaffWorkspace isAdmin={false} userId={undefined} />
    </div>
  );
}

type StaffWorkspaceProps = { isAdmin: boolean; userId: StaffUserId };

export function StaffWorkspace({ isAdmin, userId }: StaffWorkspaceProps) {
  return <SafeStaffWorkspace isAdmin={isAdmin} userId={userId} />;
}
