import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { DEPARTMENTS, canonicalDepartmentName, deriveBadge, displayNameFor, isDepartmentHeadPosition } from "../lib/staff";
import { SUPPORT_EMAIL } from "./admin";

const MAX_POST_LENGTH = 2_000;
const MAX_MEETING_TITLE = 120;
const MAX_MEETING_AGENDA = 2_000;
const MAX_MEETING_LOCATION = 300;
const MAX_MEETING_DAYS_AHEAD = 365;
const MAX_STAFF_SCAN = 1_000;
const EXECUTIVE_LEADERSHIP = "Executive Leadership";
const EXECUTIVE_LEADERSHIP_KEY = departmentKey(EXECUTIVE_LEADERSHIP);
const ALL_STAFF_DEPARTMENT = "All staff";
const ALL_STAFF_KEY = "all-staff";

/** Higher numbers are more senior within a department. */
const POSITION_RANKS: Array<[RegExp, number]> = [
  [/\b(chief|ceo|cto|coo|cfo|cmo)\b/i, 100],
  [/\b(president|vice president|head|director)\b/i, 95],
  [/\b(lead|manager|principal)\b/i, 85],
  [/\b(senior|staff|architect)\b/i, 70],
  [/\b(coordinator|supervisor)\b/i, 60],
  [/\b(engineer|designer|artist|developer|analyst|strategist|specialist|moderator|reviewer|tester|associate)\b/i, 40],
];

function positionRank(position: string | null | undefined) {
  const value = position?.trim() ?? "";
  for (const [pattern, rank] of POSITION_RANKS) {
    if (pattern.test(value)) return rank;
  }
  return 30;
}

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

