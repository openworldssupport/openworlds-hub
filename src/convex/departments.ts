import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { canonicalDepartmentName, deriveBadge, displayNameFor } from "../lib/staff";
import { SUPPORT_EMAIL } from "./admin";

const MAX_POST_LENGTH = 2_000;
const MAX_MEETING_TITLE = 120;
const MAX_MEETING_AGENDA = 2_000;
const MAX_MEETING_LOCATION = 300;
const MAX_MEETING_DAYS_AHEAD = 365;
const MAX_STAFF_SCAN = 1_000;

function departmentKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function cleanDepartment(value: string) {
  const department = canonicalDepartmentName(value);
  if (department.length < 2 || department.length > 80) {
    throw new Error("Department names must be 2–80 characters.");
  }
  return department;
}

function isCompanyAdmin(user: { role?: string; email?: string; emailVerificationTime?: number; isSiteBanned?: boolean }) {
  return Boolean(
    user.emailVerificationTime !== undefined &&
    !user.isSiteBanned &&
    (user.role === "admin" || user.email?.trim().toLowerCase() === SUPPORT_EMAIL),
  );
}

function isStaffAccount(user: Doc<"users">) {
  return Boolean(
    user.emailVerificationTime !== undefined &&
    !user.isSiteBanned &&
    (isCompanyAdmin(user) || user.staffAccess || user.department?.trim() || user.position?.trim()),
  );
}

async function currentStaff(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  return user && isStaffAccount(user) ? user : null;
}

async function requireStaff(ctx: QueryCtx | MutationCtx) {
  const user = await currentStaff(ctx);
  if (!user) throw new Error("Staff access is required.");
  return user;
}

/** Only a member of the exact department, or a company admin, may contribute. */
async function requireDepartmentContributor(ctx: MutationCtx, rawDepartment: string) {
  const user = await requireStaff(ctx);
  const department = cleanDepartment(rawDepartment);
  if (!isCompanyAdmin(user) && departmentKey(user.department) !== departmentKey(department)) {
    throw new Error("You can only post or schedule meetings for your own department.");
  }
  return { user, department, key: departmentKey(department) };
}

function cleanPostBody(rawBody: string) {
  const body = rawBody.trim();
  if (body.length < 2 || body.length > MAX_POST_LENGTH) {
    throw new Error(`Updates must be 2–${MAX_POST_LENGTH.toLocaleString()} characters.`);
  }
  return body;
}

function cleanMeetingText(raw: string | undefined, label: string, maxLength: number, required: boolean) {
  const value = (raw ?? "").trim();
  if (required && value.length < 3) throw new Error(`${label} must be at least 3 characters.`);
  if (value.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  return value || undefined;
}

function validMeetingStart(raw: number) {
  const now = Date.now();
  if (!Number.isInteger(raw) || raw < now - 5 * 60 * 1000) {
    throw new Error("Choose a current or future meeting time.");
  }
  if (raw > now + MAX_MEETING_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
    throw new Error("Meetings can be scheduled up to one year ahead.");
  }
  return raw;
}

function validMeetingDuration(raw: number) {
  if (!Number.isInteger(raw) || raw < 15 || raw > 480) {
    throw new Error("Meetings must last between 15 minutes and 8 hours.");
  }
  return raw;
}

/**
 * Read the whole company hub in one subscription. All verified staff can see
 * every department, but only department members or admins can contribute.
 */
export const hub = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await currentStaff(ctx);
    if (!viewer) return null;

    const viewerIsAdmin = isCompanyAdmin(viewer);
    const viewerDepartment = canonicalDepartmentName(viewer.department) || null;
    const viewerKey = departmentKey(viewerDepartment);
    // Query staff indexes instead of scanning every player account. The two
    // sources cover both current assignments and older staff rows that only
    // have a department but not the staffAccess flag.
    const [assignedRows, flaggedRows] = await Promise.all([
      ctx.db.query("users").withIndex("by_department", (q) => q.gt("department", "")).take(MAX_STAFF_SCAN),
      ctx.db.query("users").withIndex("by_staff_access", (q) => q.eq("staffAccess", true)).take(MAX_STAFF_SCAN),
    ]);
    const rows = [...new Map([...assignedRows, ...flaggedRows].map((user) => [user._id, user])).values()];
    const groups = new Map<string, {
      key: string;
      name: string;
      members: Array<{
        userId: Doc<"users">["_id"];
        name: string;
        position: string | null;
        badge: "staff" | "dev";
        isAdmin: boolean;
        isViewer: boolean;
      }>;
    }>();

    for (const user of rows) {
      if (!isStaffAccount(user)) continue;
      const department = canonicalDepartmentName(user.department);
      if (!department) continue;
      const key = departmentKey(department);
      if (!key) continue;
      const group = groups.get(key) ?? { key, name: department, members: [] };
      group.members.push({
        userId: user._id,
        name: displayNameFor(user),
        position: user.position?.trim() || null,
        badge: user.publicBadge ?? deriveBadge(department, user.position),
        isAdmin: isCompanyAdmin(user),
        isViewer: user._id === viewer._id,
      });
      groups.set(key, group);
    }

    // Keep the signed-in member visible even if the roster scan was capped.
    if (viewerDepartment && !groups.has(viewerKey)) {
      groups.set(viewerKey, {
        key: viewerKey,
        name: viewerDepartment,
        members: [{
          userId: viewer._id,
          name: displayNameFor(viewer),
          position: viewer.position?.trim() || null,
          badge: viewer.publicBadge ?? deriveBadge(viewerDepartment, viewer.position),
          isAdmin: viewerIsAdmin,
          isViewer: true,
        }],
      });
    }

    const departments = [...groups.values()]
      .map((group) => ({
        ...group,
        members: group.members.sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin) || a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const now = Date.now();
    const hydrated = await Promise.all(departments.map(async (department) => {
      const posts = await ctx.db
        .query("departmentPosts")
        .withIndex("by_department_created", (q) => q.eq("departmentKey", department.key))
        .order("desc")
        .take(8);
      const meetingRows = await ctx.db
        .query("departmentMeetings")
        .withIndex("by_department_starts", (q) => q.eq("departmentKey", department.key))
        .order("desc")
        .take(40);
      const upcoming = meetingRows
        .filter((meeting) => !meeting.cancelledAt && meeting.startsAt >= now)
        .sort((a, b) => a.startsAt - b.startsAt)
        .slice(0, 5);
      const past = meetingRows
        .filter((meeting) => !meeting.cancelledAt && meeting.startsAt < now)
        .sort((a, b) => b.startsAt - a.startsAt)
        .slice(0, 3);
      return {
        ...department,
        posts: posts.map((post) => ({
          _id: post._id,
          authorId: post.authorId,
          authorName: post.authorName,
          authorPosition: post.authorPosition ?? null,
          authorBadge: post.authorBadge ?? null,
          body: post.body,
          createdAt: post.createdAt,
        })),
        meetings: [...upcoming, ...past].map((meeting) => ({
          _id: meeting._id,
          title: meeting.title,
          agenda: meeting.agenda ?? null,
          startsAt: meeting.startsAt,
          durationMinutes: meeting.durationMinutes,
          location: meeting.location ?? null,
          createdBy: meeting.createdBy,
          createdByName: meeting.createdByName,
          createdAt: meeting.createdAt,
        })),
      };
    }));

    return {
      viewer: {
        id: viewer._id,
        isAdmin: viewerIsAdmin,
        department: viewerDepartment,
        departmentKey: viewerKey || null,
      },
      departments: hydrated,
    };
  },
});

