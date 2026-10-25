import { getAuthUserId } from "@convex-dev/auth/server";
import { internalAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isAdmin } from "./admin";
import { requirePermissionVerification } from "./adminRoster";
import { sendBotEmail } from "./supportEmail";

export const ADMIN_NOTIFICATION_CHANNEL = {
  careers: "careers" as const,
  support: "support" as const,
  both: "both" as const,
  none: "none" as const,
} as const;
export type AdminNotificationChannel = (typeof ADMIN_NOTIFICATION_CHANNEL)[keyof typeof ADMIN_NOTIFICATION_CHANNEL];

export const ADMIN_NOTIFICATION_LABELS: Record<AdminNotificationChannel, string> = {
  careers: "Careers only",
  support: "Support only",
  both: "Careers and support",
  none: "No notifications",
};

export const ADMIN_NOTIFICATION_CHANNEL_OPTIONS: Array<readonly [AdminNotificationChannel, string]> = [
  ["none", "No notifications"],
  ["careers", "Careers only"],
  ["support", "Support only"],
  ["both", "Careers and support"],
];

/** Admin-only: list every admin's notification preference. Requires staff-access verification. */
export const listAdminNotificationPreferences = query({
  args: {},
  handler: async (ctx) => {
    const isAllowed = await isAdmin(ctx);
    if (!isAllowed) return null;
    const permissionVerifiedUntil = await requirePermissionVerification(ctx);
    if ((permissionVerifiedUntil as unknown as number) <= 0) {
      return null;
    }
    void permissionVerifiedUntil;

    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const prefs = await ctx.db.query("adminNotificationPreferences").collect();
    const rows = prefs.map((doc) => ({
      _id: doc._id,
      userId: doc.userId,
      userEmail: doc.userEmail,
      channel: doc.channel,
    }));
    rows.sort((a, b) => (a.userEmail ?? "").localeCompare(b.userEmail ?? ""));
    return rows;
  },
});

/** Admin-only: update the current administrator's notification channel. Requires staff-access verification. */
export const setAdminNotificationChannel = mutation({
  args: { channel: v.union(v.literal("none"), v.literal("careers"), v.literal("support"), v.literal("both")) },
  handler: async (ctx, { channel }) => {
    await requirePermissionVerification(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Signed-in administrator required.");

    const existing = await ctx.db
      .query("adminNotificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const normalizedChannel: AdminNotificationChannel =
      channel === "careers" || channel === "support" || channel === "both" || channel === "none"
        ? channel
        : "none";

    const values: { userId: typeof userId; userEmail?: string; channel: AdminNotificationChannel } = {
      userId,
      channel: normalizedChannel,
    };

    if (existing) {
      await ctx.db.patch(existing._id, values);
    } else {
      const user = await ctx.db.get(userId);
      if (!user) throw new Error("Signed-in administrator record not found.");
      values.userEmail = user.email?.trim().toLowerCase() ?? undefined;
      await ctx.db.insert("adminNotificationPreferences", values);
    }

    return { ok: true, channel: normalizedChannel };
  },
});

/** Admin-only: current administrator's preference, if set. */
export const myNotificationChannel = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const row = await ctx.db
      .query("adminNotificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return row ? (row.channel as AdminNotificationChannel) : null;
  },
});

/** Internal: fan out an admin-only email to every admin who opted in to that channel. */
export const fanOutAdminNotification = internalAction({
  args: {
    channel: v.union(v.literal("careers"), v.literal("support")),
    subject: v.string(),
    text: v.string(),
    html: v.string(),
    replyTo: v.string(),
    from: v.union(v.literal("support"), v.literal("careers")),
  },
  handler: async (actionCtx, { channel, subject, text, html, replyTo, from }) => {
    const preferences = await (actionCtx as any).db
      .query("adminNotificationPreferences")
      .withIndex("by_channel", (q: any) => q.eq("channel", channel))
      .collect();

    const qualified = preferences.filter((p: { channel: string | null; userEmail?: string | null }) => {
      const pChannel = p.channel;
      if (pChannel === channel) return true;
      if (pChannel === "both") return true;
      return false;
    });

    for (const pref of qualified) {
      if (!pref.userEmail) continue;
      try {
        await sendBotEmail({
          channel: from as "support" | "careers",
          to: pref.userEmail,
          replyTo,
          subject,
          text,
          html,
        });
      } catch {
        // One failing admin should not suppress the rest.
      }
    }
  },
});