function isExecutiveLeadership(user: Doc<"users">) {
  return departmentKey(canonicalDepartmentName(user.department)) === EXECUTIVE_LEADERSHIP_KEY;
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

async function loadStaffRows(ctx: QueryCtx | MutationCtx) {
  // Query staff indexes instead of scanning every player account. The two
  // sources cover both current assignments and older staff rows that only
  // have a department but not the staffAccess flag.
  const [assignedRows, flaggedRows] = await Promise.all([
    ctx.db.query("users").withIndex("by_department", (q) => q.gt("department", "")).take(MAX_STAFF_SCAN),
    ctx.db.query("users").withIndex("by_staff_access", (q) => q.eq("staffAccess", true)).take(MAX_STAFF_SCAN),
  ]);
  return [...new Map([...assignedRows, ...flaggedRows].map((user) => [user._id, user])).values()];
}

function membersForDepartment(rows: Doc<"users">[], key: string) {
  return rows.filter((user) => isStaffAccount(user) && departmentKey(canonicalDepartmentName(user.department)) === key);
}

function canScheduleMeetingsFor(
  user: Doc<"users">,
  key: string,
  members: Doc<"users">[],
) {
  if (isCompanyAdmin(user)) return true;
  if (isExecutiveLeadership(user)) return true;
  return canScheduleFromRank(user, key, members);
}

function canScheduleFromRank(user: Doc<"users">, key: string, members: Doc<"users">[]) {
  const userDepartmentKey = departmentKey(canonicalDepartmentName(user.department));
  if (userDepartmentKey !== key) return false;
  const highestRank = Math.max(...members.map((member) => positionRank(member.position)));
  return positionRank(user.position) >= highestRank;
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
  if (!isCompanyAdmin(user) && departmentKey(canonicalDepartmentName(user.department)) !== departmentKey(department)) {
    throw new Error("You can only post updates for your own department.");
  }
  return { user, department, key: departmentKey(department) };
}

/**
 * Meetings are scheduled by the most senior position in the target department.
 * Administrators and every Executive Leadership member can schedule anywhere.
 */
async function requireMeetingScheduler(ctx: MutationCtx, rawDepartment: string) {
  const user = await requireStaff(ctx);
  const department = cleanDepartment(rawDepartment);
  const key = departmentKey(department);
  if (key === ALL_STAFF_KEY || key === departmentKey(ALL_STAFF_DEPARTMENT)) {
    throw new Error("Use the all-staff meeting form for company-wide meetings.");
  }
  const rows = await loadStaffRows(ctx);
  const members = membersForDepartment(rows, key);
  if (!canScheduleMeetingsFor(user, key, members)) {
    if (departmentKey(canonicalDepartmentName(user.department)) !== key) {
      throw new Error("You can only schedule meetings for your own department.");
    }
    throw new Error("Only the highest position in this department or Executive Leadership can schedule meetings.");
  }
  return { user, department, key };
}

/** Company-wide meetings are reserved for Executive Leadership only. */
async function requireAllStaffScheduler(ctx: MutationCtx) {
  const user = await requireStaff(ctx);
  if (!isExecutiveLeadership(user)) {
    throw new Error("Only Executive Leadership can schedule all-staff meetings.");
  }
  return user;
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

function meetingView(meeting: Doc<"departmentMeetings">) {
  return {
    _id: meeting._id,
    title: meeting.title,
    agenda: meeting.agenda ?? null,
    startsAt: meeting.startsAt,
    durationMinutes: meeting.durationMinutes,
    location: meeting.location ?? null,
    createdBy: meeting.createdBy,
    createdByName: meeting.createdByName,
    createdAt: meeting.createdAt,
  };
}

/**
 * Read the staff hub in one subscription. Regular staff only receive their own
 * department; Executive Leadership and company admins receive every department.
 * General comms and all-staff meetings are shared with everyone.
 */
export const hub = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await currentStaff(ctx);
    if (!viewer) return null;

    const viewerIsAdmin = isCompanyAdmin(viewer);
    const viewerIsExecutive = isExecutiveLeadership(viewer);
    const viewerCanViewAllDepartments = viewerIsAdmin || viewerIsExecutive;
    const viewerDepartment = canonicalDepartmentName(viewer.department) || null;
    const viewerKey = departmentKey(viewerDepartment);
    const rows = await loadStaffRows(ctx);
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
        isLead: boolean;
        isHead: boolean;
        isInterimHead: boolean;
      }>;
    }>();

    // Start with every department in the company so each one always has a hub,
    // even when no one is currently assigned to it yet.
    for (const departmentName of DEPARTMENTS) {
      const name = canonicalDepartmentName(departmentName);
      const key = departmentKey(name);
      if (!key || groups.has(key)) continue;
      groups.set(key, { key, name, members: [] });
    }

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
        isLead: false,
        isHead: false,
        isInterimHead: false,
      });
      groups.set(key, group);
    }

    // Keep the signed-in member visible even if the department was seeded
    // without members or the roster scan was capped.
    if (viewerDepartment) {
      const viewerMember = {
        userId: viewer._id,
        name: displayNameFor(viewer),
        position: viewer.position?.trim() || null,
        badge: viewer.publicBadge ?? deriveBadge(viewerDepartment, viewer.position),
        isAdmin: viewerIsAdmin,
        isViewer: true,
        isLead: false,
        isHead: false,
        isInterimHead: false,
      };
      const viewerGroup = groups.get(viewerKey);
      if (!viewerGroup) {
        groups.set(viewerKey, { key: viewerKey, name: viewerDepartment, members: [viewerMember] });
      } else if (!viewerGroup.members.some((member) => member.userId === viewer._id)) {
        viewerGroup.members.push(viewerMember);
      }
    }

    const departments = [...groups.values()]
      .map((group) => {
        const assignedHead = group.members
          .filter((member) => isDepartmentHeadPosition(member.position))
          .sort((a, b) => a.name.localeCompare(b.name))[0];
        // A department without a formally assigned head still needs someone
        // accountable. Use the highest-ranked member as an acting head.
        const actingHead = assignedHead
          ? undefined
          : [...group.members].sort((a, b) =>
              positionRank(b.position) - positionRank(a.position) || a.name.localeCompare(b.name),
            )[0];
        const head = assignedHead ?? actingHead;
        const headIsInterim = !assignedHead && Boolean(head);
        const highestRank = group.members.length
          ? Math.max(...group.members.map((member) => positionRank(member.position)))
          : 0;
        const leadNames = group.members.filter((member) => positionRank(member.position) >= highestRank).map((member) => member.userId);
        return {
          ...group,
          members: group.members
            .map((member) => ({
              ...member,
              isLead: leadNames.includes(member.userId),
              isHead: member.userId === head?.userId,
              isInterimHead: headIsInterim && member.userId === head?.userId,
            }))
            .sort((a, b) =>
              Number(b.isHead) - Number(a.isHead) ||
              Number(b.isAdmin) - Number(a.isAdmin) ||
              Number(b.isLead) - Number(a.isLead) ||
              a.name.localeCompare(b.name),
            ),
          head: head
            ? {
                userId: head.userId,
                name: head.name,
                position: head.position,
                badge: head.badge,
                isViewer: head.isViewer,
                isInterim: headIsInterim,
              }
            : null,
          viewerCanSchedule: canScheduleMeetingsFor(viewer, group.key, membersForDepartment(rows, group.key)),
        };
      })
      .filter((department) =>
        department.key !== ALL_STAFF_KEY &&
        (viewerCanViewAllDepartments || department.key === viewerKey),
      )
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
        meetings: [...upcoming, ...past].map(meetingView),
      };
    }));

    const [generalPostRows, allStaffMeetingRows] = await Promise.all([
      ctx.db.query("staffGeneralPosts").withIndex("by_created").order("desc").take(20),
      ctx.db
        .query("departmentMeetings")
        .withIndex("by_department_starts", (q) => q.eq("departmentKey", ALL_STAFF_KEY))
        .order("desc")
        .take(40),
    ]);
    const allStaffUpcoming = allStaffMeetingRows
      .filter((meeting) => !meeting.cancelledAt && meeting.startsAt >= now)
      .sort((a, b) => a.startsAt - b.startsAt)
      .slice(0, 8);
    const allStaffPast = allStaffMeetingRows
      .filter((meeting) => !meeting.cancelledAt && meeting.startsAt < now)
      .sort((a, b) => b.startsAt - a.startsAt)
      .slice(0, 4);

    return {
      viewer: {
        id: viewer._id,
        isAdmin: viewerIsAdmin,
        isExecutiveLeadership: viewerIsExecutive,
        canViewAllDepartments: viewerCanViewAllDepartments,
        department: viewerDepartment,
        departmentKey: viewerKey || null,
      },
      departments: hydrated,
      generalPosts: generalPostRows.map((post) => ({
        _id: post._id,
        authorId: post.authorId,
        authorName: post.authorName,
        authorDepartment: post.authorDepartment ?? null,
        authorPosition: post.authorPosition ?? null,
        authorBadge: post.authorBadge ?? null,
        body: post.body,
        createdAt: post.createdAt,
      })),
      allStaffMeetings: [...allStaffUpcoming, ...allStaffPast].map(meetingView),
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

/** Every verified staff member can post in the shared general comms feed. */
export const createGeneralPost = mutation({
  args: { body: v.string() },
  handler: async (ctx, args) => {
    const user = await requireStaff(ctx);
    const body = cleanPostBody(args.body);
    const postId = await ctx.db.insert("staffGeneralPosts", {
      authorId: user._id,
      authorName: displayNameFor(user),
      authorDepartment: canonicalDepartmentName(user.department) || undefined,
      authorPosition: user.position?.trim() || undefined,
      authorBadge: user.publicBadge ?? deriveBadge(user.department, user.position),
      body,
      createdAt: Date.now(),
    });
    return { ok: true as const, postId };
  },
});

/** Authors, admins, and Executive Leadership can remove general comms posts. */
export const deleteGeneralPost = mutation({
  args: { postId: v.id("staffGeneralPosts") },
  handler: async (ctx, { postId }) => {
    const user = await requireStaff(ctx);
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("That message no longer exists.");
    if (post.authorId !== user._id && !isCompanyAdmin(user) && !isExecutiveLeadership(user)) {
      throw new Error("You can only remove your own general comms messages.");
    }
    await ctx.db.delete(postId);
    return { ok: true as const };
  },
});

/** Schedule a meeting where the viewer is the department lead or Executive Leadership. */
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
    const { user, department, key } = await requireMeetingScheduler(ctx, args.department);
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

/** Schedule a company-wide meeting. Executive Leadership only. */
export const createAllStaffMeeting = mutation({
  args: {
    title: v.string(),
    agenda: v.optional(v.string()),
    startsAt: v.number(),
    durationMinutes: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAllStaffScheduler(ctx);
    const title = cleanMeetingText(args.title, "Meeting title", MAX_MEETING_TITLE, true)!;
    const agenda = cleanMeetingText(args.agenda, "Agenda", MAX_MEETING_AGENDA, false);
    const location = cleanMeetingText(args.location, "Location or meeting link", MAX_MEETING_LOCATION, false);
    const meetingId = await ctx.db.insert("departmentMeetings", {
      department: ALL_STAFF_DEPARTMENT,
      departmentKey: ALL_STAFF_KEY,
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

/** Cancel a meeting. The organiser, an administrator, or an all-staff organiser's leadership can cancel it. */
export const cancelMeeting = mutation({
  args: { meetingId: v.id("departmentMeetings"), reason: v.optional(v.string()) },
  handler: async (ctx, { meetingId, reason: rawReason }) => {
    const user = await requireStaff(ctx);
    const meeting = await ctx.db.get(meetingId);
    if (!meeting) throw new Error("That meeting no longer exists.");
    if (meeting.cancelledAt) return { ok: true as const };
    const canCancelAllStaff = meeting.departmentKey === ALL_STAFF_KEY && isExecutiveLeadership(user);
    if (meeting.createdBy !== user._id && !isCompanyAdmin(user) && !canCancelAllStaff) {
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
