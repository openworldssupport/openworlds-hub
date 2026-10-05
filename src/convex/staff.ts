import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { isAdmin, requireAdmin, requireCompanyAdmin } from "./admin";
import { deriveBadge, type PublicBadge } from "../lib/staff";
import type { Id } from "./_generated/dataModel";
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
  if (!user || user.emailVerificationTime === undefined) return false;
  return Boolean(user.staffAccess || user.department?.trim() || user.position?.trim());
}

/** The portal header data: who you are, your department/position, your badge. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (!user) {
      return {
        signedIn: false,
        userId: null as string | null,
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
    const staff = admin || (user.emailVerificationTime !== undefined && Boolean(user.staffAccess || user.department?.trim() || user.position?.trim()));
    const department = user.department?.trim() || null;
    const position = user.position?.trim() || null;

    return {
      signedIn: true,
      userId: user._id,
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
    await requireCompanyAdmin(ctx);
    const users = await ctx.db.query("users").filter((q) => q.neq(q.field("isAnonymous"), true)).take(500);
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
        isStaff: assigned || user.staffAccess === true || user.role === "admin",
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
    await requireCompanyAdmin(ctx);
    const department = args.department.trim();
    const position = args.position.trim();
    if (department.length > 80) throw new Error("Keep the department under 80 characters.");
    if (position.length > 100) throw new Error("Keep the position under 100 characters.");
    if (Boolean(department) !== Boolean(position)) {
      throw new Error("Enter both a department and position, or clear both to remove access.");
    }

    if (!department && !position) {
      const target = await ctx.db.get(args.userId);
      if (target?.role === "admin" || target?.email?.trim().toLowerCase() === "support@openworlds.dk") {
        throw new Error("The bootstrap admin cannot be removed from staff access.");
      }
      await ctx.db.patch(args.userId, {
        department: undefined,
        position: undefined,
        publicBadge: undefined,
        staffAccess: undefined,
      });
      const user = await ctx.db.get(args.userId);
      const email = user?.email?.trim().toLowerCase();
      if (email) {
        const invitation = await ctx.db
          .query("companyAccess")
          .withIndex("by_email", (q) => q.eq("email", email))
          .first();
        if (invitation) await ctx.db.delete(invitation._id);
      }
      return { ok: true, isStaff: false };
    }

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("Account not found.");
    if (target.role === "admin" || target.email?.trim().toLowerCase() === "support@openworlds.dk") {
      throw new Error("Admin accounts cannot be changed from the team assignment panel.");
    }
    if (target.emailVerificationTime !== undefined) {
      await ctx.db.patch(args.userId, {
        department: department || undefined,
        position: position || undefined,
        publicBadge: args.badge,
        staffAccess: true,
      });
    }
    const email = target.email?.trim().toLowerCase();
    if (email && department && position) {
      const invitation = await ctx.db
        .query("companyAccess")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (!invitation) {
        await ctx.db.insert("companyAccess", {
          email,
          department,
          position,
          publicBadge: args.badge,
          accessLevel: "staff",
          invitedAt: Date.now(),
          invitedBy: (await getAuthUserId(ctx))!,
        });
      } else {
        await ctx.db.patch(invitation._id, {
          department,
          position,
          publicBadge: args.badge,
        });
      }
    }
    return { ok: true, isStaff: target.emailVerificationTime !== undefined };
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
      .filter((user) => user.emailVerificationTime !== undefined && (user.staffAccess || user.department?.trim() || user.position?.trim()))
      .map((user) => ({
        name: user.name?.trim() || "OpenWorlds team",
        badge: user.publicBadge ?? deriveBadge(user.department, user.position),
      }));
  },
});

const announcementCategory = v.union(
  v.literal("announcement"),
  v.literal("development"),
  v.literal("release"),
  v.literal("event"),
);
const announcementStatus = v.union(v.literal("draft"), v.literal("published"));

/** Public News page feed. Drafts are never returned. */
export const publicAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("gameAnnouncements")
      .withIndex("by_status_published_at", (q) => q.eq("status", "published"))
      .order("desc")
      .take(50);
    return await Promise.all(rows.map(async ({ _id, title, summary, body, category, media, publishedAt }) => ({
      _id,
      title,
      summary,
      body,
      category,
      publishedAt: publishedAt ?? 0,
      media: await Promise.all((media ?? []).filter((asset) => asset.storageId).map(async (asset) => ({
        mediaType: asset.mediaType ?? "image",
        altText: asset.altText,
        url: await ctx.storage.getUrl(asset.storageId!),
      }))),
    })));
  },
});

/** Staff can request a short-lived Convex upload URL; nonstaff receive no upload capability. */
export const generateAnnouncementUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    if (!(await isStaff(ctx))) throw new Error("Not authorized.");
    return await ctx.storage.generateUploadUrl();
  },
});

