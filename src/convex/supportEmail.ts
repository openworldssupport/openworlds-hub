"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Emails a newly submitted support ticket to the OpenWorlds support inbox.
 *
 * Runs best-effort: if RESEND_API_KEY is not configured yet, the ticket is
 * still saved by the `create` mutation and this action just logs that the
 * notification email was skipped. `reply_to` is set to the submitter so the
 * team can reply straight to the contacting user.
 */
export const sendSupportNotification = internalAction({
  args: {
    name: v.optional(v.string()),
    email: v.string(),
    username: v.optional(v.string()),
    reasonLabel: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
    submittedAt: v.number(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "[support] RESEND_API_KEY is not set. Ticket was saved, but no notification email was sent.",
      );
      return { sent: false, reason: "missing-api-key" as const };
    }

    const to = process.env.SUPPORT_EMAIL ?? "support@openworlds.dk";
    const from = process.env.RESEND_FROM ?? "OpenWorlds Support <onboarding@resend.dev>";

    const submittedTime = new Date(args.submittedAt).toISOString();
    const subjectLine = args.subject
      ? `[OpenWorlds Support] ${args.subject}`
      : `[OpenWorlds Support] ${args.reasonLabel}`;

    const text = [
      "New OpenWorlds support ticket",
      "",
      `Reason: ${args.reasonLabel}`,
      `Name: ${args.name || "(not provided)"}`,
      `Email: ${args.email}`,
      `OpenWorlds username: ${args.username || "(not provided)"}`,
      `Subject: ${args.subject || "(not provided)"}`,
      `Submitted: ${submittedTime}`,
      "",
      "Message:",
      args.message,
      "",
      "Reply to this email to respond to the contacting user.",
    ].join("\n");

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: args.email,
          subject: subjectLine,
          text,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error("[support] Resend rejected the notification email:", response.status, detail);
        return { sent: false, reason: "resend-error" as const };
      }

      return { sent: true };
    } catch (error) {
      console.error("[support] Failed to send support notification email:", error);
      return { sent: false, reason: "network-error" as const };
    }
  },
});
