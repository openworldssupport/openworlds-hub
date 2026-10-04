import { mutation, query, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { careerRoles } from "../lib/careers";
import { isAdmin, requireAdmin } from "./admin";

/** Verified careers inbox that receives every new application. */
const CAREERS_EMAIL = "careers@openworlds.dk";

/** Best-effort email of a new application to the careers mailbox. */
const SEND_CAREERS_NOTIFICATION = internalAction({
  args: {
    name: v.string(),
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
    const text = [
      "New career application",
      "",
      "Name: " + (args.name || "(not provided)"),
      "Email: " + args.roleSlug,
      "Role: " + args.roleTitle + " (" + args.roleSlug + ")",
      "Experience:",
      args.experience,
      "Motivation:",
      args.motivation,
      "First weeks:",
      args.roleApproach,
      "Collaboration:",
      args.collaboration,
      "Availability:",
      args.availability,
      "Work samples:",
      args.portfolio || "(none)",
      "Application submitted for review.",
    ].join("\n");

    const html = [
      "<h2>New career application</h2>",
      "<p><strong>Name:</strong> " + escapeHtml(args.name || "(not provided)") + "</p>",
      "<p><strong>Role:</strong> " + escapeHtml(args.roleTitle) + " (" + escapeHtml(args.roleSlug) + ")</p>",
      "<p><strong>Experience:</strong></p><p>" + escapeHtml(args.experience) + "</p>",
      "<p><strong>Why this role:</strong></p><p>" + escapeHtml(args.motivation) + "</p>",
      "<p><strong>First weeks:</strong></p><p>" + escapeHtml(args.roleApproach) + "</p>",
      "<p><strong>Collaboration:</strong></p><p>" + escapeHtml(args.collaboration) + "</p>",
      "<p><strong>Availability:</strong></p><p>" + escapeHtml(args.availability) + "</p>",
      "<p><strong>Work samples:</strong>" + (args.portfolio ? "</p><p>" + escapeHtml(args.portfolio) + "</p>" : "") + "</p>",
    ].join("\n");

    const to = CAREERS_EMAIL;
    const from = "OpenWorlds Careers <noreply@openworlds.dk>";
    const subject = args.subject ?? "New career application";

    const vlyKey = process.env.VLY_INTEGRATION_KEY;

    if (vlyKey) {
      try {
        const response = await fetch("https://integrations.vly.ai/v1/email/send", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + vlyKey,
            "Content-Type": "application/json",
            "X-Vly-Version": "0.1.0",
          },
          body: JSON.stringify({
            to: [to],
            from: from,
            subject: subject,
            text: text,
            html: html,
          }),
        });

        if (!response.ok) {
          console.error("[careers] VLY rejected the notification email with status", response.status);
          return { sent: false, reason: "provider-error" };
        }

        const data = (await response.json().catch(() => ({}))) as { id?: string };
        return { sent: true, id: data.id ?? null };
      } catch (error) {
        console.error("[careers] Failed to send career notification email:", error);
        return { sent: false, reason: "network-error" };
      }
    }

    console.warn(
      "[careers] No VLY_INTEGRATION_KEY configured. Application was saved without emailing the careers inbox.",
    );
    return { sent: false, reason: "missing-provider" };
  },
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const submit = mutation({
  args: {
    roleSlug: v.string(),
    fullName: v.string(),
    email: v.string(),
    experience: v.string(),
    motivation: v.string(),
    roleApproach: v.string(),
    collaboration: v.string(),
    availability: v.string(),
    portfolio: v.string(),
    voluntaryConsent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const role = careerRoles.find((item) => item.slug === args.roleSlug);
    if (!role) throw new Error("This position could not be found.");
    if (!args.voluntaryConsent) throw new Error("Please confirm that this is a voluntary, unpaid role.");

    const fullName = args.fullName.trim();
    const email = args.email.trim().toLowerCase();
    const experience = args.experience.trim();
    const motivation = args.motivation.trim();
    const roleApproach = args.roleApproach.trim();
    const collaboration = args.collaboration.trim();
    const availability = args.availability.trim();
    const portfolio = args.portfolio.trim();

    if (fullName.length < 2 || fullName.length > 100) {
      throw new Error("Enter a name between 2 and 100 characters.");
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }
    if (experience.length < 20 || experience.length > 4000) {
      throw new Error("Please describe your relevant experience in 20-4,000 characters.");
    }
    if (motivation.length < 20 || motivation.length > 4000) {
      throw new Error("Tell us why you're interested (20-4,000 characters).");
    }
    if (roleApproach.length < 20 || roleApproach.length > 4000) {
      throw new Error("Describe how you would approach the role (20-4,000 characters).");
    }
    if (collaboration.length < 20 || collaboration.length > 4000) {
      throw new Error("Describe how you collaborate (20-4,000 characters).");
    }
    if (availability.length < 10 || availability.length > 1000) {
      throw new Error("Add a short note about your availability (10-1,000 characters).");
    }
    if (portfolio.length > 2000) {
      throw new Error("Keep portfolio links or samples under 2,000 characters.");
    }

    const now = Date.now();
    const recentApplications = await ctx.db
      .query("careerApplications")
      .withIndex("by_role_email_submitted_at", (q) => q.eq("roleSlug", role.slug).eq("email", email))
      .order("desc")
      .take(10);

    // Short burst guard: one application per role per email every 10 minutes.
    const cutoff = now - 10 * 60 * 1000;
    if (recentApplications.some((application) => application.submittedAt > cutoff)) {
      throw new Error("An application was recently submitted with this email. Please wait 10 minutes before trying again.");
    }

    // Sustained abuse guard: at most 5 applications per role per email per day.
    const dayCutoff = now - 24 * 60 * 60 * 1000;
    const lastDayCount = recentApplications.filter((application) => application.submittedAt > dayCutoff).length;
    if (lastDayCount >= 5) {
      throw new Error("Too many applications for this role from this email recently. Please try again tomorrow.");
    }

    const submittedAt = Date.now();
    const applicationId = await ctx.db.insert("careerApplications", {
      roleSlug: role.slug,
      roleTitle: role.title,
      fullName,
      email,
      experience,
      motivation,
      roleApproach,
      collaboration,
      availability,
      portfolio,
      voluntaryConsent: true,
      status: "new",
      submittedAt,
    });

    await ctx.scheduler.runAfter(0, internal.careerApplications.sendNotification, {
      name: fullName,
      roleSlug: role.slug,
      roleTitle: role.title,
      experience,
      motivation,
      roleApproach,
      collaboration,
      availability,
      portfolio,
      subject: "[OpenWorlds] New application: " + role.title,
    });

    return { applicationId, submittedAt };
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null;

    return await ctx.db.query("careerApplications").withIndex("by_submitted_at").order("desc").take(100);
  },
});

/** Team-only: set the review status of an application. */
export const setStatus = mutation({
  args: {
    applicationId: v.id("careerApplications"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const status = args.status.trim().toLowerCase();
    if (!["new", "reviewing", "shortlisted", "accepted", "declined", "archived"].includes(status)) {
      throw new Error("Choose a valid application status.");
    }
    await ctx.db.patch(args.applicationId, { status });
    return { ok: true };
  },
});

/** Team-only: permanently delete an application. */
export const remove = mutation({
  args: { applicationId: v.id("careerApplications") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.applicationId);
    return { ok: true };
  },
});
