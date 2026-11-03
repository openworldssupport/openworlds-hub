import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  CalendarDays,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Mic,
  PhoneOff,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { displayInitials } from "@/lib/staff";

type DepartmentMember = {
  userId: Id<"users">;
  name: string;
  position: string | null;
  badge: "staff" | "dev";
  isAdmin: boolean;
  isViewer: boolean;
  isLead: boolean;
  isHead: boolean;
  isInterimHead: boolean;
};

type DepartmentHead = {
  userId: Id<"users">;
  name: string;
  position: string | null;
  badge: "staff" | "dev";
  isViewer: boolean;
  isInterim: boolean;
};

type DepartmentPost = {
  _id: Id<"departmentPosts">;
  authorId: Id<"users">;
  authorName: string;
  authorPosition: string | null;
  authorBadge: "staff" | "dev" | null;
  body: string;
  createdAt: number;
};

type DepartmentMeeting = {
  _id: Id<"departmentMeetings">;
  title: string;
  agenda: string | null;
  startsAt: number;
  durationMinutes: number;
  location: string | null;
  createdBy: Id<"users">;
  createdByName: string;
  createdAt: number;
};

type GeneralPost = {
  _id: Id<"staffGeneralPosts">;
  authorId: Id<"users">;
  authorName: string;
  authorDepartment: string | null;
  authorPosition: string | null;
  authorBadge: "staff" | "dev" | null;
  body: string;
  createdAt: number;
};

type Department = {
  key: string;
  name: string;
  members: DepartmentMember[];
  head: DepartmentHead | null;
  posts: DepartmentPost[];
  meetings: DepartmentMeeting[];
  viewerCanSchedule: boolean;
};

type HubData = {
  viewer: {
    id: Id<"users">;
    isAdmin: boolean;
    isExecutiveLeadership: boolean;
    canViewAllDepartments: boolean;
    department: string | null;
    departmentKey: string | null;
  };
  departments: Department[];
  generalPosts: GeneralPost[];
  allStaffMeetings: DepartmentMeeting[];
};

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatMonth(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short" });
}

function formatDay(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, { day: "numeric" });
}

function formatClock(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function localDateTimeValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultMeetingStart() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return localDateTimeValue(date);
}

function isWebLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function departmentAnchor(key: string) {
  return `department-${key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function voiceRoomUrl(roomKey: string) {
  const slug = roomKey.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `https://meet.jit.si/OpenWorlds-${slug}#config.prejoinPageEnabled=false&config.startWithVideoMuted=true&config.disableDeepLinking=true`;
}

