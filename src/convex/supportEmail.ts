"use node";

import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { AgentMailClient } from "agentmail";
import { getAuthUserId } from "@convex-dev/auth/server";

const DEFAULT_SUPPORT_EMAIL = "contact@openworlds.dk";
/** Where the site's public assets and links live, independent of the sender. */
const SITE_URL = (process.env.SITE_URL ?? "https://openworlds.dk").replace(/\/+$/, "");
const CAREERS_EMAIL = "careers@openworlds.dk";
const VLY_EMAIL_ENDPOINT = "https://integrations.vly.ai/v1/email/send";
const SUPPORT_BOT_FROM = "OpenWorlds Support Bot <contact@openworlds.dk>";
const CAREERS_BOT_FROM = "OpenWorlds Careers Bot <careers@openworlds.dk>";

export const sendCompanySignInCode = internalAction({
  args: { email: v.string(), code: v.string() },
  handler: async (_ctx, { email, code }) => {
    const subject = "Your OpenWorlds staff sign-in code";
    const text = `Your OpenWorlds staff sign-in code is ${code}. It expires in 15 minutes. Do not share it. If you did not request this code, you can ignore this email.`;
    const html = emailShell({
      title: "Your sign-in code",
      preheader: `Your OpenWorlds staff sign-in code is ${code}. It expires in 15 minutes.`,
      footerAddress: DEFAULT_SUPPORT_EMAIL,
      footer: "This is an automated message. If you did not request a code, you can ignore it.",
      body: [
        emailParagraphs(["Enter this code to finish signing in to the OpenWorlds staff portal. It expires in 15 minutes."]),
        emailCode(code),
        emailParagraphs(["Do not share this code. If you did not request it, you can ignore this email — nobody can sign in without it."]),
      ].join(""),
    });
    const result = await sendBotEmail({
      channel: "support",
      to: email,
      replyTo: DEFAULT_SUPPORT_EMAIL,
      subject,
      text,
      html,
    });
    if (!result.sent) throw new Error("Could not send a sign-in code.");
    return { sent: true };
  },
});