/** Register only verified, appropriately typed, size-limited staff announcement uploads. */
export const finalizeAnnouncementUpload = mutation({
  args: {
    storageId: v.id("_storage"),
    mediaType: v.union(v.literal("image"), v.literal("video")),
  },
  handler: async (ctx, args) => {
    if (!(await isStaff(ctx))) throw new Error("Not authorized.");
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authorized.");
    const metadata = await ctx.db.system.get("_storage", args.storageId);
    if (!metadata) throw new Error("Upload not found.");
    const contentType = metadata.contentType ?? "";
    const hasExpectedType = args.mediaType === "image" ? contentType.startsWith("image/") : contentType.startsWith("video/");
    if (!hasExpectedType) {
      await ctx.storage.delete(args.storageId);
      throw new Error("Choose a valid image or video file.");
    }
    if (metadata.size > 50 * 1024 * 1024) {
      await ctx.storage.delete(args.storageId);
      throw new Error("Media files must be 50 MB or smaller.");
    }
    const existing = await ctx.db.query("announcementAssets")
      .withIndex("by_storage_id", (q) => q.eq("storageId", args.storageId))
      .unique();
    if (existing) {
      if (existing.authorId !== userId || existing.announcementId || existing.mediaType !== args.mediaType) throw new Error("This upload is not available to attach.");
      return { storageId: args.storageId, mediaType: existing.mediaType!, url: await ctx.storage.getUrl(args.storageId) };
    }
    await ctx.db.insert("announcementAssets", {
      storageId: args.storageId,
      mediaType: args.mediaType,
      authorId: userId,
      createdAt: Date.now(),
    });
    return { storageId: args.storageId, mediaType: args.mediaType, url: await ctx.storage.getUrl(args.storageId) };
  },
});

/** Staff workspace feed, including drafts. */
export const announcements = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isStaff(ctx))) return null;
    const rows = await ctx.db
      .query("gameAnnouncements")
      .withIndex("by_created_at")
      .order("desc")
      .take(100);
    return await Promise.all(rows.map(async (row) => ({
      ...row,
      media: await Promise.all((row.media ?? []).filter((asset) => asset.storageId).map(async (asset) => ({
        storageId: asset.storageId!,
        mediaType: asset.mediaType ?? "image",
        altText: asset.altText,
        url: await ctx.storage.getUrl(asset.storageId!),
      }))),
    })));
  },
});

/** Staff can create or edit their own announcements and publish them publicly. */
export const saveAnnouncement = mutation({
  args: {
    announcementId: v.optional(v.id("gameAnnouncements")),
    title: v.string(),
    summary: v.string(),
    body: v.string(),
    category: announcementCategory,
    status: announcementStatus,
    media: v.array(v.object({
      storageId: v.id("_storage"),
      mediaType: v.union(v.literal("image"), v.literal("video")),
      altText: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    if (!(await isStaff(ctx))) throw new Error("Not authorized.");
    const title = args.title.trim();
    const summary = args.summary.trim();
    const body = args.body.trim();
    if (title.length < 3 || title.length > 120) throw new Error("Title must be 3–120 characters.");
    if (summary.length < 10 || summary.length > 240) throw new Error("Summary must be 10–240 characters.");
    if (body.length < 20 || body.length > 10000) throw new Error("Announcement body must be 20–10,000 characters.");

    if (args.media.length > 5) throw new Error("An announcement can include up to 5 media files.");
    for (const asset of args.media) {
      if (asset.altText && asset.altText.trim().length > 200) throw new Error("Keep image descriptions under 200 characters.");
    }

    const user = (await currentUser(ctx))!;
    const userId = user._id;
    const now = Date.now();
    const department = user.department?.trim() || undefined;
    const position = user.position?.trim() || undefined;
    const fields = {
      title,
      summary,
      body,
      media: args.media.map((asset) => ({ storageId: asset.storageId, mediaType: asset.mediaType, altText: asset.altText?.trim() || undefined })),
      category: args.category,
      status: args.status,
      authorName: user.name?.trim() || user.email || "OpenWorlds team",
      department,
      position,
      badge: user.publicBadge ?? deriveBadge(department ?? null, position ?? null),
      publishedAt: args.status === "published" ? now : undefined,
    };

    if (args.announcementId) {
      const existing = await ctx.db.get(args.announcementId);
      if (!existing) throw new Error("Announcement not found.");
      if (existing.authorId !== userId && !(await isAdmin(ctx))) {
        throw new Error("You can only edit your own announcements.");
      }
      await validateAnnouncementAssets(ctx, args.media, existing.authorId, args.announcementId);
      const nextIds = new Set(args.media.map((asset) => asset.storageId));
      for (const previous of existing.media ?? []) {
        if (previous.storageId && !nextIds.has(previous.storageId)) {
          await ctx.storage.delete(previous.storageId);
          const stored = await ctx.db.query("announcementAssets")
            .withIndex("by_storage_id", (q) => q.eq("storageId", previous.storageId!))
            .unique();
          if (stored) await ctx.db.delete(stored._id);
        }
      }
      for (const asset of args.media) {
      const stored = await ctx.db.query("announcementAssets")
        .withIndex("by_storage_id", (q) => q.eq("storageId", asset.storageId!))
        .unique();
      if (stored) await ctx.db.patch(stored._id, { announcementId: args.announcementId });
      }
      await ctx.db.patch(args.announcementId, fields);
      return { announcementId: args.announcementId };
    }

    await validateAnnouncementAssets(ctx, args.media, userId);
    const announcementId = await ctx.db.insert("gameAnnouncements", {
      authorId: userId,
      ...fields,
      createdAt: now,
    });
    for (const asset of args.media) {
      const stored = await ctx.db.query("announcementAssets")
        .withIndex("by_storage_id", (q) => q.eq("storageId", asset.storageId!))
        .unique();
      if (stored) await ctx.db.patch(stored._id, { announcementId });
    }
    return { announcementId };
  },
});

async function validateAnnouncementAssets(
  ctx: MutationCtx,
  assets: Array<{ storageId: Id<"_storage">; mediaType: "image" | "video"; altText?: string }>,
  authorId: Id<"users">,
  announcementId?: Id<"gameAnnouncements">,
) {
  for (const asset of assets) {
    const stored = await ctx.db.query("announcementAssets")
      .withIndex("by_storage_id", (q) => q.eq("storageId", asset.storageId))
      .unique();
    const belongsToThisPost = Boolean(announcementId && stored?.announcementId === announcementId);
    const isUnattachedOwnUpload = !stored?.announcementId && stored?.authorId === authorId;
    if (!stored || stored.mediaType !== asset.mediaType || !stored.storageId || (!belongsToThisPost && !isUnattachedOwnUpload)) {
      throw new Error("One or more media uploads are invalid or already attached to another post.");
    }
  }
}

/** Staff can discard an uploaded file only while it remains unattached. */
export const deleteAnnouncementUpload = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    if (!(await isStaff(ctx))) throw new Error("Not authorized.");
    const userId = await getAuthUserId(ctx);
    const stored = await ctx.db.query("announcementAssets")
      .withIndex("by_storage_id", (q) => q.eq("storageId", args.storageId))
      .unique();
    if (!stored) return { ok: true };
    if (stored.authorId !== userId || stored.announcementId) throw new Error("This media is already attached to a post or belongs to another account.");
    await ctx.storage.delete(args.storageId);
    await ctx.db.delete(stored._id);
    return { ok: true };
  },
});

