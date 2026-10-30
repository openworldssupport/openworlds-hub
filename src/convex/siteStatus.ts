import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";

const CODE_TTL_MS = 10 * 60 * 1000;
const REQUEST_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;
const MAX_ATTEMPTS = 5;
const statusValidator = v.union(v.literal("available"), v.literal("unavailable"));

function digestCode(code: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(code)).then((digest) =>
    Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""),
  );
}

function createCode() {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  return String(random[0]! % 1_000_000).padStart(6, "0");
}

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

export const requestChangeCode = action({
  args: { status: statusValidator },
  handler: async (ctx, { status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in with a staff account first.");
    const allowed = await ctx.runQuery(internal.siteStatus.canRequestCode, { userId });
    if (!allowed.allowed) throw new Error(allowed.reason);
    if (!allowed.isStaff) throw new Error("Only authorized staff can request a site-status code.");
    if (status === "available" && !allowed.isAdmin) throw new Error("Only an administrator can bring the website back online.");
    const code = createCode();
    await ctx.runMutation(internal.siteStatus.storeRequestCode, {
      userId,
      status,
      codeHash: await digestCode(code),
      expiresAt: Date.now() + CODE_TTL_MS,
    });
    try {
      await ctx.runAction(internal.supportEmail.sendSiteStatusCode, { code });
    } catch {
      await ctx.runMutation(internal.siteStatus.clearRequestCode, { userId });
      throw new Error("Could not email the verification code. Please try again later.");
    }
    return { ok: true };
  },
});

export const confirmChange = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code: rawCode }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in with a staff account first.");
    const setting = await ctx.db.query("siteStatusSettings").withIndex("by_key", (q) => q.eq("key", "main")).unique();
    const code = rawCode.trim();
    const user = await ctx.db.get(userId);
    if (!user || !isAuthorizedStaff(user)) throw new Error("Only authorized staff can change the website status.");
    if (setting?.status !== "available" && setting?.pendingStatus === "available" && !isAuthorizedAdmin(user)) {
      throw new Error("Only an administrator can bring the website back online.");
    }
    if (!setting || setting.codeRequestedBy !== userId || !setting.codeHash || !setting.codeExpiresAt || setting.codeExpiresAt < Date.now()) {
      throw new Error("That verification code expired. Request another code.");
    }
    if (!/^\d{6}$/.test(code)) throw new Error("Enter the six-digit code from support@openworlds.dk.");
    if (await digestCode(code) !== setting.codeHash) {
      const attempts = (setting.codeAttempts ?? 0) + 1;
      await ctx.db.patch(setting._id, { codeAttempts: attempts, ...(attempts >= MAX_ATTEMPTS ? { codeHash: undefined, codeRequestedBy: undefined, codeExpiresAt: undefined, codeAttempts: undefined, pendingStatus: undefined } : {}) });
      return {
        ok: false as const,
        message: attempts >= MAX_ATTEMPTS
          ? "Too many incorrect codes. Request another code."
          : `Incorrect code. ${MAX_ATTEMPTS - attempts} attempts remain.`,
      };
    }
    const status = setting.pendingStatus === "available" ? "available" : "unavailable";
    await ctx.db.patch(setting._id, { status, pendingStatus: undefined, updatedAt: Date.now(), codeHash: undefined, codeRequestedBy: undefined, codeExpiresAt: undefined, codeAttempts: undefined });
    return { ok: true as const, status };
  },
});

export const canRequestCode = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || !isAuthorizedStaff(user)) return { allowed: false, isStaff: false, isAdmin: false, reason: "Only authorized staff can request a site-status code." };
    const setting = await ctx.db.query("siteStatusSettings").withIndex("by_key", (q) => q.eq("key", "main")).unique();
    const now = Date.now();
    const windowAt = setting?.codeWindowAt ?? 0;
    const requests = windowAt > now - REQUEST_WINDOW_MS ? setting?.codeRequestCount ?? 0 : 0;
    if (requests >= MAX_REQUESTS) return { allowed: false, isStaff: true, isAdmin: isAuthorizedAdmin(user), reason: "Too many code requests. Try again later." };
    return { allowed: true, isStaff: true, isAdmin: isAuthorizedAdmin(user), reason: "" };
  },
});

export const storeRequestCode = internalMutation({
  args: { userId: v.id("users"), status: statusValidator, codeHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    const setting = await ctx.db.query("siteStatusSettings").withIndex("by_key", (q) => q.eq("key", "main")).unique();
    const now = Date.now();
    const windowAt = setting?.codeWindowAt ?? 0;
    const requests = windowAt > now - REQUEST_WINDOW_MS ? setting?.codeRequestCount ?? 0 : 0;
    const values = {
      key: "main" as const,
      status: setting?.status ?? "available" as const,
      pendingStatus: args.status,
      updatedAt: setting?.updatedAt ?? now,
      codeHash: args.codeHash,
      codeRequestedBy: args.userId,
      codeExpiresAt: args.expiresAt,
      codeAttempts: 0,
      codeWindowAt: requests === 0 ? now : windowAt,
      codeRequestCount: requests + 1,
    };
    if (setting) await ctx.db.patch(setting._id, values);
    else await ctx.db.insert("siteStatusSettings", values);
  },
});

export const clearRequestCode = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const setting = await ctx.db.query("siteStatusSettings").withIndex("by_key", (q) => q.eq("key", "main")).unique();
    if (setting?.codeRequestedBy === userId) {
      await ctx.db.patch(setting._id, { codeHash: undefined, codeRequestedBy: undefined, codeExpiresAt: undefined, codeAttempts: undefined, pendingStatus: undefined });
    }
  },
});