/** Post an update to the viewer's own department. Admins may post anywhere. */
export const createPost = mutation({
  args: { department: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    const { user, department, key } = await requireDepartmentContributor(ctx, args.department);
    const body = cleanPostBody(args.body);
    const postId = await ctx.db.insert("departmentPosts", {
      department,
      departmentKey: key,
      authorId: user._id,
      authorName: displayNameFor(user),
      authorPosition: user.position?.trim() || undefined,
      authorBadge: user.publicBadge ?? deriveBadge(department, user.position),
      body,
      createdAt: Date.now(),
    });
    return { ok: true as const, postId };
  },
});

/** Authors can remove their own update; admins can remove any update. */
export const deletePost = mutation({
  args: { postId: v.id("departmentPosts") },
  handler: async (ctx, { postId }) => {
    const user = await requireStaff(ctx);
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("That update no longer exists.");
    if (post.authorId !== user._id && !isCompanyAdmin(user)) {
      throw new Error("You can only remove your own department updates.");
    }
    await ctx.db.delete(postId);
    return { ok: true as const };
  },
});

/** Schedule a meeting for the viewer's own department. Admins may schedule anywhere. */
export const createMeeting = mutation({
  args: {
    department: v.string(),
    title: v.string(),
    agenda: v.optional(v.string()),
    startsAt: v.number(),
    durationMinutes: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, department, key } = await requireDepartmentContributor(ctx, args.department);
    const title = cleanMeetingText(args.title, "Meeting title", MAX_MEETING_TITLE, true)!;
    const agenda = cleanMeetingText(args.agenda, "Agenda", MAX_MEETING_AGENDA, false);
    const location = cleanMeetingText(args.location, "Location or meeting link", MAX_MEETING_LOCATION, false);
    const meetingId = await ctx.db.insert("departmentMeetings", {
      department,
      departmentKey: key,
      title,
      ...(agenda ? { agenda } : {}),
      startsAt: validMeetingStart(args.startsAt),
      durationMinutes: validMeetingDuration(args.durationMinutes),
      ...(location ? { location } : {}),
      createdBy: user._id,
      createdByName: displayNameFor(user),
      createdAt: Date.now(),
    });
    return { ok: true as const, meetingId };
  },
});

/** Cancel a meeting. The organiser or an administrator can cancel it. */
export const cancelMeeting = mutation({
  args: { meetingId: v.id("departmentMeetings"), reason: v.optional(v.string()) },
  handler: async (ctx, { meetingId, reason: rawReason }) => {
    const user = await requireStaff(ctx);
    const meeting = await ctx.db.get(meetingId);
    if (!meeting) throw new Error("That meeting no longer exists.");
    if (meeting.cancelledAt) return { ok: true as const };
    if (meeting.createdBy !== user._id && !isCompanyAdmin(user)) {
      throw new Error("Only the organiser or an administrator can cancel this meeting.");
    }
    const reason = (rawReason ?? "").trim();
    if (reason.length > 300) throw new Error("Cancellation reasons must be 300 characters or fewer.");
    await ctx.db.patch(meetingId, {
      cancelledAt: Date.now(),
      cancelledBy: user._id,
      ...(reason ? { cancelReason: reason } : {}),
    });
    return { ok: true as const };
  },
});
