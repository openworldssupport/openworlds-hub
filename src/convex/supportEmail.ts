"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { AgentMailClient } from "agentmail";

const DEFAULT_SUPPORT_EMAIL = "support@openworlds.dk";
const VLY_EMAIL_ENDPOINT = "https://integrations.vly.ai/v1/email/send";

export const sendPlayerRecoveryCode = internalAction({
  args: { email: v.string(), code: v.string() },
  handler: async (_ctx, { email, code }) => {
    const subject = "OpenWorlds account recovery code";
    const text = `Your OpenWorlds account recovery code is ${code}. It expires in 10 minutes. Do not share it. If you did not request this, you can ignore this message.`;
    const html = `<p>Your OpenWorlds account recovery code is <strong>${escapeHtml(code)}</strong>.</p><p>It expires in 10 minutes. Do not share it. If you did not request this, you can ignore this message.</p>`;
    const vlyKey = process.env.VLY_INTEGRATION_KEY;
    if (vlyKey) {
      const response = await fetch(VLY_EMAIL_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${vlyKey}`, "Content-Type": "application/json", "X-Vly-Version": "0.1.0" },
        body: JSON.stringify({ to: [email], subject, text, html }),
      });
      if (!response.ok) throw new Error("Could not send account recovery email.");
      return { sent: true };
    }
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.RESEND_FROM ?? "OpenWorlds <onboarding@resend.dev>", to: [email], subject, text, html }),
      });
      if (!response.ok) throw new Error("Could not send account recovery email.");
      return { sent: true };
    }
    throw new Error("Email delivery is not configured.");
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
    const agentMailKey = process.env.AGENTMAIL_API_KEY;
    const agentMailInboxId = process.env.AGENTMAIL_INBOX_ID;

    if (agentMailKey && agentMailInboxId) {
      return await sendViaAgentMail({
        apiKey: agentMailKey,
        inboxId: agentMailInboxId,
        to,
        subject: subjectLine,
        text,
        html,
        replyTo: args.email,
      });
    }

    if (agentMailKey || agentMailInboxId) {
      console.error("[support] AgentMail requires both AGENTMAIL_API_KEY and AGENTMAIL_INBOX_ID.");
      return { sent: false, reason: "missing-agentmail-config" as const };
    }

    if (vlyKey) {
      return await sendViaVly({ vlyKey, to, subject: subjectLine, text, html, replyTo: args.email });
    }

    if (resendKey) {
      return await sendViaResend({ resendKey, to, subject: subjectLine, text, replyTo: args.email });
    }

    console.warn(
      "[support] No email provider configured. Ticket was saved without emailing.",
    );
    return { sent: false, reason: "missing-provider" as const };
  },
});

async function sendViaAgentMail({
  apiKey,
  inboxId,
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  apiKey: string;
  inboxId: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}) {
  try {
    const client = new AgentMailClient({ apiKey });
    await client.inboxes.messages.send(inboxId, {
      to,
      subject,
      text,
      html,
      replyTo,
    });
    return { sent: true };
  } catch {
    console.error("[support] Failed to send support notification through AgentMail.");
    return { sent: false, reason: "provider-error" as const };
  }
}

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
  } catch {
    console.error("[support] Failed to send support notification email.");
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
  } catch {
    console.error("[support] Failed to send support notification email.");
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