function VoiceRoomOverlay({ title, roomUrl, onClose }: { title: string; roomUrl: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2f22]/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${title} voice room`}>
      <div className="flex h-[min(88vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#0d2f22] shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a9c8b6]">Voice channel</p>
            <p className="truncate text-sm font-medium">{title}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={roomUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-[#e6f3e9] hover:bg-white/10">
              <ExternalLink className="size-3.5" /> Open in new tab
            </a>
            <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 text-xs text-white hover:bg-white/20">
              <PhoneOff className="size-3.5" /> Leave
            </button>
          </div>
        </div>
        <iframe
          title={`${title} voice room`}
          src={roomUrl}
          className="min-h-0 flex-1 border-0 bg-black"
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-200 pb-2">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Roster({ members }: { members: DepartmentMember[] }) {
  return (
    <div>
      <SectionHeading title="Roster" detail={`${members.length} ${members.length === 1 ? "person" : "people"}`} />
      {members.length === 0 ? (
        <p className="py-4 text-sm leading-6 text-slate-500">No one has been assigned to this department yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {members.map((member) => (
            <li key={member.userId} className="flex items-start gap-3 py-3.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8f0ea] text-[11px] font-semibold text-[#14583c]">
                {displayInitials({ name: member.name })}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-medium text-slate-900">
                  <span className="truncate">{member.name}</span>
                  {member.isViewer && <span className="text-xs font-normal text-slate-400">you</span>}
                  {member.isAdmin && <span className="text-xs font-normal text-slate-400">admin</span>}
                  {member.isHead && <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#795600]">{member.isInterimHead ? "Acting head" : "Head of Department"}</span>}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{member.position || "No position listed"}</span>
                  {member.badge && <RoleBadge badge={member.badge} />}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DepartmentFeed({
  department,
  viewer,
}: {
  department: Department;
  viewer: HubData["viewer"];
}) {
  const createPost = useMutation(api.departments.createPost);
  const deletePost = useMutation(api.departments.deletePost);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState<Id<"departmentPosts"> | null>(null);
  const canPost = viewer.isAdmin || viewer.departmentKey === department.key;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await createPost({ department: department.name, body });
      setBody("");
      setNotice("Update posted to the department feed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post this update.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(postId: Id<"departmentPosts">) {
    if (!window.confirm("Remove this department update? This cannot be undone.")) return;
    setDeleting(postId);
    setError("");
    setNotice("");
    try {
      await deletePost({ postId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove this update.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <SectionHeading title="News & updates" detail="Department announcements and working notes" />
      {canPost ? (
        <form onSubmit={(event) => void submit(event)} className="mt-4">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={`Share an update with ${department.name}…`}
            className="resize-none text-sm"
            aria-label={`Post an update to ${department.name}`}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">{body.length}/2,000</span>
            <Button type="submit" size="sm" disabled={busy || !body.trim()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Post update
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          Only members of this department or an administrator can post here.
        </p>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}

      {department.posts.length === 0 ? (
        <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">No department updates yet.</p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
          {department.posts.map((post) => (
            <article key={post._id} className="py-4 first:pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-800">
                    {post.authorName}
                    {post.authorBadge && <RoleBadge badge={post.authorBadge} />}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {[post.authorPosition, formatTime(post.createdAt)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {(viewer.isAdmin || post.authorId === viewer.id) && (
                  <button
                    type="button"
                    onClick={() => void remove(post._id)}
                    disabled={deleting === post._id}
                    aria-label="Remove department update"
                    className="p-1 text-slate-400 transition hover:text-red-600 disabled:opacity-50"
                  >
                    {deleting === post._id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function MeetingCard({
  meeting,
  viewer,
  onCancel,
  cancelling,
  allowCancel,
  executiveCanCancel,
  onJoinVoice,
}: {
  meeting: DepartmentMeeting;
  viewer: HubData["viewer"];
  onCancel: (meeting: DepartmentMeeting) => void;
  cancelling: boolean;
  allowCancel: boolean;
  executiveCanCancel?: boolean;
  onJoinVoice?: () => void;
}) {
  const canCancel = allowCancel && (
    viewer.isAdmin ||
    meeting.createdBy === viewer.id ||
    (Boolean(executiveCanCancel) && viewer.isExecutiveLeadership)
  );
  return (
    <article className="border-l-2 border-[#b9d0bf] pl-3.5">
      <div className="flex items-start gap-3">
        <div className="w-9 shrink-0 pt-0.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">{formatMonth(meeting.startsAt)}</p>
          <p className="text-lg font-semibold leading-tight text-slate-900">{formatDay(meeting.startsAt)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-5 text-slate-900">{meeting.title}</p>
            {canCancel && (
              <button
                type="button"
                onClick={() => onCancel(meeting)}
                disabled={cancelling}
                aria-label={`Cancel ${meeting.title}`}
                className="p-1 text-slate-400 transition hover:text-red-600 disabled:opacity-50"
              >
                {cancelling ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
              </button>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1"><Clock className="size-3" />{formatClock(meeting.startsAt)} · {meeting.durationMinutes} min</span>
            {meeting.location && (
              isWebLink(meeting.location) ? (
                <a href={meeting.location} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#0066cc] underline">
                  <MapPin className="size-3" />Join link
                </a>
              ) : (
                <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{meeting.location}</span>
              )
            )}
          </p>
          {meeting.agenda && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">{meeting.agenda}</p>}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-slate-400">Organised by {meeting.createdByName}</p>
            {onJoinVoice && (
              <Button type="button" size="sm" variant="outline" onClick={onJoinVoice} className="h-7 px-2 text-[11px]">
                <Mic className="size-3.5" /> Voice room
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function DepartmentMeetings({
  department,
  viewer,
}: {
  department: Department;
  viewer: HubData["viewer"];
}) {
  const createMeeting = useMutation(api.departments.createMeeting);
  const cancelMeeting = useMutation(api.departments.cancelMeeting);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(defaultMeetingStart);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [location, setLocation] = useState("");
  const [agenda, setAgenda] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState<Id<"departmentMeetings"> | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [voiceRoom, setVoiceRoom] = useState<{ title: string; url: string } | null>(null);
  const canSchedule = department.viewerCanSchedule;
  const canJoinDepartmentVoice = viewer.isAdmin || viewer.departmentKey === department.key || viewer.departmentKey === "executive leadership";
  const now = Date.now();
  const upcoming = department.meetings.filter((meeting) => meeting.startsAt >= now);
  const past = department.meetings.filter((meeting) => meeting.startsAt < now);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const timestamp = new Date(startsAt).getTime();
      if (!Number.isFinite(timestamp)) throw new Error("Choose a valid meeting date and time.");
      await createMeeting({
        department: department.name,
        title,
        agenda,
        startsAt: timestamp,
        durationMinutes,
        location,
      });
      setTitle("");
      setAgenda("");
      setLocation("");
      setStartsAt(defaultMeetingStart());
      setDurationMinutes(30);
      setOpen(false);
      setNotice("Meeting scheduled. It is now visible to the whole company.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule this meeting.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(meeting: DepartmentMeeting) {
    if (!window.confirm(`Cancel “${meeting.title}”?`)) return;
    setCancelling(meeting._id);
    setError("");
    setNotice("");
    try {
      await cancelMeeting({ meetingId: meeting._id });
      setNotice("Meeting cancelled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel this meeting.");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <SectionHeading title="Meetings" detail="Upcoming and recent department syncs" />
        {canSchedule && (
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen((value) => !value)} className="shrink-0">
            <Plus className="size-3.5" />
            {open ? "Close" : "Schedule"}
          </Button>
        )}
      </div>

      {open && canSchedule && (
        <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3 rounded-xl border border-[#dce5df] bg-[#f8faf8] p-3.5">
          <div className="space-y-1.5">
            <Label htmlFor={`meeting-title-${department.key}`} className="text-xs">Title</Label>
            <Input id={`meeting-title-${department.key}`} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="Weekly team sync" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`meeting-start-${department.key}`} className="text-xs">When</Label>
              <Input id={`meeting-start-${department.key}`} type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`meeting-duration-${department.key}`} className="text-xs">Minutes</Label>
              <Input id={`meeting-duration-${department.key}`} type="number" min={15} max={480} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`meeting-location-${department.key}`} className="text-xs">Room or meeting link</Label>
            <Input id={`meeting-location-${department.key}`} value={location} onChange={(event) => setLocation(event.target.value)} maxLength={300} placeholder="Meeting room, or https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`meeting-agenda-${department.key}`} className="text-xs">Agenda</Label>
            <Textarea id={`meeting-agenda-${department.key}`} value={agenda} onChange={(event) => setAgenda(event.target.value)} rows={3} maxLength={2000} className="resize-none text-sm" placeholder="What should the team prepare?" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={busy || !title.trim() || !startsAt}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CalendarDays className="size-4" />}
              Schedule meeting
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {!canSchedule && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          Only the highest position in this department or Executive Leadership can schedule meetings.
        </p>
      )}
      {canJoinDepartmentVoice && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => setVoiceRoom({ title: `${department.name} voice channel`, url: voiceRoomUrl(`department-${department.key}`) })}
        >
          <Mic className="size-3.5" /> Join department voice channel
        </Button>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}

      <div className="mt-4 space-y-2.5">
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming meetings.</p>
        ) : upcoming.map((meeting) => (
          <MeetingCard
            key={meeting._id}
            meeting={meeting}
            viewer={viewer}
            onCancel={(item) => void cancel(item)}
            cancelling={cancelling === meeting._id}
            allowCancel
            onJoinVoice={() => setVoiceRoom({ title: meeting.title, url: voiceRoomUrl(`meeting-${meeting._id}`) })}
          />
        ))}
      </div>

      {past.length > 0 && (
        <details className="mt-4 border-t border-slate-100 pt-3">
          <summary className="cursor-pointer text-xs font-medium text-slate-500">Recent meetings ({past.length})</summary>
          <div className="mt-2 space-y-2 opacity-75">
            {past.map((meeting) => (
              <MeetingCard
                key={meeting._id}
                meeting={meeting}
                viewer={viewer}
                onCancel={() => undefined}
                cancelling={false}
                allowCancel={false}
              />
            ))}
          </div>
        </details>
      )}

      {voiceRoom && <VoiceRoomOverlay title={voiceRoom.title} roomUrl={voiceRoom.url} onClose={() => setVoiceRoom(null)} />}
    </div>
  );
}

function GeneralFeed({ viewer, posts }: { viewer: HubData["viewer"]; posts: GeneralPost[] }) {
  const createPost = useMutation(api.departments.createGeneralPost);
  const deletePost = useMutation(api.departments.deleteGeneralPost);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState<Id<"staffGeneralPosts"> | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await createPost({ body });
      setBody("");
      setNotice("Message posted to general comms.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post this message.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(postId: Id<"staffGeneralPosts">) {
    if (!window.confirm("Remove this general comms message? This cannot be undone.")) return;
    setDeleting(postId);
    setError("");
    setNotice("");
    try {
      await deletePost({ postId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove this message.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <SectionHeading title="General comms" detail="A shared feed for staff in every department" />
      <form onSubmit={(event) => void submit(event)} className="mt-4">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Talk to staff across the company…"
          className="resize-none text-sm"
          aria-label="Post a message to general staff comms"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">{body.length}/2,000</span>
          <Button type="submit" size="sm" disabled={busy || !body.trim()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Post message
          </Button>
        </div>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}

      {posts.length === 0 ? (
        <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">No general messages yet. Start the conversation.</p>
      ) : (
        <div className="mt-4 max-h-[28rem] divide-y divide-slate-100 overflow-y-auto border-t border-slate-100 pr-1">
          {posts.map((post) => (
            <article key={post._id} className="py-4 first:pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-800">
                    {post.authorName}
                    {post.authorBadge && <RoleBadge badge={post.authorBadge} />}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {[post.authorPosition, post.authorDepartment, formatTime(post.createdAt)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {(viewer.isAdmin || viewer.isExecutiveLeadership || post.authorId === viewer.id) && (
                  <button
                    type="button"
                    onClick={() => void remove(post._id)}
                    disabled={deleting === post._id}
                    aria-label="Remove general comms message"
                    className="p-1 text-slate-400 transition hover:text-red-600 disabled:opacity-50"
                  >
                    {deleting === post._id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function AllStaffMeetings({ viewer, meetings }: { viewer: HubData["viewer"]; meetings: DepartmentMeeting[] }) {
  const createMeeting = useMutation(api.departments.createAllStaffMeeting);
  const cancelMeeting = useMutation(api.departments.cancelMeeting);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(defaultMeetingStart);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [location, setLocation] = useState("");
  const [agenda, setAgenda] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState<Id<"departmentMeetings"> | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [voiceRoom, setVoiceRoom] = useState<{ title: string; url: string } | null>(null);
  const canSchedule = viewer.isExecutiveLeadership;
  const now = Date.now();
  const upcoming = meetings.filter((meeting) => meeting.startsAt >= now);
  const past = meetings.filter((meeting) => meeting.startsAt < now);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const timestamp = new Date(startsAt).getTime();
      if (!Number.isFinite(timestamp)) throw new Error("Choose a valid meeting date and time.");
      await createMeeting({ title, agenda, startsAt: timestamp, durationMinutes, location });
      setTitle("");
      setAgenda("");
      setLocation("");
      setStartsAt(defaultMeetingStart());
      setDurationMinutes(30);
      setOpen(false);
      setNotice("All-staff meeting scheduled for every department.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule this meeting.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(meeting: DepartmentMeeting) {
    if (!window.confirm(`Cancel “${meeting.title}”?`)) return;
    setCancelling(meeting._id);
    setError("");
    setNotice("");
    try {
      await cancelMeeting({ meetingId: meeting._id });
      setNotice("Meeting cancelled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel this meeting.");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <SectionHeading title="All-staff meetings" detail="Company-wide sessions for every department" />
        {canSchedule && (
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen((value) => !value)} className="shrink-0">
            <Plus className="size-3.5" />
            {open ? "Close" : "Schedule"}
          </Button>
        )}
      </div>

      {open && canSchedule && (
        <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3 rounded-xl border border-[#dce5df] bg-[#f8faf8] p-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="all-staff-meeting-title" className="text-xs">Title</Label>
            <Input id="all-staff-meeting-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="Company-wide town hall" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="all-staff-meeting-start" className="text-xs">When</Label>
              <Input id="all-staff-meeting-start" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="all-staff-meeting-duration" className="text-xs">Minutes</Label>
              <Input id="all-staff-meeting-duration" type="number" min={15} max={480} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="all-staff-meeting-location" className="text-xs">Room or meeting link</Label>
            <Input id="all-staff-meeting-location" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={300} placeholder="Main hall, or https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="all-staff-meeting-agenda" className="text-xs">Agenda</Label>
            <Textarea id="all-staff-meeting-agenda" value={agenda} onChange={(event) => setAgenda(event.target.value)} rows={3} maxLength={2000} className="resize-none text-sm" placeholder="What should every department prepare?" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={busy || !title.trim() || !startsAt}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CalendarDays className="size-4" />}
              Schedule all-staff meeting
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {!canSchedule && (
        <p className="mt-4 rounded-lg border border-[#f0dfb8] bg-[#fdf8ec] p-3 text-xs leading-5 text-[#6b4e0b]">
          Only Executive Leadership can schedule company-wide meetings.
        </p>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}

      <div className="mt-4 space-y-2.5">
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming all-staff meetings.</p>
        ) : upcoming.map((meeting) => (
          <MeetingCard
            key={meeting._id}
            meeting={meeting}
            viewer={viewer}
            onCancel={(item) => void cancel(item)}
            cancelling={cancelling === meeting._id}
            allowCancel
            executiveCanCancel
            onJoinVoice={() => setVoiceRoom({ title: meeting.title, url: voiceRoomUrl(`all-staff-${meeting._id}`) })}
          />
        ))}
      </div>

      {past.length > 0 && (
        <details className="mt-4 border-t border-slate-100 pt-3">
          <summary className="cursor-pointer text-xs font-medium text-slate-500">Recent all-staff meetings ({past.length})</summary>
          <div className="mt-2 space-y-2 opacity-75">
            {past.map((meeting) => (
              <MeetingCard
                key={meeting._id}
                meeting={meeting}
                viewer={viewer}
                onCancel={() => undefined}
                cancelling={false}
                allowCancel={false}
              />
            ))}
          </div>
        </details>
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-4 w-full"
        onClick={() => setVoiceRoom({ title: "General staff voice channel", url: voiceRoomUrl("general-staff") })}
      >
        <Mic className="size-3.5" /> Join general voice channel
      </Button>

      {voiceRoom && <VoiceRoomOverlay title={voiceRoom.title} roomUrl={voiceRoom.url} onClose={() => setVoiceRoom(null)} />}
    </div>
  );
}

function CompanyWideSection({ data }: { data: HubData }) {
  return (
    <section id="company-wide" className="scroll-mt-24 border-t border-slate-300 pt-6">
      <header className="grid gap-5 pb-5 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-xs tabular-nums text-slate-400">00</span>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Company-wide</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">General comms and all-staff meetings. Visible to every department.</p>
        </div>
        <div className="lg:text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Access</p>
          <p className="mt-1 text-sm font-medium text-slate-900">All staff</p>
        </div>
      </header>
      <div className="grid gap-6 border-t border-slate-200 pt-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] xl:gap-0 xl:divide-x xl:divide-slate-100">
        <div className="xl:pr-6"><GeneralFeed viewer={data.viewer} posts={data.generalPosts} /></div>
        <div className="xl:pl-6"><AllStaffMeetings viewer={data.viewer} meetings={data.allStaffMeetings} /></div>
      </div>
    </section>
  );
}

function DepartmentSection({ department, viewer, index }: { department: Department; viewer: HubData["viewer"]; index: number }) {
  const isViewerTeam = viewer.departmentKey === department.key;
  return (
    <section id={departmentAnchor(department.key)} className="scroll-mt-24 border-t border-slate-300 pt-6">
      <header className="grid gap-5 pb-5 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-xs tabular-nums text-slate-400">{String(index).padStart(2, "0")}</span>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{department.name}</h2>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{department.members.length} {department.members.length === 1 ? "person" : "people"}</span>
            <span aria-hidden="true">·</span>
            <span>{department.posts.length} updates</span>
            <span aria-hidden="true">·</span>
            <span>{department.meetings.length} meetings</span>
            {isViewerTeam && <span className="font-medium text-[#14583c]">Your department</span>}
          </div>
        </div>
        <div className="lg:text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Head of Department</p>
          <p className="mt-1 truncate text-sm font-medium text-slate-900">{department.head?.name ?? "Vacant"}</p>
          {department.head ? (
            department.head.isInterim ? (
              <p className="mt-0.5 text-xs text-slate-500">Acting head · highest-ranked member</p>
            ) : department.head.isViewer ? (
              <p className="mt-0.5 text-xs text-slate-500">You</p>
            ) : null
          ) : (
            <p className="mt-0.5 text-xs text-slate-500">No staff assigned</p>
          )}
        </div>
      </header>
      <div className="grid gap-6 border-t border-slate-200 pt-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.25fr)_minmax(0,1fr)] xl:gap-0 xl:divide-x xl:divide-slate-100">
        <div className="xl:pr-5"><Roster members={department.members} /></div>
        <div className="xl:px-5"><DepartmentFeed department={department} viewer={viewer} /></div>
        <div className="xl:pl-5"><DepartmentMeetings department={department} viewer={viewer} /></div>
      </div>
    </section>
  );
}

export function DepartmentHub() {
  const data = useQuery(api.departments.hub) as HubData | null | undefined;

  if (data === undefined) {
    return <div className="flex justify-center py-20"><Loader2 className="size-5 animate-spin text-[#14583c]" /></div>;
  }
  if (data === null) {
    return (
      <section className="border-t border-slate-300 py-10 text-center">
        <Building2 className="mx-auto size-7 text-slate-400" />
        <h2 className="mt-3 font-semibold">Staff access required</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-600">Sign in with an approved staff account to view department rosters, updates, and meetings.</p>
      </section>
    );
  }

  const departments = [...data.departments].sort((a, b) => {
    const aMine = data.viewer.departmentKey === a.key ? 0 : 1;
    const bMine = data.viewer.departmentKey === b.key ? 0 : 1;
    return aMine - bMine || a.name.localeCompare(b.name);
  });
  const totalMembers = departments.reduce((total, department) => total + department.members.length, 0);
  const upcomingMeetings =
    departments.reduce((total, department) => total + department.meetings.filter((meeting) => meeting.startsAt >= Date.now()).length, 0) +
    data.allStaffMeetings.filter((meeting) => meeting.startsAt >= Date.now()).length;

  return (
    <div className="space-y-6">
      <section className="ow-page-hero px-5 py-7 text-white sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#a9c8b6]">OpenWorlds · Staff</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Departments</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#cfe0d5]">
              {data.viewer.canViewAllDepartments
                ? "Every department’s head, roster, news, and upcoming meetings, plus general comms and all-staff sessions."
                : "Your department’s head, roster, news, and meetings, plus general comms and all-staff sessions."}
            </p>
          </div>
          <dl className="flex items-end gap-6 sm:gap-8">
            <div><dt className="text-[10px] uppercase tracking-[0.12em] text-[#a9c8b6]">Teams</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{data.departments.length}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-[0.12em] text-[#a9c8b6]">People</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{totalMembers}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-[0.12em] text-[#a9c8b6]">Meetings</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{upcomingMeetings}</dd></div>
          </dl>
        </div>
      </section>

      <CompanyWideSection data={data} />

      <nav className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-y border-slate-200 py-3" aria-label="Jump to a section">
        <span className="text-xs font-medium text-slate-400">Index</span>
        <a href="#company-wide" className="text-sm text-slate-600 underline-offset-4 hover:text-[#14583c] hover:underline">Company-wide</a>
        {departments.map((department) => (
          <a
            key={department.key}
            href={`#${departmentAnchor(department.key)}`}
            className={`text-sm underline-offset-4 hover:underline ${data.viewer.departmentKey === department.key ? "font-semibold text-[#14583c]" : "text-slate-600 hover:text-[#14583c]"}`}
          >
            {department.name}
            <span className="ml-1 text-[11px] tabular-nums text-slate-400">{department.members.length}</span>
          </a>
        ))}
      </nav>

      {departments.length === 0 ? (
        <section className="border-t border-slate-300 py-10 text-center">
          <Building2 className="mx-auto size-7 text-slate-400" />
          <h2 className="mt-3 font-semibold">No department assigned yet</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-600">
            {data.viewer.canViewAllDepartments
              ? "An administrator can assign people to departments and positions from the admin console. General comms and all-staff meetings are still available above."
              : "An administrator can assign you to a department from the admin console. General comms and all-staff meetings are still available above."}
          </p>
        </section>
      ) : (
        departments.map((department, index) => <DepartmentSection key={department.key} department={department} viewer={data.viewer} index={index + 1} />)
      )}
    </div>
  );
}
