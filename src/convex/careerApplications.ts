import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { careerRoles } from "../lib/careers";
import { requireAdmin } from "./admin";

/** Public role availability only; no applicant or account details are returned. */
export const roleAvailability = query({
  args: {},
  handler: async (ctx) => {
    const overrides = await ctx.db.query("careerRoleAvailability").collect();
    const bySlug = new Map(overrides.map((item) => [item.roleSlug, item.isOpen]));
    return careerRoles.map((role) => ({
      slug: role.slug,
      title: role.title,
      department: role.department,
      isOpen: bySlug.get(role.slug) ?? role.status !== "Filled",
    }));
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
    if (existing) {
      await ctx.db.patch(existing._id, { isOpen: args.isOpen, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("careerRoleAvailability", {
        roleSlug: role.slug,
        isOpen: args.isOpen,
        updatedAt: Date.now(),
      });
    }
    return { ok: true, isOpen: args.isOpen };
  },
});
