"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_SUPPORT_EMAIL = "support@openworlds.dk";
const DEFAULT_CAREERS_EMAIL = "careers@openworlds.dk";
const VLY_EMAIL_ENDPOINT = "https://integrations.vly.ai/v1/email/send";

/**
 * Emails a new support ticket to the OpenWorlds support inbox.
 */
export const sendCareerApplicationNotification = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    roleSlug: v.string(),
    roleTitle: v.string(),
    experience: v.string(),
    motivation: v.string(),
    roleApproach: v.string(),
    collaboration: v.string(),
    availability: v.string(),
    portfolio: v.string(),
    subject: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const to = DEFAULT_CAREERS_EMAIL;
    const subject = args.subject ?? `[OpenWorlds] New application: ${args.roleTitle}`;
    const text = [
      "New OpenWorlds career application",
      "",
      `Name: ${args.name}`,
      `Email: ${args.email}`,
      `Role: ${args.roleTitle} (${args.roleSlug})`,
      "",
      "Experience:", args.experience,
      "Motivation:", args.motivation,
      "First weeks:", args.roleApproach,
      "Collaboration:", args.collaboration,
      "Availability:", args.availability,
      "Work samples:", args.portfolio || "(none)",
    ].join("\n");
    const html = [
      "<h2>New OpenWorlds career application</h2>",
      `<p><strong>Name:</strong> ${escapeHtml(args.name)}</p>`,
      `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(args.email)}">${escapeHtml(args.email)}</a></p>`,
      `<p><strong>Role:</strong> ${escapeHtml(args.roleTitle)} (${escapeHtml(args.roleSlug)})</p>`,
      `<p><strong>Experience:</strong></p><p>${escapeHtml(args.experience).replace(/\n/g, "<br />")}</p>`,
      `<p><strong>Motivation:</strong></p><p>${escapeHtml(args.motivation).replace(/\n/g, "<br />")}</p>`,
      `<p><strong>First weeks:</strong></p><p>${escapeHtml(args.roleApproach).replace(/\n/g, "<br />")}</p>`,
      `<p><strong>Collaboration:</strong></p><p>${escapeHtml(args.collaboration).replace(/\n/g, "<br />")}</p>`,
      `<p><strong>Availability:</strong></p><p>${escapeHtml(args.availability).replace(/\n/g, "<br />")}</p>`,
      `<p><strong>Work samples:</strong> ${escapeHtml(args.portfolio || "(none)")}</p>`,
    ].join("\n");

    const vlyKey = process.env.VLY_INTEGRATION_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (vlyKey) return await sendViaVly({ vlyKey, to, subject, text, html, replyTo: args.email });
    if (resendKey) return await sendViaResend({ resendKey, to, subject, text, replyTo: args.email });

    console.warn("[careers] No email provider configured; application was saved without email delivery.");
    return { sent: false, reason: "missing-provider" as const };
  },
});

export const sendSupportNotification = internalAction({
  args: {
    reference: v.optional(v.string()),
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
      `Reference: ${args.reference || "(none)"}`,
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
      "<p><strong>Reference:</strong> " + escapeHtml(args.reference || "(none)") + "</p>",
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
      // Log only the status: the provider body can echo the recipient address.
      console.error("[support] Email integration rejected the notification with status", response.status);
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
      // Log only the status: the provider body can echo the recipient address.
      console.error("[support] Resend rejected the notification email with status", response.status);
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
