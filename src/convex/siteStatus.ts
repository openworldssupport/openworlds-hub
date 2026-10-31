import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireStaffUnlock } from "./staffUnlock";

const statusValidator = v.union(v.literal("available"), v.literal("unavailable"));

function isAuthorizedAdmin(user: { email?: string; emailVerificationTime?: number; role?: string; isSiteBanned?: boolean }) {
  const bootstrapAdmin = user.email?.trim().toLowerCase() === "support@openworlds.dk";
  return Boolean(user.emailVerificationTime !== undefined && !user.isSiteBanned && (user.role === "admin" || bootstrapAdmin));
}

function isAuthorizedStaff(user: { email?: string; emailVerificationTime?: number; role?: string; staffAccess?: boolean; department?: string; position?: string; isSiteBanned?: boolean }) {
  return Boolean(user.emailVerificationTime !== undefined && !user.isSiteBanned &&
    (isAuthorizedAdmin(user) || user.staffAccess || user.department?.trim() || user.position?.trim()));
}

/** Reject public requests while offline; only a verified admin can continue. */
export async function requireSiteAvailableForUser(ctx: QueryCtx | MutationCtx, userId?: Id<"users"> | null) {
  const setting = await ctx.db.query("siteStatusSettings").withIndex("by_key", (q) => q.eq("key", "main")).unique();
  if (!setting || setting.status === "available") return;
  const user = userId ? await ctx.db.get(userId) : null;
  if (!user || !isAuthorizedAdmin(user)) throw new Error("The website is temporarily offline. Please try again later.");
}

export async function requireSiteAvailable(ctx: QueryCtx | MutationCtx) {
  await requireSiteAvailableForUser(ctx, await getAuthUserId(ctx));
}

export const requireAuthAccess = internalQuery({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, { userId }) => {
    await requireSiteAvailableForUser(ctx, userId);
    return true;
  },
});

export const publicStatus = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db.query("siteStatusSettings").withIndex("by_key", (q) => q.eq("key", "main")).unique();
    return !setting || setting.status === "available" ? "available" : "unavailable";
  },
});

export const staffStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!user || !isAuthorizedStaff(user)) return null;
    const setting = await ctx.db.query("siteStatusSettings").withIndex("by_key", (q) => q.eq("key", "main")).unique();
    return !setting || setting.status === "available" ? "available" : "unavailable";
  },
});

/** Staff can take the site offline; only an administrator can bring it back. */
export const setStatus = mutation({
  args: { status: statusValidator },
  handler: async (ctx, { status }) => {
    await requireStaffUnlock(ctx);
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!user || !isAuthorizedStaff(user)) throw new Error("Only authorized staff can change the website status.");
    if (status === "available" && !isAuthorizedAdmin(user)) {
      throw new Error("Only an administrator can bring the website back online.");
    }
    const setting = await ctx.db.query("siteStatusSettings").withIndex("by_key", (q) => q.eq("key", "main")).unique();
    const updatedAt = Date.now();
    if (setting) await ctx.db.patch(setting._id, { status, pendingStatus: undefined, updatedAt });
    else await ctx.db.insert("siteStatusSettings", { key: "main", status, updatedAt });
    return { ok: true as const, status };
  },
});
