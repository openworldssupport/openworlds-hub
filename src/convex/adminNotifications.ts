import { internal } from "./_generated/api";
import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isAdmin } from "./admin";
import { requirePermissionVerification } from "./adminRoster";

export type AdminNotificationRecipientKind = "careers" | "support" | "both";

export const ADMIN_NOTIFICATION_RECIPIENT_KINDS: Array<readonly [AdminNotificationRecipientKind, string]> = [
  ["careers", "Career applications and careers questions only"],
  ["support", "Support tickets only"],
  ["both", "Career applications and support tickets"],
];

export const ADMIN_NOTIFICATION_CHANNEL_OPTIONS: Array<readonly [AdminNotificationRecipientKind, string]> = [
  ["careers", "Careers only"],
  ["support", "Support only"],
  ["both", "Both"],
];

/** Admin-only: list every registered notification recipient. */
export const listAdminNotificationRecipients = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null;
    const recipients = await ctx.db.query("adminNotificationRecipients").collect();
    return recipients
      .map(({ _id, email, kind }) => ({ _id, email, kind }))
      .sort((a, b) => a.email.localeCompare(b.email));
  },
});

/** Internal: return saved recipients matching a submission channel. */
export const getEligibleAdminNotificationRecipients = internalQuery({
  args: { channel: v.union(v.literal("careers"), v.literal("support")) },
  handler: async (ctx, { channel }) => {
    const recipients = await ctx.db.query("adminNotificationRecipients").collect();
    return recipients.filter((recipient) => recipient.kind === channel || recipient.kind === "both");
  },
});

/** Internal: check permission to send a test alert to a saved recipient. */
export const canSendTestAlert = internalQuery({
  args: { userId: v.id("users"), recipientId: v.id("adminNotificationRecipients"), channel: v.union(v.literal("careers"), v.literal("support")) },
  handler: async (ctx, { userId, recipientId, channel }) => {
    const user = await ctx.db.get(userId);
    const isVerifiedAdmin = Boolean(user && user.emailVerificationTime !== undefined && !user.isSiteBanned &&
      (user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk"));
    if (!isVerifiedAdmin) throw new Error("Verified administrator access is required.");

    const verification = await ctx.db.query("adminRosterVerifications")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (!verification?.permissionVerifiedUntil || verification.permissionVerifiedUntil < Date.now()) {
      throw new Error("Verify the code sent to support@openworlds.dk before sending a test alert.");
    }

    const recipient = await ctx.db.get(recipientId);
    if (!recipient || (recipient.kind !== channel && recipient.kind !== "both")) {
      throw new Error("That saved recipient is not configured for this alert type.");
    }
    return { email: recipient.email };
  },
});

/** Admin-only: add or update a recipient. Requires Support email verification. */
export const addAdminNotificationRecipient = mutation({
  args: {
    email: v.string(),
    kind: v.union(v.literal("careers"), v.literal("support"), v.literal("both")),
  },
  handler: async (ctx, { email, kind }) => {
    await requirePermissionVerification(ctx);
    const normalized = email.trim().toLowerCase();
    if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error("Enter a valid email address for the notification recipient.");
    }

    const existing = await ctx.db
      .query("adminNotificationRecipients")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    if (existing) await ctx.db.patch(existing._id, { kind });
    else await ctx.db.insert("adminNotificationRecipients", { email: normalized, kind, createdAt: Date.now() });
    return { ok: true, email: normalized, kind };
  },
});

/** Admin-only: remove a registered notification recipient. Requires Support email verification. */
export const removeAdminNotificationRecipient = mutation({
  args: { recipientId: v.id("adminNotificationRecipients") },
  handler: async (ctx, { recipientId }) => {
    await requirePermissionVerification(ctx);
    const recipient = await ctx.db.get(recipientId);
    if (!recipient) return { ok: true };
    await ctx.db.delete(recipientId);
    return { ok: true, email: recipient.email };
  },
});
