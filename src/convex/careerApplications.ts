import { mutation, query, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { SUPPORT_EMAIL } from "./admin";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { careerRoles } from "../lib/careers";
import { CAREERS_EMAIL, isAdmin, requireAdmin, requireCompanyAdmin } from "./admin";

/** Emails a submitted application to the careers inbox. */
export const sendNotification = internalAction({
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
    strategyScenario: v.string(),
    successMeasures: v.string(),
    decisionMaking: v.string(),
    stakeholderCommunication: v.string(),
    toolsAndStrengths: v.string(),
    weeklyHours: v.string(),
    timeZone: v.string(),
    availabilityStart: v.string(),
    linkedin: v.string(),
    subject: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const text = [
      "New career application",
      "",
      "Name: " + (args.name || "(not provided)"),
      "Email: " + args.email,
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
      "Strategy scenario:",
      args.strategyScenario ?? "(not provided)",
      "Measures of success:",
      args.successMeasures ?? "(not provided)",
      "Decision making:",
      args.decisionMaking ?? "(not provided)",
      "Stakeholder communication:",
      args.stakeholderCommunication ?? "(not provided)",
      "Tools and strengths:",
      args.toolsAndStrengths ?? "(not provided)",
      "Weekly hours: " + (args.weeklyHours ?? "(not provided)"),
      "Time zone: " + (args.timeZone ?? "(not provided)"),
      "Availability start: " + (args.availabilityStart ?? "(not provided)"),
      "LinkedIn: " + (args.linkedin || "(not provided)"),
      "Application submitted for review.",
    ].join("\n");

    const html = [
      "<h2>New career application</h2>",
      "<p><strong>Name:</strong> " + escapeHtml(args.name || "(not provided)") + "</p>",
      "<p><strong>Email:</strong> <a href=\"mailto:" + escapeHtml(args.email) + "\">" + escapeHtml(args.email) + "</a></p>",
      "<p><strong>Role:</strong> " + escapeHtml(args.roleTitle) + " (" + escapeHtml(args.roleSlug) + ")</p>",
      "<p><strong>Experience:</strong></p><p>" + escapeHtml(args.experience) + "</p>",
      "<p><strong>Why this role:</strong></p><p>" + escapeHtml(args.motivation) + "</p>",
      "<p><strong>First weeks:</strong></p><p>" + escapeHtml(args.roleApproach) + "</p>",
      "<p><strong>Collaboration:</strong></p><p>" + escapeHtml(args.collaboration) + "</p>",
      "<p><strong>Availability:</strong></p><p>" + escapeHtml(args.availability) + "</p>",
      "<p><strong>Work samples:</strong>" + (args.portfolio ? "</p><p>" + escapeHtml(args.portfolio) + "</p>" : "") + "</p>",
      "<p><strong>Strategy scenario:</strong></p><p>" + escapeHtml(args.strategyScenario ?? "(not provided)") + "</p>",
      "<p><strong>Measures of success:</strong></p><p>" + escapeHtml(args.successMeasures ?? "(not provided)") + "</p>",
      "<p><strong>Decision making:</strong></p><p>" + escapeHtml(args.decisionMaking ?? "(not provided)") + "</p>",
      "<p><strong>Stakeholder communication:</strong></p><p>" + escapeHtml(args.stakeholderCommunication ?? "(not provided)") + "</p>",
      "<p><strong>Tools and strengths:</strong></p><p>" + escapeHtml(args.toolsAndStrengths ?? "(not provided)") + "</p>",
      "<p><strong>Weekly hours:</strong> " + escapeHtml(args.weeklyHours ?? "(not provided)") + "</p>",
      "<p><strong>Time zone:</strong> " + escapeHtml(args.timeZone ?? "(not provided)") + "</p>",
      "<p><strong>Availability start:</strong> " + escapeHtml(args.availabilityStart ?? "(not provided)") + "</p>",
      "<p><strong>LinkedIn:</strong> " + escapeHtml(args.linkedin || "(not provided)") + "</p>",
    ].join("\n");

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
            to: [CAREERS_EMAIL],
            replyTo: args.email,
            subject,
            text,
            html,
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

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM ?? "OpenWorlds Careers <onboarding@resend.dev>",
            to: [CAREERS_EMAIL],
            reply_to: args.email,
            subject,
            text,
            html,
          }),
        });
        if (!response.ok) {
          console.error("[careers] Resend rejected the notification email with status", response.status);
          return { sent: false, reason: "provider-error" };
        }
        const data = (await response.json().catch(() => ({}))) as { id?: string };
        return { sent: true, id: data.id ?? null };
      } catch (error) {
        console.error("[careers] Failed to send application email:", error);
        return { sent: false, reason: "network-error" };
      }
    }

    console.warn(
      "[careers] No email provider configured. Add VLY_INTEGRATION_KEY or RESEND_API_KEY to email the careers inbox.",
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
    strategyScenario: v.string(),
    successMeasures: v.string(),
    decisionMaking: v.string(),
    stakeholderCommunication: v.string(),
    toolsAndStrengths: v.string(),
    weeklyHours: v.string(),
    timeZone: v.string(),
    availabilityStart: v.string(),
    linkedin: v.string(),
    voluntaryConsent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const role = careerRoles.find((item) => item.slug === args.roleSlug);
    if (!role) throw new Error("This position could not be found.");
    if (role.status === "Filled") throw new Error("This position is filled and is no longer accepting applications.");
    if (!args.voluntaryConsent) throw new Error("Please confirm that this is a voluntary, unpaid role.");

    const fullName = args.fullName.trim();
    const email = args.email.trim().toLowerCase();
    const experience = args.experience.trim();
    const motivation = args.motivation.trim();
    const roleApproach = args.roleApproach.trim();
    const collaboration = args.collaboration.trim();
    const availability = args.availability.trim();
    const portfolio = args.portfolio.trim();
    const strategyScenario = args.strategyScenario?.trim() ?? "";
    const successMeasures = args.successMeasures?.trim() ?? "";
    const decisionMaking = args.decisionMaking?.trim() ?? "";
    const stakeholderCommunication = args.stakeholderCommunication?.trim() ?? "";
    const toolsAndStrengths = args.toolsAndStrengths?.trim() ?? "";
    const weeklyHours = args.weeklyHours?.trim() ?? "";
    const timeZone = args.timeZone?.trim() ?? "";
    const availabilityStart = args.availabilityStart?.trim() ?? "";
    const linkedin = args.linkedin?.trim() ?? "";

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
    const detailedResponses: Array<[string, string, number, number]> = [
      ["strategy scenario", strategyScenario, 40, 4000],
      ["success measures", successMeasures, 20, 2000],
      ["decision-making approach", decisionMaking, 20, 2000],
      ["stakeholder communication", stakeholderCommunication, 20, 2000],
      ["tools and strengths", toolsAndStrengths, 20, 2000],
      ["weekly hours", weeklyHours, 1, 100],
      ["time zone", timeZone, 1, 100],
      ["availability start", availabilityStart, 1, 100],
      ["LinkedIn URL", linkedin, 0, 300],
    ];
    for (const [label, value, minimum, maximum] of detailedResponses) {
      if (value.length < minimum || value.length > maximum) throw new Error(`Check the ${label} field (${minimum}–${maximum} characters).`);
    }
    if (linkedin && !/^https:\/\/(www\.)?linkedin\.com\//i.test(linkedin)) {
      throw new Error("Enter a valid HTTPS LinkedIn profile URL.");
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
      strategyScenario,
      successMeasures,
      decisionMaking,
      stakeholderCommunication,
      toolsAndStrengths,
      weeklyHours,
      timeZone,
      availabilityStart,
      linkedin: linkedin || undefined,
      voluntaryConsent: true,
      status: "new",
      submittedAt,
    });

    await ctx.scheduler.runAfter(0, internal.careerApplications.sendNotification, {
      name: fullName,
      email,
      roleSlug: role.slug,
      roleTitle: role.title,
      experience,
      motivation,
      roleApproach,
      collaboration,
      availability,
      portfolio,
      strategyScenario,
      successMeasures,
      decisionMaking,
      stakeholderCommunication,
      toolsAndStrengths,
      weeklyHours,
      timeZone,
      availabilityStart,
      linkedin,
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
    const status = args.status.trim().toLowerCase();
    if (!["new", "reviewing", "shortlisted", "accepted", "declined", "archived"].includes(status)) {
      throw new Error("Choose a valid application status.");
    }
    await requireAdmin(ctx);
    if (status === "accepted") await requireCompanyAdmin(ctx);
    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found.");
    const email = application.email.trim().toLowerCase();
    if (status === "accepted") {
      const alreadyAccepted = application.status === "accepted";
      const role = careerRoles.find((item) => item.slug === application.roleSlug);
      if ((!role || role.status === "Filled") && !alreadyAccepted) {
        throw new Error("This application is not for a currently available contributor role.");
      }
      if (email === SUPPORT_EMAIL) throw new Error("The bootstrap admin cannot be replaced by an application approval.");
      const existingInvite = await ctx.db
        .query("companyAccess")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (existingInvite) {
        await ctx.db.patch(existingInvite._id, {
          department: "Company",
          position: "Approved staff",
          publicBadge: "staff",
          accessLevel: "staff",
        });
      } else {
        await ctx.db.insert("companyAccess", {
          email,
          department: "Company",
          position: "Approved staff",
          publicBadge: "staff",
          accessLevel: "staff",
          invitedAt: Date.now(),
          invitedBy: (await getAuthUserId(ctx))!,
        });
      }
      const existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .first();
      if (existingUser) {
        await ctx.db.patch(existingUser._id, {
          staffAccess: true,
          department: "Company",
          position: "Approved staff",
          publicBadge: "staff",
          role: "member",
        });
      } else if (!alreadyAccepted) {
        const [firstName = "Staff", ...restName] = application.fullName.trim().split(/\s+/);
        await ctx.db.insert("users", {
          email,
          name: [firstName, ...restName].join(" "),
          role: "member",
          staffAccess: true,
          department: "Company",
          position: "Approved staff",
          publicBadge: "staff",
        });
      }
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
