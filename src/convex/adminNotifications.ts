import { internal } from "./_generated/api";
import { internalAction, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isAdmin } from "./admin";
import { requirePermissionVerification } from "./adminRoster";
import { sendBotEmail } from "./supportEmail";

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
      .map((row) => ({
        _id: row._id,
        email: row.email,
        kind: row.kind,
      }))
      .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
  },
});

/** Internal: return saved recipients that match a submission channel. */
export const getEligibleAdminNotificationRecipients = internalQuery({
  args: { channel: v.union(v.literal("careers"), v.literal("support")) },
  handler: async (ctx, { channel }) => {
    const recipients = await ctx.db.query("adminNotificationRecipients").collect();
    return recipients.filter((recipient) => recipient.kind === channel || recipient.kind === "both");
  },
});

/** Admin-only: add a recipient for admin submission alerts. Requires staff-access verification. */
export const addAdminNotificationRecipient = mutation({
  args: {
    email: v.string(),
    kind: v.union(v.literal("careers"), v.literal("support"), v.literal("both")),
  },
  handler: async (ctx, { email, kind }) => {
    await requirePermissionVerification(ctx);
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error("Enter a valid email address for the notification recipient.");
    }

    const existing = await ctx.db
      .query("adminNotificationRecipients")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { kind });
    } else {
      await ctx.db.insert("adminNotificationRecipients", { email: normalized, kind, createdAt: Date.now() });
    }

    return { ok: true, email: normalized, kind };
  },
});

/** Admin-only: remove a registered notification recipient. Requires staff-access verification. */
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

/** Internal: fan out the full submission details to registered recipients for that submission kind. */
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
    const recipients = await actionCtx.runQuery(internal.adminNotifications.getEligibleAdminNotificationRecipients, { channel });

    console.warn(`[adminNotifications:fanOut] channel=${channel} recipientCount=${recipients.length}`);
    for (const recipient of recipients) {
      if (!recipient.email) continue;
      console.warn(`[adminNotifications:fanOut] attempt to=${recipient.email} kind=${recipient.kind}`);
      try {
        const result = await sendBotEmail({
          channel: from as "support" | "careers",
          to: recipient.email,
          replyTo,
          subject,
          text,
          html,
        });
        if (!result.sent) {
          console.error(`[adminNotifications:fanOut] delivery failed to=${recipient.email} reason=${result.reason ?? "unknown"}`);
          continue;
        }
        console.warn(`[adminNotifications:fanOut] sent ok to=${recipient.email}`);
      } catch (err) {
        console.error(`[adminNotifications:fanOut] failed to=${recipient.email}`, err);
        // One failing recipient should not suppress the rest.
      }
    }
  },
});

/** Internal: send a short "new submission, ready for review" alert to registered recipients for that submission kind. */
export const sendAdminReadyForReviewAlert = internalAction({
  args: {
    channel: v.union(v.literal("careers"), v.literal("support")),
    subject: v.string(),
    body: v.string(),
    replyTo: v.string(),
    from: v.union(v.literal("support"), v.literal("careers")),
  },
  handler: async (actionCtx, { channel, subject, body, replyTo, from }) => {
    const recipients = await actionCtx.runQuery(internal.adminNotifications.getEligibleAdminNotificationRecipients, { channel });

    console.warn(`[adminNotifications:readyForReview] channel=${channel} recipientCount=${recipients.length} subject=${subject}`);
    for (const recipient of recipients) {
      if (!recipient.email) continue;
      console.warn(`[adminNotifications:readyForReview] attempt to=${recipient.email} kind=${recipient.kind}`);
      try {
        const result = await sendBotEmail({
          channel: from as "support" | "careers",
          to: recipient.email,
          replyTo,
          subject,
          text: body,
          html: readyForReviewHtml(body),
        });
        if (!result.sent) {
          console.error(`[adminNotifications:readyForReview] delivery failed to=${recipient.email} reason=${result.reason ?? "unknown"}`);
          continue;
        }
        console.warn(`[adminNotifications:readyForReview] sent ok to=${recipient.email}`);
      } catch (err) {
        console.error(`[adminNotifications:readyForReview] failed to=${recipient.email}`, err);
        // One failing recipient should not suppress the rest.
      }
    }
  },
});

function readyForReviewHtml(body: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><div style="max-width:620px;margin:28px auto;background:#ffffff;border:1px solid #e2e8f0"><div style="padding:22px 28px;background:#073b70;color:#ffffff;font-size:18px;font-weight:700">OpenWorlds</div><div style="padding:28px"><p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase">New submission — ready for review</p><p style="margin:0 0 18px;font-size:16px;font-weight:600;color:#0f172a">A new submission has been received and is ready for review.</p><div style="margin:18px 0;padding:16px;border-left:3px solid #0066cc;background:#f8fafc;white-space:pre-wrap;line-height:1.6;color:#334155">${escaped}</div><p style="margin:24px 0 0;line-height:1.6;color:#334155">Regards,<br><strong>OpenWorlds notification service</strong></p></div></div></body></html>`;
}
