import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { supportReasonIds, supportReasonLabel } from "../lib/support";

export const create = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.string(),
    username: v.optional(v.string()),
    reason: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
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

    const submittedAt = Date.now();
    const ticketId = await ctx.db.insert("supportTickets", {
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
      name: name || undefined,
      email,
      username: username || undefined,
      reasonLabel: supportReasonLabel(reason),
      subject: subject || undefined,
      message,
      submittedAt,
    });

    return { ticketId };
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const isVerifiedSupportAdmin =
      user?.email?.trim().toLowerCase() === "support@openworlds.dk" &&
      user.emailVerificationTime !== undefined;
    if (user?.role !== "admin" && !isVerifiedSupportAdmin) return null;

    return await ctx.db.query("supportTickets").withIndex("by_submitted_at").order("desc").take(100);
  },
});
