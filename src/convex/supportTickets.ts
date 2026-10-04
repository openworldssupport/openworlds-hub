import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { supportReasonIds, supportReasonLabel } from "../lib/support";
import { isAdmin, requireAdmin } from "./admin";

/** Unambiguous alphabet (no 0/O/1/I/L) for human-readable ticket codes. */
const REFERENCE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** We aim to reply within this window. Until it passes, a ticket reads as "open". */
export const RESPONSE_WINDOW_MS = 72 * 60 * 60 * 1000; // 3 days
/** Tickets that go quiet for this long are closed automatically. */
export const AUTO_CLOSE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function generateReference(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) {
    code += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
  }
  return `OW-${code}`;
}

type TicketStatusInput = {
  status: string;
  submittedAt: number;
  respondedAt?: number;
  closedAt?: number;
};

/**
 * Derives the ticket's current status.
 *
 * The team replies by email from outside this system, so a real reply cannot be
 * detected here. Instead the status advances on a realistic timeline:
 *   open -> responded (once the reply window has elapsed) -> closed (after inactivity).
 * A team member can record an exact reply or close a ticket with the admin
 * mutations below, and those timestamps take priority over the timeline.
 */
export function effectiveStatus(ticket: TicketStatusInput, now = Date.now()): string {
  if (ticket.closedAt) return "closed";
  if (ticket.respondedAt) return "responded";

  const age = now - ticket.submittedAt;
  if (age >= AUTO_CLOSE_MS) return "closed";
  if (age >= RESPONSE_WINDOW_MS) return "responded";
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
  },
  handler: async (ctx, args) => {
    // Silently accept and discard bot submissions so automated scripts get no signal.
    if (args.honeypot && args.honeypot.trim() !== "") {
      return { reference: null };
    }

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

    const reference = generateReference();
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

/** Team-only: permanently delete a ticket. */
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
    return tickets.map((ticket) => ({ ...ticket, status: effectiveStatus(ticket) }));
  },
});
