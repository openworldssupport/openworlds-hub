import { getAuthUserId } from "@convex-dev/auth/server";
import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requirePermissionVerification, requireRosterVerification } from "./adminRoster";

/** The careers inbox for direct, email-only enquiries. */
export const CAREERS_EMAIL = "careers@openworlds.dk";

/** The verified support address that is allowed to administer the site. */
export const SUPPORT_EMAIL = "support@openworlds.dk";

/** Verified company administrator (the support mailbox is the bootstrap admin). */
export async function isAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  return await isCompanyAdmin(ctx);
}

/** Throws unless caller is a verified company administrator. */
export async function requireAdmin(ctx: MutationCtx): Promise<void> {
  if (!(await isCompanyAdmin(ctx))) throw new Error("Not authorized.");
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

async function isCompanyAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const bootstrapAdmin = user?.email?.trim().toLowerCase() === SUPPORT_EMAIL;
  return Boolean(user && user.emailVerificationTime !== undefined && (user.role === "admin" || bootstrapAdmin));
}

/**
 * Allowlisted check used by the OTP delivery action. It returns no account
 * details; only the bootstrap admin, an invited address, or assigned staff passes.
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
    if (invitation) return true;
    const assignedStaff = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalized))
      .first();
    return Boolean(assignedStaff?.role === "admin" || (assignedStaff?.emailVerificationTime !== undefined && (assignedStaff.staffAccess || assignedStaff.department?.trim() || assignedStaff.position?.trim())));
  },
});

/** Admin-only company account roster. */
export const listCompanyAccess = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isCompanyAdmin(ctx))) return null;
    await requireRosterVerification(ctx);
    const accounts = await ctx.db.query("companyAccess").withIndex("by_email").collect();
    return accounts.map(({ _id, email, department, position, publicBadge, accessLevel, memberStatus }) => ({
      _id,
      department,
      position,
      publicBadge,
      accessLevel,
      memberStatus: memberStatus ?? null,
      email,
    }));
  },
});

/** Invite or update a company email. This is not exposed as public sign-up. */
export const inviteCompanyAccount = mutation({
  args: {
    email: v.string(),
    department: v.string(),
    position: v.string(),
    publicBadge: v.union(v.literal("staff"), v.literal("dev")),
    accessLevel: v.union(v.literal("staff"), v.literal("admin")),
    memberStatus: v.optional(v.union(v.literal("none"), v.literal("volunteer-thank-you"))),
  },
  handler: async (ctx, args) => {
    await requireCompanyAdmin(ctx);
    await requirePermissionVerification(ctx);
    const email = args.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid company email address.");
    }
    if (email === SUPPORT_EMAIL) {
      throw new Error("The bootstrap admin is managed separately and cannot be changed here.");
    }
    const existingUser = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email)).first();
    if (existingUser?.role === "admin" && args.accessLevel !== "admin") throw new Error("Existing admin accounts must be changed from the account directory.");
    const department = args.department.trim();
    const position = args.position.trim();
    if (!department || department.length > 80) throw new Error("Department must be 1–80 characters.");
    if (!position || position.length > 100) throw new Error("Position must be 1–100 characters.");

    const existing = await ctx.db
      .query("companyAccess")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    const values: {
      email: string;
      department: string;
      position: string;
      publicBadge: "staff" | "dev";
      accessLevel: "staff" | "admin";
      memberStatus?: "volunteer-thank-you";
      invitedAt: number;
      invitedBy: NonNullable<Awaited<ReturnType<typeof getAuthUserId>>>;
    } = {
      email,
      department,
      position,
      publicBadge: args.publicBadge,
      accessLevel: args.accessLevel,
      ...(args.memberStatus === "volunteer-thank-you" ? { memberStatus: "volunteer-thank-you" as const } : {}),
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
        staffAccess: true,
        memberStatus: args.memberStatus === "volunteer-thank-you" ? "volunteer-thank-you" : undefined,
        isSiteBanned: undefined,
        siteBanReason: undefined,
        siteBannedAt: undefined,
        securityViolationCount: 0,
        emailVerificationTime: Date.now(),
      });
    }
    return { ok: true };
  },
});

/** Admin-only: revoke a company invitation and remove any matching user role. */
export const revokeCompanyAccount = mutation({
  args: { accountId: v.id("companyAccess") },
  handler: async (ctx, { accountId }) => {
    await requireCompanyAdmin(ctx);
    await requirePermissionVerification(ctx);
    const invitation = await ctx.db.get(accountId);
    if (!invitation) return { ok: true };
    const normalized = invitation.email.trim().toLowerCase();
    if (normalized === SUPPORT_EMAIL) throw new Error("The bootstrap admin cannot be revoked here.");
    const existingUser = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", normalized)).first();
    if (existingUser?.role === "admin") throw new Error("Admin accounts cannot be revoked through staff invitations.");
    await ctx.db.delete(accountId);
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
        staffAccess: undefined,
        memberStatus: undefined,
      });
    }
    return { ok: true };
  },
});
