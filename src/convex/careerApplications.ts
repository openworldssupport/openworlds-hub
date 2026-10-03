import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { careerRoles } from "../lib/careers";

export const submit = mutation({
  args: {
    roleSlug: v.string(),
    fullName: v.string(),
    email: v.string(),
    experience: v.string(),
    motivation: v.string(),
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

    if (fullName.length < 2 || fullName.length > 100) throw new Error("Enter a name between 2 and 100 characters.");
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
    if (experience.length > 4000) throw new Error("Keep experience details under 4,000 characters.");
    if (motivation.length < 20 || motivation.length > 4000) throw new Error("Tell us why you’re interested (20–4,000 characters).");

    const recentApplications = await ctx.db
      .query("careerApplications")
      .withIndex("by_role_email_submitted_at", (q) => q.eq("roleSlug", role.slug).eq("email", email))
      .order("desc")
      .take(5);
    const cutoff = Date.now() - 10 * 60 * 1000;
    if (recentApplications.some((application) => application.submittedAt > cutoff)) {
      throw new Error("An application was recently submitted with this email. Please wait 10 minutes before trying again.");
    }

    return await ctx.db.insert("careerApplications", {
      roleSlug: role.slug,
      roleTitle: role.title,
      fullName,
      email,
      experience,
      motivation,
      voluntaryConsent: true,
      status: "new",
      submittedAt: Date.now(),
    });
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") return null;

    return await ctx.db.query("careerApplications").withIndex("by_submitted_at").order("desc").take(100);
  },
});
