"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_SUPPORT_EMAIL = "support@openworlds.dk";
const VLY_EMAIL_ENDPOINT = "https://integrations.vly.ai/v1/email/send";

/**
 * Emails a newly submitted support ticket to the OpenWorlds support inbox.
 *
 * Uses the platform email integration (VLY_INTEGRATION_KEY), and falls back to
 * Resend (RESEND_API_KEY) if that is configured instead. `replyTo` is set to the
 * submitter so the team can reply straight to the contacting user. Runs
 * best-effort: if no provider is configured the ticket is still saved and this
 * action just logs that the email was skipped.
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
    const to = process.env.SUPPORT_EMAIL ?? DEFAULT_SUPPORT_EMAIL;
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

    const html = [
      "<h2>New OpenWorlds support ticket</h2>",
      "<p><strong>Reason:</strong> " + escapeHtml(args.reasonLabel) + "</p>",
      "<p><strong>Name:</strong> " + escapeHtml(args.name || "(not provided)") + "</p>",
      "<p><strong>Email:</strong> " + escapeHtml(args.email) + "</p>",
      "<p><strong>OpenWorlds username:</strong> " + escapeHtml(args.username || "(not provided)") + "</p>",
      "<p><strong>Subject:</strong> " + escapeHtml(args.subject || "(not provided)") + "</p>",
      "<p><strong>Submitted:</strong> " + escapeHtml(submittedTime) + "</p>",
      "<hr />",
      "<p>" + escapeHtml(args.message).replace(/\n/g, "<br />") + "</p>",
    ].join("\n");

    const vlyKey = process.env.VLY_INTEGRATION_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    if (vlyKey) {
      return await sendViaVly({ vlyKey, to, subject: subjectLine, text, html, replyTo: args.email });
    }

    if (resendKey) {
      return await sendViaResend({ resendKey, to, subject: subjectLine, text, replyTo: args.email });
    }

    console.warn(
      "[support] No email provider configured (VLY_INTEGRATION_KEY or RESEND_API_KEY). Ticket was saved without emailing.",
    );
    return { sent: false, reason: "missing-provider" as const };
  },
});

async function sendViaVly({
  vlyKey,
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  vlyKey: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}) {
  try {
    const response = await fetch(VLY_EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vlyKey}`,
        "Content-Type": "application/json",
        "X-Vly-Version": "0.1.0",
      },
      body: JSON.stringify({
        to: [to],
        subject,
        text,
        html,
        replyTo,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[support] Email integration rejected the notification:", response.status, detail);
      return { sent: false, reason: "provider-error" as const };
    }

    const data = (await response.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: data.id ?? null };
  } catch (error) {
    console.error("[support] Failed to send support notification email:", error);
    return { sent: false, reason: "network-error" as const };
  }
}

async function sendViaResend({
  resendKey,
  to,
  subject,
  text,
  replyTo,
}: {
  resendKey: string;
  to: string;
  subject: string;
  text: string;
  replyTo: string;
}) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "OpenWorlds Support <onboarding@resend.dev>",
        to: [to],
        reply_to: replyTo,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[support] Resend rejected the notification email:", response.status, detail);
      return { sent: false, reason: "provider-error" as const };
    }

    return { sent: true };
  } catch (error) {
    console.error("[support] Failed to send support notification email:", error);
    return { sent: false, reason: "network-error" as const };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
