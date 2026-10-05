/** The verified careers inbox that receives new applications. */
export const CAREERS_EMAIL = "careers@openworlds.dk";

import { getAuthUserId } from "@convex-dev/auth/server";
import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/** The verified support address that is allowed to administer the site. */
export const SUPPORT_EMAIL = "support@openworlds.dk";

/** Verified admin or invited staff account (support mailbox is bootstrap admin). */
export async function isAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  const user = await ctx.db.get(userId);
  if (!user || user.emailVerificationTime === undefined) return false;
  const isBootstrapAdmin = user.email?.trim().toLowerCase() === SUPPORT_EMAIL;
  return user.role === "admin" || isBootstrapAdmin || Boolean(user.department?.trim() || user.position?.trim());
}

/** Throws unless caller is a verified invited company account. */
export async function requireAdmin(ctx: MutationCtx): Promise<void> {
  if (!(await isAdmin(ctx))) throw new Error("Not authorized.");
}

/** Only admin-role accounts can manage company invitations and roles. */
export async function requireCompanyAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const bootstrapAdmin = user?.email?.trim().toLowerCase() === SUPPORT_EMAIL;
  if (!user || user.emailVerificationTime === undefined || (user.role !== "admin" && !bootstrapAdmin)) {
    throw new Error("Not authorized.");
  }
}

async function isCompanyAdmin(ctx: QueryCtx): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const bootstrapAdmin = user?.email?.trim().toLowerCase() === SUPPORT_EMAIL;
  return Boolean(user && user.emailVerificationTime !== undefined && (user.role === "admin" || bootstrapAdmin));
}

/**
 * Allowlisted check used by the OTP delivery action. It returns no account
 * details; only the bootstrap admin or explicitly invited addresses pass.
 */
export const isCompanyEmailAllowed = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();
    if (normalized === SUPPORT_EMAIL) return true;
    const invitation = await ctx.db
      .query("companyAccess")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    return Boolean(invitation);
  },
});

/** Admin-only company account roster. */
export const listCompanyAccess = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isCompanyAdmin(ctx))) return null;
    return await ctx.db.query("companyAccess").withIndex("by_email").collect();
  },
});

/** Invite or update a company email. This is not exposed as public sign-up. */
export const inviteCompanyAccount = mutation({
  args: {
    email: v.string(),
    department: v.string(),
    position: v.string(),
    publicBadge: v.union(v.literal("staff"), v.literal("dev")),
    accessLevel: v.union(v.literal("admin"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    await requireCompanyAdmin(ctx);
    const email = args.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid company email address.");
    }
    if (email === SUPPORT_EMAIL) {
      throw new Error("The bootstrap admin is managed separately and cannot be changed here.");
    }
    const department = args.department.trim();
    const position = args.position.trim();
    if (!department || department.length > 80) throw new Error("Department must be 1–80 characters.");
    if (!position || position.length > 100) throw new Error("Position must be 1–100 characters.");

    const existing = await ctx.db
      .query("companyAccess")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    const values = {
      email,
      department,
      position,
      publicBadge: args.publicBadge,
      accessLevel: args.accessLevel,
      invitedAt: Date.now(),
      invitedBy: (await getAuthUserId(ctx))!,
    };
    if (existing) await ctx.db.replace(existing._id, values);
    else await ctx.db.insert("companyAccess", values);

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (user && user.emailVerificationTime !== undefined) {
      await ctx.db.patch(user._id, {
        department,
        position,
        publicBadge: args.publicBadge,
        role: args.accessLevel === "admin" ? "admin" : "member",
        emailVerificationTime: Date.now(),
      });
    }
    return { ok: true };
  },
});

/** Admin-only: revoke a company invitation and remove any matching user role. */
export const revokeCompanyAccount = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    await requireCompanyAdmin(ctx);
    const normalized = email.trim().toLowerCase();
    if (normalized === SUPPORT_EMAIL) throw new Error("The bootstrap admin cannot be revoked here.");
    const invitation = await ctx.db
      .query("companyAccess")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique();
    if (invitation) await ctx.db.delete(invitation._id);
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalized))
      .first();
    if (user) {
      await ctx.db.patch(user._id, {
        emailVerificationTime: undefined,
        role: "user",
        department: undefined,
        position: undefined,
        publicBadge: undefined,
      });
    }
    return { ok: true };
  },
});
