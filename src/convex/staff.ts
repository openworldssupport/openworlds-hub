import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { isAdmin, requireAdmin } from "./admin";
import { deriveBadge, type PublicBadge } from "../lib/staff";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

/** Longest staff message the board accepts. */
export const MAX_MESSAGE_LENGTH = 2000;

/** The signed-in user's document, or null when signed out. */
async function currentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db.get(userId);
}

/**
 * Staff = a site admin, or a user the admin panel has given a
 * department/position. Mirrors `isStaffUser` in `src/lib/staff.ts`.
 */
export async function isStaff(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  if (await isAdmin(ctx)) return true;
  const user = await currentUser(ctx);
  if (!user) return false;
  return Boolean(user.department?.trim() || user.position?.trim());
}

/** The portal header data: who you are, your department/position, your badge. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (!user) {
      return {
        signedIn: false,
        isStaff: false,
        isAdmin: false,
        name: null as string | null,
        email: null as string | null,
        department: null as string | null,
        position: null as string | null,
        badge: null as PublicBadge | null,
      };
    }

    const admin = await isAdmin(ctx);
    const staff = admin || Boolean(user.department?.trim() || user.position?.trim());
    const department = user.department?.trim() || null;
    const position = user.position?.trim() || null;

    return {
      signedIn: true,
      isStaff: staff,
      isAdmin: admin,
      name: user.name?.trim() || null,
      email: user.email ?? null,
      department: staff ? department : null,
      position: staff ? position : null,
      badge: staff ? (user.publicBadge ?? deriveBadge(department, position)) : null,
    };
  },
});

/** The internal message board. Only staff can read it. */
export const board = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isStaff(ctx))) return null;
    return await ctx.db
      .query("staffMessages")
      .withIndex("by_created_at")
      .order("desc")
      .take(100);
  },
});

/** Post a message to the staff board. */
export const post = mutation({
  args: { body: v.string() },
  handler: async (ctx, args) => {
    if (!(await isStaff(ctx))) throw new Error("Not authorized.");
    const body = args.body.trim();
    if (body.length < 1) throw new Error("Write a message first.");
    if (body.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Keep messages under ${MAX_MESSAGE_LENGTH} characters.`);
    }

    const user = (await currentUser(ctx))!;
    const department = user.department?.trim() || undefined;
    const position = user.position?.trim() || undefined;
    await ctx.db.insert("staffMessages", {
      authorId: user._id,
      authorName: user.name?.trim() || user.email || "Team member",
      department,
      position,
      badge: user.publicBadge ?? deriveBadge(department ?? null, position ?? null),
      body,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Delete a board message: authors can delete their own, admins can delete any. */
export const removeMessage = mutation({
  args: { messageId: v.id("staffMessages") },
  handler: async (ctx, args) => {
    if (!(await isStaff(ctx))) throw new Error("Not authorized.");
    const message = await ctx.db.get(args.messageId);
    if (!message) return { ok: true };

    const userId = await getAuthUserId(ctx);
    if (message.authorId !== userId && !(await isAdmin(ctx))) {
      throw new Error("You can only delete your own messages.");
    }
    await ctx.db.delete(args.messageId);
    return { ok: true };
  },
});

/**
 * Admin only: every account with its current department/position assignment,
 * so the admin panel can hand out positions.
 */
export const listMembers = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null;
    const users = await ctx.db.query("users").take(500);
    return users.map((user) => {
      const department = user.department?.trim() || null;
      const position = user.position?.trim() || null;
      const assigned = Boolean(department || position);
      return {
        userId: user._id,
        name: user.name?.trim() || null,
        email: user.email ?? null,
        role: user.role ?? null,
        department,
        position,
        isStaff: assigned || user.role === "admin",
        badge: assigned ? (user.publicBadge ?? deriveBadge(department, position)) : null,
      };
    });
  },
});

/**
 * Admin only: assign (or clear) a person's department, position and public
 * badge. Clearing both department and position removes staff access.
 */
export const setAssignment = mutation({
  args: {
    userId: v.id("users"),
    department: v.string(),
    position: v.string(),
    badge: v.union(v.literal("staff"), v.literal("dev")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const department = args.department.trim();
    const position = args.position.trim();
    if (department.length > 80) throw new Error("Keep the department under 80 characters.");
    if (position.length > 100) throw new Error("Keep the position under 100 characters.");

    if (!department && !position) {
      await ctx.db.patch(args.userId, {
        department: undefined,
        position: undefined,
        publicBadge: undefined,
      });
      return { ok: true, isStaff: false };
    }

    await ctx.db.patch(args.userId, {
      department: department || undefined,
      position: position || undefined,
      publicBadge: args.badge,
    });
    return { ok: true, isStaff: true };
  },
});

/**
 * Public: name + badge only ("Staff" or "Dev") for people who have been given
 * a department/position. Department, position and email stay private.
 */
export const publicTeam = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(500);
    return users
      .filter((user) => (user.department?.trim() || user.position?.trim()))
      .map((user) => ({
        name: user.name?.trim() || "OpenWorlds team",
        badge: user.publicBadge ?? deriveBadge(user.department, user.position),
      }));
  },
});
