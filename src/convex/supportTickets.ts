import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { supportReasonIds, supportReasonLabel } from "../lib/support";

function reasonLabelLabel(reason: string): string {
  return supportReasonLabel(reason).toUpperCase();
}

function supportFanoutText({
  reason,
  subject,
  name,
  email,
  username,
  message,
  submittedAt,
  reference,
}: {
  reason: string;
  subject?: string;
  name?: string;
  email: string;
  username?: string;
  message: string;
  submittedAt: number;
  reference?: string;
}) {
  const channelTag = reasonLabelLabel(reason);
  return [
    "New OpenWorlds support ticket — admin alert",
    "",
    `Reason: ${channelTag}`,
    `Reference: ${reference || "(none)"}`,
    `Subject: ${subject || "(none)"}`,
    `Name: ${name || "(not provided)"}`,
    `Email: ${email}`,
    `OpenWorlds username: ${username || "(not provided)"}`,
    `Submitted: ${new Date(submittedAt).toISOString()}`,
    "",
    "Message:",
    message,
    "",
    "Reply to this email to respond to the contacting user.",
  ].join("\n");
}

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function supportReadyForReviewBody({
  reference,
  name,
  email,
  username,
  reason,
  subject,
  submittedAt,
}: {
  reference?: string;
  name?: string;
  email: string;
  username?: string;
  reason: string;
  subject?: string;
  submittedAt: number;
}) {
  return [
    "A new support ticket has been submitted and is ready for review.",
    "",
    `Reference: ${reference || "(none)"}`,
    `Reason: ${reasonLabelLabel(reason)}`,
    `Subject: ${subject || "(none)"}`,
    `Name: ${name || "(not provided)"}`,
    `Email: ${email}`,
    `OpenWorlds username: ${username || "(not provided)"}`,
    `Submitted: ${new Date(submittedAt).toISOString()}`,
  ].join("\n");
}

function supportFanoutHtml({
  reason,
  subject,
  name,
  email,
  username,
  message,
  submittedAt,
  reference,
}: {
  reason: string;
  subject?: string;
  name?: string;
  email: string;
  username?: string;
  message: string;
  submittedAt: number;
  reference?: string;
}) {
  const channelTag = reasonLabelLabel(reason);
  return [
    "<h2>New OpenWorlds support ticket — admin alert</h2>",
    "<p><strong>Reason:</strong> " + htmlEscape(channelTag) + "</p>",
    "<p><strong>Reference:</strong> " + htmlEscape(reference || "(none)") + "</p>",
    "<p><strong>Subject:</strong> " + htmlEscape(subject || "(none)") + "</p>",
    "<p><strong>Name:</strong> " + htmlEscape(name || "(not provided)") + "</p>",
    "<p><strong>Email:</strong> " + htmlEscape(email) + "</p>",
    "<p><strong>OpenWorlds username:</strong> " + htmlEscape(username || "(not provided)") + "</p>",
    "<p><strong>Submitted:</strong> " + htmlEscape(new Date(submittedAt).toISOString()) + "</p>",
    "<hr />",
    "<p>" + htmlEscape(message).replace(/\n/g, "<br />") + "</p>",
  ].join("\n");
}

import { isAdmin, requireAdmin } from "./admin";
import { recordSecurityViolation } from "./security";
import { requireSiteAvailable } from "./siteStatus";
/** Rejection message when the sender has not accepted the policies. */
export const SUPPORT_TERMS_CONSENT_MESSAGE =
  "You must accept our Privacy Policy and Terms of Service before opening a ticket.";

/** Generate a short, unambiguous ticket reference (same version as the UUID). */
function createId(): string {
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.substring(0, 16).toUpperCase();
}


type TicketStatusInput = {
  status: string;
  submittedAt: number;
  respondedAt?: number;
  closedAt?: number;
};

/** Status reflects actions actually recorded by a staff member. */
export function effectiveStatus(ticket: TicketStatusInput): string {
  if (ticket.closedAt) return "closed";
  if (ticket.respondedAt) return "responded";
  return ticket.status;
}