export const sendPlayerRecoveryCode = internalAction({
  args: { email: v.string(), code: v.string() },
  handler: async (_ctx, { email, code }) => {
    const subject = "OpenWorlds account recovery code";
    const text = `Your OpenWorlds account recovery code is ${code}. It expires in 10 minutes. Do not share it. If you did not request this, you can ignore this message.`;
    const html = emailShell({
      title: "Your account recovery code",
      preheader: `Your OpenWorlds recovery code is ${code}. It expires in 10 minutes.`,
      footerAddress: DEFAULT_SUPPORT_EMAIL,
      footer: "This is an automated message. If you did not request a code, you can ignore it.",
      body: [
        emailParagraphs(["Enter this code to reset the password on your OpenWorlds account. It expires in 10 minutes."]),
        emailCode(code),
        emailParagraphs(["If you did not ask to reset your password, you can ignore this message. Your password has not changed."]),
      ].join(""),
    });
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
    type: v.union(v.literal("application"), v.literal("question"), v.literal("creator-application")),
    roleTitle: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.string(),
    portfolio: v.optional(v.string()),
    message: v.string(),
    submittedAt: v.number(),
  },
  handler: async (_ctx, args) => {
    if (args.message.length > 16000) throw new Error("Careers submission exceeds the email size limit.");
    const isApplication = args.type !== "question";
    const isCreatorApplication = args.type === "creator-application";
    const subject = isCreatorApplication
      ? "Official Content Creator application"
      : isApplication
        ? `Career application: ${args.roleTitle ?? "Contributor position"}`
        : "Careers question from the OpenWorlds website";
    const submitted = new Date(args.submittedAt).toISOString();
    const applicationText = [
      isCreatorApplication ? "New Official Content Creator application" : isApplication ? "New career application" : "New careers question",
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
      title: isCreatorApplication ? "New Official Content Creator application" : isApplication ? "New career application" : "New careers question",
      greeting: "Careers team,",
      paragraphs: [isCreatorApplication ? "A new application was submitted for the OpenWorlds Official Content Creator program." : "A new message was sent through the OpenWorlds Careers page."],
      details: [
        ["Name", args.name || "(not provided)"],
        ["Email", args.email],
        ...(args.roleTitle ? [["Position", args.roleTitle] as [string, string]] : []),
        ...(args.portfolio ? [["Portfolio", args.portfolio] as [string, string]] : []),
        ["Received", submitted],
      ],
      message: args.message,
      signature: "OpenWorlds Careers Bot",
      footerAddress: CAREERS_EMAIL,
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
    const confirmationSubject = isCreatorApplication
      ? "We received your Official Content Creator application"
      : isApplication
        ? "We received your OpenWorlds Careers application"
        : "We received your OpenWorlds Careers message";
    const confirmationText = [
      greeting,
      "",
      isApplication
        ? isCreatorApplication
          ? "Thank you for applying to become an Official Content Creator. Your application has been sent to the Careers team for review."
          : `Thank you for your interest in the ${args.roleTitle ?? "OpenWorlds"} position. Your application has been sent to the Careers team. They will review your submission and contact you by email if they need anything further.`
        : "Thank you for contacting the OpenWorlds Careers team. Your question has been sent to the Careers inbox, and the team will reply by email as soon as possible.",
      "",
      "This message confirms delivery to our Careers inbox; it is not an offer or confirmation of selection.",
      ...(isApplication && !isCreatorApplication
        ? ["", "Contributor roles at OpenWorlds are voluntary and unpaid."]
        : []),
      "",
      "Regards,",
      "OpenWorlds Careers Bot",
    ].join("\n");
    const confirmationHtml = emailTemplate({
      title: isCreatorApplication ? "Creator application received" : isApplication ? "Application received" : "Careers message received",
      greeting,
      paragraphs: [
        isApplication
          ? isCreatorApplication
            ? "Thank you for applying to become an Official Content Creator. Your application has been sent to the Careers team for review."
            : `Thank you for your interest in the ${args.roleTitle ?? "OpenWorlds"} position. Your application has been sent to the Careers team. They will review your submission and contact you by email if they need anything further.`
          : "Thank you for contacting the OpenWorlds Careers team. Your question has been sent to the Careers inbox, and the team will reply by email as soon as possible.",
        "This message confirms delivery to our Careers inbox; it is not an offer or confirmation of selection.",
        ...(isApplication && !isCreatorApplication ? ["Contributor roles at OpenWorlds are voluntary and unpaid."] : []),
      ],
      details: args.roleTitle ? [["Position", args.roleTitle] as [string, string]] : [],
      signature: "OpenWorlds Careers Bot",
      footerAddress: CAREERS_EMAIL,
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

export const sendAdminNotificationTest = action({
  args: {
    recipientId: v.id("adminNotificationRecipients"),
    channel: v.union(v.literal("careers"), v.literal("support")),
  },
  handler: async (ctx, { recipientId, channel }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in as an administrator first.");
    const recipient = await ctx.runQuery(internal.adminNotifications.canSendTestAlert, {
      userId,
      recipientId,
      channel,
    });
    const department = channel === "careers" ? "Careers" : "Support";
    const result = await sendBotEmail({
      channel,
      to: recipient.email,
      replyTo: channel === "support" ? DEFAULT_SUPPORT_EMAIL : CAREERS_EMAIL,
      subject: `OpenWorlds ${department} notification test`,
      text: `This is a test notification for the ${department} alert channel. The saved recipient address is receiving email successfully. Real submissions will generate a short ready-for-review alert.`,
      html: readyForReviewHtml(
        `This is a test notification for the ${department} alert channel. The saved recipient address is receiving email successfully. Real submissions will generate a short ready-for-review alert.`,
        channel === "careers" ? CAREERS_EMAIL : DEFAULT_SUPPORT_EMAIL,
      ),
    });
    if (!result.sent) throw new Error("The email provider could not deliver the test alert. Check the configured email provider and try again.");
    return { sent: true };
  },
});

export const sendAdminReadyForReviewAlert = internalAction({
  args: {
    channel: v.union(v.literal("careers"), v.literal("support")),
    subject: v.string(),
    body: v.string(),
    from: v.union(v.literal("support"), v.literal("careers")),
  },
  handler: async (actionCtx, { channel, subject, body, from }) => {
    const recipients = await actionCtx.runQuery(
      internal.adminNotifications.getEligibleAdminNotificationRecipients,
      { channel },
    );

    console.info(`[adminNotifications] Dispatching ${channel} ready-for-review alert to ${recipients.length} recipient(s).`);
    for (const recipient of recipients) {
      try {
        const result = await sendBotEmail({
          channel: from,
          to: recipient.email,
          replyTo: from === "support" ? DEFAULT_SUPPORT_EMAIL : CAREERS_EMAIL,
          subject,
          text: body,
          html: readyForReviewHtml(body, from === "support" ? DEFAULT_SUPPORT_EMAIL : CAREERS_EMAIL),
        });
        if (!result.sent) {
          console.error(`[adminNotifications] Delivery failed (${channel}): ${result.reason ?? "provider unavailable"}.`);
        }
      } catch (error) {
        console.error(`[adminNotifications] Delivery failed (${channel}).`, error);
      }
    }
  },
});

/**
 * Every colour in outgoing email comes from this object. The values are the
 * site theme's own tokens (--ow-green, --ow-red, --ow-gold and the paper/ink
 * tones from src/index.css), so a message always looks like the version of
 * openworlds.dk it was sent from. When the site theme changes, change this
 * object in the same pass — nothing else in this file hardcodes a colour.
 */
const SITE_THEME = {
  paper: "#ffffff", // white page background
  ink: "#0f172a", // slate-900 headings
  body: "#475569", // slate-600 copy
  muted: "#64748b", // slate-500 secondary text
  hairline: "#e2e8f0", // slate-200 borders
  tint: "#f8fafc", // slate-50 panel fill
  green: "#176b45", // --ow-green
  red: "#a52234", // --ow-red
  gold: "#d6a63b", // --ow-gold
  hero: "#14583c", // .ow-page-hero background
  heroInk: "#ffffff", // text on the green banner
  heroMuted: "#cddcd3", // secondary text on the green banner
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  mono: "ui-monospace,SFMono-Regular,Menlo,Consolas,'Courier New',monospace",
} as const;

function emailRule(): string {
  const cell = (background: string, width: string) =>
    `<td height="3" width="${width}" style="height:3px;line-height:3px;font-size:0;background:${background}">&nbsp;</td>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse"><tr>${cell(SITE_THEME.red, "34%")}${cell(SITE_THEME.green, "49%")}${cell(SITE_THEME.gold, "17%")}</tr></table>`;
}

/** The real logo, served from the site (a PNG, because mail clients block SVG).
 *  If images are switched off, the alt text still identifies the sender. */
function emailLogo(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="middle" style="padding:0">
      <img src="${SITE_URL}/logo-email.png" width="40" height="40" alt="OpenWorlds" style="display:block;width:40px;height:40px;border:0;outline:none;text-decoration:none" />
    </td>
    <td valign="middle" style="padding-left:12px">
      <div style="font:700 17px/1.2 ${SITE_THEME.font};color:${SITE_THEME.heroInk};letter-spacing:-0.2px">OpenWorlds</div>
    </td>
  </tr></table>`;
}

function emailShell({
  title,
  preheader,
  body,
  footerAddress,
  footer,
}: {
  title: string;
  preheader?: string;
  body: string;
  footerAddress: string;
  footer?: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${SITE_THEME.paper}">
${preheader ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${SITE_THEME.paper}">${escapeHtml(preheader)}</div>` : ""}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${SITE_THEME.paper}">
  <tr>
    <td align="center" style="padding:0 12px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;border-collapse:collapse">
        <tr><td style="padding:0">${emailRule()}</td></tr>
        <tr>
          <td style="background:${SITE_THEME.hero};padding:26px 24px 26px">
            ${emailLogo()}
            <h1 style="margin:20px 0 0;font:600 21px/1.35 ${SITE_THEME.font};color:${SITE_THEME.heroInk};letter-spacing:-0.2px">${escapeHtml(title)}</h1>
          </td>
        </tr>
        <tr><td style="padding:26px 24px 24px">${body}</td></tr>
        <tr>
          <td style="border-top:1px solid ${SITE_THEME.hairline};padding:16px 24px 28px">
            <p style="margin:0;font:400 12px/1.6 ${SITE_THEME.font};color:${SITE_THEME.muted}">OpenWorlds · ${escapeHtml(footerAddress)}</p>
            ${footer ? `<p style="margin:6px 0 0;font:400 12px/1.6 ${SITE_THEME.font};color:${SITE_THEME.muted}">${escapeHtml(footer)}</p>` : ""}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function emailParagraphs(paragraphs: string[]): string {
  return paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font:400 15px/1.65 ${SITE_THEME.font};color:${SITE_THEME.body}">${escapeHtml(paragraph)}</p>`,
    )
    .join("");
}

function emailDetails(rows: ReadonlyArray<readonly [string, string]>): string {
  if (!rows.length) return "";
  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td width="130" style="width:130px;padding:9px 12px 9px 0;border-bottom:1px solid ${SITE_THEME.hairline};font:400 13px/1.5 ${SITE_THEME.font};color:${SITE_THEME.muted};vertical-align:top">${escapeHtml(label)}</td><td style="padding:9px 0;border-bottom:1px solid ${SITE_THEME.hairline};font:400 13px/1.5 ${SITE_THEME.font};color:${SITE_THEME.ink};vertical-align:top">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:4px 0 20px">${body}</table>`;
}

function emailQuote(text: string, label?: string): string {
  return `<div style="margin:18px 0 0;padding:14px 16px;border-left:3px solid ${SITE_THEME.green};background:${SITE_THEME.tint}">${label ? `<div style="padding-bottom:6px;font:600 11px/1.4 ${SITE_THEME.font};color:${SITE_THEME.muted}">${escapeHtml(label)}</div>` : ""}<div style="font:400 14px/1.65 ${SITE_THEME.font};color:${SITE_THEME.body};white-space:pre-wrap;word-break:break-word">${escapeHtml(text)}</div></div>`;
}

function emailCode(code: string): string {
  return `<div style="margin:18px 0 20px;padding:16px;border:1px solid ${SITE_THEME.hairline};background:${SITE_THEME.tint};text-align:center"><span style="font:600 26px/1.3 ${SITE_THEME.mono};letter-spacing:6px;color:${SITE_THEME.green}">${escapeHtml(code)}</span></div>`;
}

function emailSignature(name: string): string {
  return `<p style="margin:22px 0 0;font:400 15px/1.65 ${SITE_THEME.font};color:${SITE_THEME.body}">Regards,<br><strong style="color:${SITE_THEME.ink}">${escapeHtml(name)}</strong></p>`;
}

function readyForReviewHtml(body: string, footerAddress = DEFAULT_SUPPORT_EMAIL): string {
  const firstLine = body.split("\n").find((line) => line.trim().length > 0) ?? "New submission";
  return emailShell({
    title: "New submission ready for review",
    preheader: firstLine.slice(0, 120),
    footerAddress,
    footer: "Sent by the OpenWorlds notification service.",
    body: [emailParagraphs(["A new submission arrived and is ready for review."]), emailQuote(body)].join(""),
  });
}

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
    // The reference keeps reply threads identifiable, so a reply sent from the
    // support inbox can be matched back to its ticket automatically.
    const subjectLine = `${args.reference ? `[${args.reference}] ` : ""}[OpenWorlds Support] ${args.subject || args.reasonLabel}`;

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

    const html = emailShell({
      title: "New support request",
      preheader: `${args.reasonLabel} — ${args.email}`,
      footerAddress: to,
      footer: "Reply to this email to answer the person who wrote in.",
      body: [
        emailDetails([
          ["Reference", args.reference || "(none)"],
          ["Topic", args.reasonLabel],
          ["Name", args.name || "(not provided)"],
          ["Email", args.email],
          ["Username", args.username || "(not provided)"],
          ["Subject", args.subject || "(not provided)"],
          ["Received", submittedTime],
        ]),
        emailQuote(args.message, "Message"),
      ].join(""),
    });

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

export async function sendBotEmail({
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
  footerAddress = DEFAULT_SUPPORT_EMAIL,
}: {
  title: string;
  greeting: string;
  paragraphs: string[];
  details?: ReadonlyArray<readonly [string, string]>;
  message?: string;
  signature: string;
  footer?: string;
  footerAddress?: string;
}) {
  return emailShell({
    title,
    preheader: paragraphs[0] ?? greeting,
    footerAddress,
    footer,
    body: [
      `<p style="margin:0 0 14px;font:600 15px/1.7 ${SITE_THEME.font};color:${SITE_THEME.ink}">${escapeHtml(greeting)}</p>`,
      emailParagraphs(paragraphs),
      details?.length ? emailDetails(details) : "",
      message ? emailQuote(message) : "",
      emailSignature(signature),
    ].join(""),
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
