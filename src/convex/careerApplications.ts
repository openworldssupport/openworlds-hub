import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { careerPositionAliases, careerRoles, normalizeCareerPosition } from "../lib/careers";
import { requireAdmin } from "./admin";
import { requireSiteAvailable } from "./siteStatus";

function careerFanoutText({
  type,
  roleTitle,
  name,
  email,
  portfolio,
  message,
  submittedAt,
}: {
  type: "application" | "question";
  roleTitle?: string;
  name?: string;
  email: string;
  portfolio?: string;
  message: string;
  submittedAt: number;
}) {
  const heading = type === "application" ? "New career application — admin alert" : "New careers question — admin alert";
  return [
    heading,
    "",
    `Position: ${roleTitle || "(not specified)"}`,
    `Name: ${name || "(not provided)"}`,
    `Email: ${email}`,
    `Portfolio: ${portfolio || "(none)"}`,
    `Submitted: ${new Date(submittedAt).toISOString()}`,
    "",
    "Message:",
    message,
  ].join("\n");
}

function careerFanoutHtml({
  type,
  roleTitle,
  name,
  email,
  portfolio,
  message,
  submittedAt,
}: {
  type: "application" | "question";
  roleTitle?: string;
  name?: string;
  email: string;
  portfolio?: string;
  message: string;
  submittedAt: number;
}) {
  const isApplication = type === "application";
  return [
    "<h2>" + (isApplication ? "New career application — admin alert" : "New careers question — admin alert") + "</h2>",
    "<p><strong>Position:</strong> " + escapeHtml(roleTitle || "(not specified)") + "</p>",
    "<p><strong>Name:</strong> " + escapeHtml(name || "(not provided)") + "</p>",
    "<p><strong>Email:</strong> " + escapeHtml(email) + "</p>",
    "<p><strong>Portfolio:</strong> " + escapeHtml(portfolio || "(none)") + "</p>",
    "<p><strong>Submitted:</strong> " + escapeHtml(new Date(submittedAt).toISOString()) + "</p>",
    "<hr />",
    "<p>" + escapeHtml(message).replace(/\n/g, "<br />") + "</p>",
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function careersReadyForReviewBody(type: "application" | "question") {
  return `A new ${type === "application" ? "career application" : "careers question"} has been submitted and is ready for review.`;
}

/** Public role availability only; no applicant or account details are returned. */
export const roleAvailability = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const overrides = await ctx.db.query("careerRoleAvailability").collect();
    const bySlug = new Map(overrides.map((item) => [item.roleSlug, item.isOpen]));
    const users = await ctx.db.query("users").collect();
    return careerRoles.map((role) => {
      const aliases = new Set(careerPositionAliases(role));
      const assignedCount = users.filter((user) => user.emailVerificationTime !== undefined && !user.isSiteBanned &&
        user.position && aliases.has(normalizeCareerPosition(user.position))).length;
      const isOpen = role.status !== "Filled" && assignedCount < role.capacity && (bySlug.get(role.slug) ?? true);
      return { slug: role.slug, title: role.title, department: role.department, isOpen, assignedCount, capacity: role.capacity };
    });
  },
});

/** Admin-only: open or close a listed contributor position. */
export const setRoleAvailability = mutation({
  args: { roleSlug: v.string(), isOpen: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const role = careerRoles.find((item) => item.slug === args.roleSlug);
    if (!role) throw new Error("Choose a valid contributor role.");

    const existing = await ctx.db
      .query("careerRoleAvailability")
      .withIndex("by_role_slug", (q) => q.eq("roleSlug", role.slug))
      .first();
    if (existing) await ctx.db.patch(existing._id, { isOpen: args.isOpen, updatedAt: Date.now() });
    else await ctx.db.insert("careerRoleAvailability", { roleSlug: role.slug, isOpen: args.isOpen, updatedAt: Date.now() });
    return { ok: true, isOpen: args.isOpen };

  },
});

/** Send applications and questions straight to Careers; submissions are never stored in Convex. */
export const submitEnquiry = mutation({
  args: {
    type: v.union(v.literal("application"), v.literal("question")),
    roleSlug: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.string(),
    portfolio: v.optional(v.string()),
    message: v.string(),
    honeypot: v.optional(v.string()),
    privacyAccepted: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireSiteAvailable(ctx);
    if (args.honeypot?.trim()) return { accepted: true };

    const name = args.name?.trim() ?? "";
    const email = args.email.trim().toLowerCase();
    const emailHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email))), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const message = args.message.trim();
    const portfolio = args.portfolio?.trim() ?? "";
    if (!args.privacyAccepted) throw new Error("Consent is required to email your enquiry to Careers.");
    if (name.length > 100) throw new Error("Keep your name under 100 characters.");
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
    if (message.length < 20 || message.length > 16000) throw new Error("Keep your message between 20 and 16,000 characters.");
    if (portfolio.length > 500 || (portfolio && !/^https:\/\//i.test(portfolio))) throw new Error("Use an HTTPS portfolio link under 500 characters.");

    let roleTitle: string | undefined;
    if (args.type === "application") {
      const role = careerRoles.find((item) => item.slug === args.roleSlug);
      if (!role || role.status === "Filled") throw new Error("Choose a current open position.");
      const currentStatus = await ctx.db.query("siteStatusSettings").withIndex("by_key", (q) => q.eq("key", "main")).unique();
      if (currentStatus && currentStatus.status !== "available") throw new Error("The website is temporarily unavailable for submissions.");
      const override = await ctx.db.query("careerRoleAvailability")
        .withIndex("by_role_slug", (q) => q.eq("roleSlug", role.slug))
        .first();
      const users = await ctx.db.query("users").collect();
      const aliases = new Set(careerPositionAliases(role));
      const assignedCount = users.filter((user) => user.emailVerificationTime !== undefined && !user.isSiteBanned && user.position && aliases.has(normalizeCareerPosition(user.position))).length;
      if ((override && !override.isOpen) || assignedCount >= role.capacity) throw new Error("This position is currently closed because it is filled or has reached capacity.");
      roleTitle = role.title;
    } else if (args.roleSlug) {
      throw new Error("Questions should not include a position selection.");
    }

    const now = Date.now();
    const rateLimit = await ctx.db.query("careerEnquiryLimits")
      .withIndex("by_email_hash", (q) => q.eq("emailHash", emailHash))
      .unique();
    if (rateLimit && rateLimit.lastSubmittedAt > now - 60_000) {
      throw new Error("A careers message was just sent from this email. Wait a minute before trying again.");
    }
    if (rateLimit) await ctx.db.patch(rateLimit._id, { lastSubmittedAt: now });
    else await ctx.db.insert("careerEnquiryLimits", { emailHash, lastSubmittedAt: now });

    await ctx.scheduler.runAfter(0, internal.supportEmail.sendCareerEnquiry, {
      type: args.type,
      roleTitle,
      name: name || undefined,
      email,
      portfolio: portfolio || undefined,
      message,
      submittedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.supportEmail.sendAdminReadyForReviewAlert, {
      channel: "careers",
      subject: `New OpenWorlds ${args.type === "application" ? "career application" : "careers question"} submitted — ready for review`,
      body: careersReadyForReviewBody(args.type),
      from: "careers",
    });
    return { accepted: true };
  },
});
