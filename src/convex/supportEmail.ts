"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { AgentMailClient } from "agentmail";

const DEFAULT_SUPPORT_EMAIL = "support@openworlds.dk";
const CAREERS_EMAIL = "careers@openworlds.dk";
const VLY_EMAIL_ENDPOINT = "https://integrations.vly.ai/v1/email/send";
const SUPPORT_BOT_FROM = "OpenWorlds Support Bot <support@openworlds.dk>";
const CAREERS_BOT_FROM = "OpenWorlds Careers Bot <careers@openworlds.dk>";

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
        body: JSON.stringify({ to: [email], from: SUPPORT_BOT_FROM, subject, text, html }),
      });
      if (!response.ok) throw new Error("Could not send account recovery email.");
      return { sent: true };
    }
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: SUPPORT_BOT_FROM, to: [email], subject, text, html }),
      });
      if (!response.ok) throw new Error("Could not send account recovery email.");
      return { sent: true };
    }
    throw new Error("Email delivery is not configured.");
  },
});

export const sendSiteStatusCode = internalAction({
  args: { code: v.string() },
  handler: async (_ctx, { code }) => {
    const to = process.env.SUPPORT_EMAIL ?? DEFAULT_SUPPORT_EMAIL;
    const subject = "OpenWorlds website status verification code";
    const text = `Your OpenWorlds website status verification code is ${code}. It expires in 10 minutes. Do not share this code. If you did not request it, you can ignore this email.`;
    const html = `<p>Your OpenWorlds website status verification code is <strong>${escapeHtml(code)}</strong>.</p><p>It expires in 10 minutes. Do not share this code. If you did not request it, you can ignore this email.</p>`;
    const vlyKey = process.env.VLY_INTEGRATION_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const agentMailKey = process.env.AGENTMAIL_API_KEY;
    const agentMailInboxId = process.env.AGENTMAIL_SUPPORT_INBOX_ID ?? process.env.AGENTMAIL_INBOX_ID;

    if (agentMailKey && agentMailInboxId) {
      try {
        const client = new AgentMailClient({ apiKey: agentMailKey });
        await setAgentMailDisplayName(client, agentMailInboxId, "OpenWorlds Support Bot");
        await client.inboxes.messages.send(agentMailInboxId, { to, subject, text, html });
        return { sent: true };
      } catch {
        throw new Error("Could not send the website status verification code.");
      }
    }
    if (vlyKey) {
      const response = await fetch(VLY_EMAIL_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${vlyKey}`, "Content-Type": "application/json", "X-Vly-Version": "0.1.0" },
        body: JSON.stringify({ to: [to], subject, text, html }),
      });
      if (!response.ok) throw new Error("Could not send the website status verification code.");
      return { sent: true };
    }
    if (resendKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: SUPPORT_BOT_FROM, to: [to], subject, text, html }),
      });
      if (!response.ok) throw new Error("Could not send the website status verification code.");
      return { sent: true };
    }
    throw new Error("Email delivery is not configured.");
  },
});

export const sendSupportAcknowledgement = internalAction({
  args: {
    reference: v.string(),
    name: v.optional(v.string()),
    email: v.string(),
    reasonLabel: v.string(),
    subject: v.optional(v.string()),
    submittedAt: v.number(),
  },
  handler: async (_ctx, args) => {
    const greeting = args.name ? `Hello ${args.name},` : "Hello,";
    const subject = `We received your OpenWorlds support request (${args.reference})`;
    const text = [
      greeting,
      "",
      "Thank you for contacting OpenWorlds Support. Your request has been received and is in our support queue. A member of our team will contact you by email as soon as possible.",
      "",
      `Reference: ${args.reference}`,
      `Topic: ${args.reasonLabel}`,
      ...(args.subject ? [`Subject: ${args.subject}`] : []),
      `Received: ${new Date(args.submittedAt).toISOString()}`,
      "",
      "Please keep your reference if you contact us again. This is an automated confirmation; replies to this address may not be monitored.",
      "",
      "Regards,",
      "OpenWorlds Support Bot",
    ].join("\n");
    const html = emailTemplate({
      title: "Support request received",
      greeting,
      paragraphs: [
        "Thank you for contacting OpenWorlds Support. Your request has been received and is in our support queue. A member of our team will contact you by email as soon as possible.",
      ],
      details: [
        ["Reference", args.reference],
        ["Topic", args.reasonLabel],
        ...(args.subject ? [["Subject", args.subject] as [string, string]] : []),
        ["Received", new Date(args.submittedAt).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC"],
      ],
      signature: "OpenWorlds Support Bot",
      footer: "This is an automated confirmation. Please keep your reference when contacting us again.",
    });
    return await sendBotEmail({
      channel: "support",
      to: args.email,
      replyTo: DEFAULT_SUPPORT_EMAIL,
      subject,
      text,
      html,
    });
  },
});

export const sendCareerEnquiry = internalAction({
  args: {
    type: v.union(v.literal("application"), v.literal("question")),
    roleTitle: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.string(),
    portfolio: v.optional(v.string()),
    message: v.string(),
    submittedAt: v.number(),
  },
  handler: async (_ctx, args) => {
    if (args.message.length > 16000) throw new Error("Careers submission exceeds the email size limit.");
    const isApplication = args.type === "application";
    const subject = isApplication
      ? `Career application: ${args.roleTitle ?? "Contributor position"}`
      : "Careers question from the OpenWorlds website";
    const submitted = new Date(args.submittedAt).toISOString();
    const applicationText = [
      isApplication ? "New career application" : "New careers question",
      "",
      `Name: ${args.name || "(not provided)"}`,
      `Email: ${args.email}`,
      ...(args.roleTitle ? [`Position: ${args.roleTitle}`] : []),
      ...(args.portfolio ? [`Portfolio: ${args.portfolio}`] : []),
      `Received: ${submitted}`,
      "",
      "Message:",
      args.message,
    ].join("\n");
    const applicationHtml = emailTemplate({
      title: isApplication ? "New career application" : "New careers question",
      greeting: "Careers team,",
      paragraphs: ["A new message was sent through the OpenWorlds Careers page."],
      details: [
        ["Name", args.name || "(not provided)"],
        ["Email", args.email],
        ...(args.roleTitle ? [["Position", args.roleTitle] as [string, string]] : []),
        ...(args.portfolio ? [["Portfolio", args.portfolio] as [string, string]] : []),
        ["Received", submitted],
      ],
      message: args.message,
      signature: "OpenWorlds Careers Bot",
    });
    const forwarded = await sendBotEmail({
      channel: "careers",
      to: CAREERS_EMAIL,
      replyTo: args.email,
      subject,
      text: applicationText,
      html: applicationHtml,
    });
    if (!forwarded.sent) {
      console.error("[careers] Could not deliver the enquiry to the Careers inbox; confirmation was not sent.");
      return { forwarded: false, confirmationSent: false };
    }

    const greeting = args.name ? `Hello ${args.name},` : "Hello,";
    const confirmationSubject = isApplication
      ? "We received your OpenWorlds Careers application"
      : "We received your OpenWorlds Careers message";
    const confirmationText = [
      greeting,
      "",
      isApplication
        ?      `Thank you for your interest in the ${args.roleTitle ?? "OpenWorlds"} position. Your application has been sent to the Careers team. They will review your submission and contact you by email if they need anything further.`
        : "Thank you for contacting the OpenWorlds Careers team. Your question has been sent to the Careers inbox, and the team will reply by email as soon as possible.",
      "",
      "This message confirms delivery to our Careers inbox; it is not an offer or confirmation of selection.",
      "",
      "Regards,",
      "OpenWorlds Careers Bot",
    ].join("\n");
    const confirmationHtml = emailTemplate({
      title: isApplication ? "Application received" : "Careers message received",
      greeting,
      paragraphs: [
        isApplication
          ?      `Thank you for your interest in the ${args.roleTitle ?? "OpenWorlds"} position. Your application has been sent to the Careers team. They will review your submission and contact you by email if they need anything further.`
          : "Thank you for contacting the OpenWorlds Careers team. Your question has been sent to the Careers inbox, and the team will reply by email as soon as possible.",
        "This message confirms delivery to our Careers inbox; it is not an offer or confirmation of selection.",
      ],
      details: args.roleTitle ? [["Position", args.roleTitle] as [string, string]] : [],
      signature: "OpenWorlds Careers Bot",
    });
    const confirmation = await sendBotEmail({
      channel: "careers",
      to: args.email,
      replyTo: CAREERS_EMAIL,
      subject: confirmationSubject,
      text: confirmationText,
      html: confirmationHtml,
    });
    return { forwarded: forwarded.sent, confirmationSent: confirmation.sent };
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
    const agentMailInboxId = process.env.AGENTMAIL_SUPPORT_INBOX_ID ?? process.env.AGENTMAIL_INBOX_ID;

    if (agentMailKey && agentMailInboxId) {
      return await sendViaAgentMail({
        apiKey: agentMailKey,
        inboxId: agentMailInboxId,
        fromName: "OpenWorlds Support Bot",
        to,
        subject: subjectLine,
        text,
        html,
        replyTo: args.email,
      });
    }

    if (agentMailKey || process.env.AGENTMAIL_INBOX_ID || process.env.AGENTMAIL_SUPPORT_INBOX_ID) {
      console.error("[support] AgentMail requires both AGENTMAIL_API_KEY and a support inbox ID.");
      return { sent: false, reason: "missing-agentmail-config" as const };
    }

    if (vlyKey) {
      return await sendViaVly({ vlyKey, to, subject: subjectLine, text, html, replyTo: args.email, from: SUPPORT_BOT_FROM });
    }

    if (resendKey) {
      return await sendViaResend({ resendKey, to, subject: subjectLine, text, replyTo: args.email, from: SUPPORT_BOT_FROM });
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
  fromName,
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  apiKey: string;
  inboxId: string;
  fromName: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}) {
  try {
    const client = new AgentMailClient({ apiKey });
    await setAgentMailDisplayName(client, inboxId, fromName);
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
  from,
}: {
  vlyKey: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo: string;
  from?: string;
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
        from,
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
  html,
  replyTo,
  from,
}: {
  resendKey: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo: string;
  from?: string;
}) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from ?? process.env.RESEND_FROM ?? SUPPORT_BOT_FROM,
        to: [to],
        reply_to: replyTo,
        subject,
        text,
        html,
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

async function sendBotEmail({
  channel,
  to,
  replyTo,
  subject,
  text,
  html,
}: {
  channel: "support" | "careers";
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}) {
  const from = channel === "support" ? SUPPORT_BOT_FROM : CAREERS_BOT_FROM;
  const vlyKey = process.env.VLY_INTEGRATION_KEY;
  if (vlyKey) {
    const result = await sendViaVly({ vlyKey, to, subject, text, html, replyTo, from });
    if (result.sent) return result;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const result = await sendViaResend({ resendKey, to, subject, text, replyTo, from });
    if (result.sent) return result;
  }

  const agentMailKey = process.env.AGENTMAIL_API_KEY;
  const inboxId = channel === "support"
    ? process.env.AGENTMAIL_SUPPORT_INBOX_ID ?? process.env.AGENTMAIL_INBOX_ID
    : process.env.AGENTMAIL_CAREERS_INBOX_ID ?? process.env.AGENTMAIL_INBOX_ID;
  if (agentMailKey && inboxId) {
    const supportInboxId = process.env.AGENTMAIL_SUPPORT_INBOX_ID ?? process.env.AGENTMAIL_INBOX_ID;
    const careersInboxId = process.env.AGENTMAIL_CAREERS_INBOX_ID;
    const otherChannelInboxId = channel === "support" ? careersInboxId : supportInboxId;
    if (otherChannelInboxId && otherChannelInboxId === inboxId) {
      console.error(`[email] ${channel} and the other channel must use separate AgentMail inboxes for distinct sender names.`);
      return { sent: false, reason: "shared-agentmail-inbox" as const };
    }
    if (channel === "careers" && !careersInboxId) {
      console.error("[email] AGENTMAIL_CAREERS_INBOX_ID is required for Careers messages.");
      return { sent: false, reason: "missing-careers-inbox" as const };
    }
    const result = await sendViaAgentMail({ apiKey: agentMailKey, inboxId, fromName: channel === "support" ? "OpenWorlds Support Bot" : "OpenWorlds Careers Bot", to, subject, text, html, replyTo });
    if (result.sent) return result;
  }

  console.warn(`[email] Could not deliver ${channel} bot email; no configured provider accepted it.`);
  return { sent: false, reason: "provider-unavailable" as const };
}

async function setAgentMailDisplayName(client: AgentMailClient, inboxId: string, displayName: string) {
  const inbox = await client.inboxes.get(inboxId);
  if (inbox.displayName !== displayName) {
    await client.inboxes.update(inboxId, { displayName });
  }
}

function emailTemplate({
  title,
  greeting,
  paragraphs,
  details,
  message,
  signature,
  footer,
}: {
  title: string;
  greeting: string;
  paragraphs: string[];
  details?: ReadonlyArray<readonly [string, string]>;
  message?: string;
  signature: string;
  footer?: string;
}) {
  const detailsHtml = details?.length
    ? `<table role="presentation" style="width:100%;border-collapse:collapse;margin:20px 0">${details.map(([label, value]) => `<tr><td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;color:#475569;font-size:14px;width:130px">${escapeHtml(label)}</td><td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px">${escapeHtml(value)}</td></tr>`).join("")}</table>`
    : "";
  const paragraphsHtml = paragraphs.map((paragraph) => `<p style="margin:0 0 14px;line-height:1.65;color:#334155">${escapeHtml(paragraph)}</p>`).join("");
  const messageHtml = message ? `<div style="margin:18px 0;padding:16px;border-left:3px solid #0066cc;background:#f8fafc;white-space:pre-wrap;line-height:1.6;color:#334155">${escapeHtml(message)}</div>` : "";
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><div style="max-width:620px;margin:28px auto;background:#ffffff;border:1px solid #e2e8f0"><div style="padding:22px 28px;background:#073b70;color:#ffffff;font-size:18px;font-weight:700">OpenWorlds</div><div style="padding:28px"><p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase">${escapeHtml(title)}</p><p style="margin:0 0 18px;font-size:16px;font-weight:600">${escapeHtml(greeting)}</p>${paragraphsHtml}${detailsHtml}${messageHtml}<p style="margin:24px 0 0;line-height:1.6;color:#334155">Regards,<br><strong>${escapeHtml(signature)}</strong></p>${footer ? `<p style="margin:20px 0 0;border-top:1px solid #e2e8f0;padding-top:14px;color:#64748b;font-size:12px;line-height:1.5">${escapeHtml(footer)}</p>` : ""}</div></div></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