/** Authors can remove their own announcements; admins can remove any. */
export const removeAnnouncement = mutation({
  args: { announcementId: v.id("gameAnnouncements") },
  handler: async (ctx, args) => {
    if (!(await isStaff(ctx))) throw new Error("Not authorized.");
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) return { ok: true };
    const userId = await getAuthUserId(ctx);
    if (announcement.authorId !== userId && !(await isAdmin(ctx))) {
      throw new Error("You can only remove your own announcements.");
    }
    for (const asset of announcement.media ?? []) {
      if (!asset.storageId) continue;
      await ctx.storage.delete(asset.storageId);
      const stored = await ctx.db.query("announcementAssets")
        .withIndex("by_storage_id", (q) => q.eq("storageId", asset.storageId!))
        .unique();
      if (stored) await ctx.db.delete(stored._id);
    }
    await ctx.db.delete(args.announcementId);
    return { ok: true };
  },
});

/** Publish/unpublish management helper, using saveAnnouncement's ownership rules. */
export const setAnnouncementStatus = mutation({
  args: { announcementId: v.id("gameAnnouncements"), status: announcementStatus },
  handler: async (ctx, args) => {
    if (!(await isStaff(ctx))) throw new Error("Not authorized.");
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) throw new Error("Announcement not found.");
    const userId = await getAuthUserId(ctx);
    if (announcement.authorId !== userId && !(await isAdmin(ctx))) {
      throw new Error("You can only manage your own announcements.");
    }
    await ctx.db.patch(args.announcementId, {
      status: args.status,
      publishedAt: args.status === "published" ? Date.now() : undefined,
    });
    return { ok: true };
  },
});

/** Admin moderation: remove any announcement. */
export const adminRemoveAnnouncement = mutation({
  args: { announcementId: v.id("gameAnnouncements") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const announcement = await ctx.db.get(args.announcementId);
    if (announcement) {
      for (const asset of announcement.media ?? []) {
        if (!asset.storageId) continue;
        await ctx.storage.delete(asset.storageId);
        const stored = await ctx.db.query("announcementAssets")
          .withIndex("by_storage_id", (q) => q.eq("storageId", asset.storageId!))
          .unique();
        if (stored) await ctx.db.delete(stored._id);
      }
      await ctx.db.delete(args.announcementId);
    }
    return { ok: true };
  },
});