export const create = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.string(),
    username: v.optional(v.string()),
    reason: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
    // Hidden anti-bot field: real users never fill this in.
    honeypot: v.optional(v.string()),
    // Must be true: the sender agreed to the Privacy Policy and Terms of Service.
    privacyAndTermsAccepted: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireSiteAvailable(ctx);
    // Silently accept and discard bot submissions so automated scripts get no signal.
    if (args.honeypot && args.honeypot.trim() !== "") {
      return { reference: null };
    }

    const currentUserId = await getAuthUserId(ctx);
    const currentUser = currentUserId ? await ctx.db.get(currentUserId) : null;
    if (currentUser && "isSiteBanned" in currentUser && currentUser.isSiteBanned) throw new Error("This account is restricted from submitting tickets.");

    const email = args.email.trim().toLowerCase();
    const name = args.name?.trim() ?? "";
    const username = args.username?.trim() ?? "";
    const subject = args.subject?.trim() ?? "";
    const message = args.message.trim();
    const reason = args.reason.trim();

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address so we can reply.");
    }
    if (name.length > 100) throw new Error("Keep your name under 100 characters.");
    if (username.length > 50) throw new Error("Keep your OpenWorlds username under 50 characters.");
    if (subject.length > 200) throw new Error("Keep the subject under 200 characters.");
    if (!supportReasonIds.includes(reason)) throw new Error("Choose a reason for contacting support.");
    if (message.length < 20 || message.length > 5000) {
      throw new Error("Describe your request in 20–5,000 characters.");
    }
    if (!args.privacyAndTermsAccepted) {
      await recordSecurityViolation(ctx);
      throw new Error(SUPPORT_TERMS_CONSENT_MESSAGE);
    }

    const now = Date.now();
    const recentTickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_email_submitted_at", (q) => q.eq("email", email))
      .order("desc")
      .take(10);

    // Short burst guard: one ticket per email per minute.
    const cutoff = now - 60 * 1000;
    if (recentTickets.some((ticket) => ticket.submittedAt > cutoff)) {
      throw new Error("A ticket was just submitted with this email. Please wait a minute before trying again.");
    }

    // Sustained abuse guard: at most 5 tickets per email per hour.
    const hourCutoff = now - 60 * 60 * 1000;
    const lastHourCount = recentTickets.filter((ticket) => ticket.submittedAt > hourCutoff).length;
    if (lastHourCount >= 5) {
      throw new Error("Too many support tickets from this email recently. Please try again later.");
    }

    const reference = createId();
    const submittedAt = Date.now();
    await ctx.db.insert("supportTickets", {
      reference,
      name: name || undefined,
      email,
      username: username || undefined,
      reason,
      subject: subject || undefined,
      message,
      status: "open",
      submittedAt,
    });

    await ctx.scheduler.runAfter(0, internal.supportEmail.sendSupportNotification, {
      reference,
      name: name || undefined,
      email,
      username: username || undefined,
      reasonLabel: supportReasonLabel(reason),
      subject: subject || undefined,
      message,
      submittedAt,
    });
    await ctx.scheduler.runAfter(0, internal.adminNotifications.sendAdminReadyForReviewAlert, {
      channel: "support",
      subject: `New OpenWorlds support ticket submitted — ready for review`,
      body: supportReadyForReviewBody({ reference, name: name || undefined, email, username: username || undefined, reason, subject: subject || undefined, submittedAt }),
      replyTo: email,
      from: "support",
    });
    await ctx.scheduler.runAfter(0, internal.supportEmail.sendSupportAcknowledgement, {
      reference,
      name: name || undefined,
      email,
      reasonLabel: supportReasonLabel(reason),
      subject: subject || undefined,
      submittedAt,
    });

    return { reference };
  },
});

/**
 * Lets the person who opened a ticket check its status.
 * Requires BOTH the ticket reference and the exact email used to submit it, so
 * tickets cannot be enumerated. Returns only non-sensitive fields.
 */
export const lookup = query({
  args: {
    reference: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSiteAvailable(ctx);
    const reference = args.reference.trim().toUpperCase();
    const email = args.email.trim().toLowerCase();
    if (!reference || !email) return null;

    const ticket = await ctx.db
      .query("supportTickets")
      .withIndex("by_reference", (q) => q.eq("reference", reference))
      .first();

    // Return null for both "not found" and "email mismatch" so nothing is disclosed.
    if (!ticket || ticket.email !== email) return null;

    return {
      reference: ticket.reference ?? reference,
      reasonLabel: supportReasonLabel(ticket.reason),
      status: effectiveStatus(ticket),
      submittedAt: ticket.submittedAt,
    };
  },
});

/** Team-only: record that a reply was sent to the contacting user. */
/** Team-only: record that a reply was sent to the contacting user. */
export const markResponded = mutation({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.ticketId, { respondedAt: Date.now() });
    return { ok: true };
  },
});

/** Team-only: close a ticket. */
export const closeTicket = mutation({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.ticketId, { closedAt: Date.now() });
    return { ok: true };
  },
});

/** Team-only: reopen a ticket and clear any reply/close timestamps. */
export const reopenTicket = mutation({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.ticketId, { respondedAt: undefined, closedAt: undefined, status: "open" });
    return { ok: true };
  },
});

/** Admin-only: permanently delete a ticket. */
export const removeTicket = mutation({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.ticketId);
    return { ok: true };
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null;

    const tickets = await ctx.db.query("supportTickets").withIndex("by_submitted_at").order("desc").take(100);
    // Surface the derived status so the team sees the same state the user does.
    return tickets.map(({ email: _email, ...ticket }) => ({ ...ticket, status: effectiveStatus(ticket) }));
  },
});
