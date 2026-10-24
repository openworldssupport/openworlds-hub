import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const CODE_TTL_MS = 10 * 60 * 1000;
const VERIFIED_TTL_MS = 15 * 60 * 1000;
const REQUEST_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;
const MAX_ATTEMPTS = 5;

function createCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0]! % 1_000_000).padStart(6, "0");
}

async function hashCode(code: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function requireRosterAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const admin = Boolean(user && user.emailVerificationTime !== undefined && !user.isSiteBanned &&
    (user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk"));
  if (!userId || !admin) throw new Error("Verified administrator access is required.");
  return userId;
}

export const rosterStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { isAdmin: false, verifiedUntil: 0, permissionVerifiedUntil: 0 };
    const user = await ctx.db.get(userId);
    const isAdmin = Boolean(user && user.emailVerificationTime !== undefined && !user.isSiteBanned &&
      (user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk"));
    if (!isAdmin) return { isAdmin: false, verifiedUntil: 0, permissionVerifiedUntil: 0 };
    const record = await ctx.db.query("adminRosterVerifications")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    return {
      isAdmin: true,
      verifiedUntil: record?.verifiedUntil ?? 0,
      permissionVerifiedUntil: record?.permissionVerifiedUntil ?? 0,
    };
  },
});

export const requestCode = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in as an administrator first.");
    const allowed = await ctx.runQuery(internal.adminRoster.canRequestCode, { userId });
    if (!allowed.allowed) throw new Error(allowed.reason);
    const code = createCode();
    await ctx.runMutation(internal.adminRoster.storeCode, {
      userId,
      codeHash: await hashCode(code),
      expiresAt: Date.now() + CODE_TTL_MS,
    });
    try {
      await ctx.runAction(internal.supportEmail.sendCareersRosterCode, { code });
    } catch {
      await ctx.runMutation(internal.adminRoster.clearCode, { userId });
      throw new Error("Could not send the verification code to the Careers inbox.");
    }
    return { ok: true };
  },
});

export const requestPermissionCode = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in as an administrator first.");
    const allowed = await ctx.runQuery(internal.adminRoster.canRequestPermissionCode, { userId });
    if (!allowed.allowed) throw new Error(allowed.reason);
    const code = createCode();
    await ctx.runMutation(internal.adminRoster.storePermissionCode, {
      userId,
      codeHash: await hashCode(code),
      expiresAt: Date.now() + CODE_TTL_MS,
    });
    try {
      await ctx.runAction(internal.supportEmail.sendAdminPermissionCode, { code });
    } catch {
      await ctx.runMutation(internal.adminRoster.clearPermissionCode, { userId });
      throw new Error("Could not send the verification code to the Support inbox.");
    }
    return { ok: true };
  },
});

export const verifyPermissionCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code: rawCode }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in as an administrator first.");
    await requireRosterAdmin(ctx);
    const record = await ctx.db.query("adminRosterVerifications")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    const code = rawCode.trim();
    if (!record?.permissionCodeHash || !record.permissionCodeExpiresAt || record.permissionCodeExpiresAt < Date.now()) {
      throw new Error("That code expired. Request a new one.");
    }
    if (code.length !== 6 || await hashCode(code) !== record.permissionCodeHash) {
      const attempts = (record.permissionCodeAttempts ?? 0) + 1;
      await ctx.db.patch(record._id, {
        permissionCodeAttempts: attempts,
        ...(attempts >= MAX_ATTEMPTS ? { permissionCodeHash: undefined, permissionCodeExpiresAt: undefined, permissionCodeAttempts: undefined } : {}),
      });
      return {
        ok: false as const,
        message: attempts >= MAX_ATTEMPTS ? "Too many incorrect codes. Request another code." : `Incorrect code. ${MAX_ATTEMPTS - attempts} attempts remain.`,
      };
    }
    const permissionVerifiedUntil = Date.now() + VERIFIED_TTL_MS;
    await ctx.db.patch(record._id, { permissionCodeHash: undefined, permissionCodeExpiresAt: undefined, permissionCodeAttempts: undefined, permissionVerifiedUntil });
    return { ok: true as const, permissionVerifiedUntil };
  },
});

export const verifyCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code: rawCode }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in as an administrator first.");
    await requireRosterAdmin(ctx);
    const record = await ctx.db.query("adminRosterVerifications")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    const code = rawCode.trim();
    if (!record?.codeHash || !record.codeExpiresAt || record.codeExpiresAt < Date.now()) {
      throw new Error("That code expired. Request a new one.");
    }
    if (!/^\d{6}$/.test(code) || await hashCode(code) !== record.codeHash) {
      const attempts = (record.codeAttempts ?? 0) + 1;
      await ctx.db.patch(record._id, {
        codeAttempts: attempts,
        ...(attempts >= MAX_ATTEMPTS ? { codeHash: undefined, codeExpiresAt: undefined, codeAttempts: undefined } : {}),
      });
      return {
        ok: false as const,
        message: attempts >= MAX_ATTEMPTS ? "Too many incorrect codes. Request another code." : `Incorrect code. ${MAX_ATTEMPTS - attempts} attempts remain.`,
      };
    }
    const verifiedUntil = Date.now() + VERIFIED_TTL_MS;
    await ctx.db.patch(record._id, { codeHash: undefined, codeExpiresAt: undefined, codeAttempts: undefined, verifiedUntil });
    return { ok: true as const, verifiedUntil };
  },
});

export const canRequestCode = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    const isAdmin = Boolean(user && user.emailVerificationTime !== undefined && !user.isSiteBanned &&
      (user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk"));
    if (!isAdmin) return { allowed: false, isAdmin: false, reason: "Verified administrator access is required." };
    const record = await ctx.db.query("adminRosterVerifications")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    const now = Date.now();
    const windowAt = record?.requestWindowAt ?? 0;
    const requestCount = windowAt > now - REQUEST_WINDOW_MS ? record?.requestCount ?? 0 : 0;
    if (requestCount >= MAX_REQUESTS) return { allowed: false, isAdmin: true, reason: "Too many code requests. Try again later." };
    return { allowed: true, isAdmin: true, reason: "" };
  },
});

export const canRequestPermissionCode = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    const isAdmin = Boolean(user && user.emailVerificationTime !== undefined && !user.isSiteBanned &&
      (user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk"));
    if (!isAdmin) return { allowed: false, reason: "Verified administrator access is required." };
    const record = await ctx.db.query("adminRosterVerifications")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    const now = Date.now();
    const windowAt = record?.requestWindowAt ?? 0;
    const requestCount = windowAt > now - REQUEST_WINDOW_MS ? record?.requestCount ?? 0 : 0;
    return requestCount >= MAX_REQUESTS
      ? { allowed: false, reason: "Too many code requests. Try again later." }
      : { allowed: true, reason: "" };
  },
});

export const storeCode = internalMutation({
  args: { userId: v.id("users"), codeHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const isAdmin = Boolean(user && user.emailVerificationTime !== undefined && !user.isSiteBanned &&
      (user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk"));
    if (!isAdmin) throw new Error("Verified administrator access is required.");
    const record = await ctx.db.query("adminRosterVerifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId)).unique();
    const now = Date.now();
    const windowAt = record?.requestWindowAt ?? 0;
    const requestCount = windowAt > now - REQUEST_WINDOW_MS ? record?.requestCount ?? 0 : 0;
    const values = {
      userId: args.userId,
      codeHash: args.codeHash,
      codeExpiresAt: args.expiresAt,
      codeAttempts: 0,
      requestWindowAt: requestCount === 0 ? now : windowAt,
      requestCount: requestCount + 1,
      verifiedUntil: record?.verifiedUntil,
    };
    if (record) await ctx.db.patch(record._id, values);
    else await ctx.db.insert("adminRosterVerifications", values);
  },
});

export const storePermissionCode = internalMutation({
  args: { userId: v.id("users"), codeHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const isAdmin = Boolean(user && user.emailVerificationTime !== undefined && !user.isSiteBanned &&
      (user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk"));
    if (!isAdmin) throw new Error("Verified administrator access is required.");
    const record = await ctx.db.query("adminRosterVerifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId)).unique();
    const now = Date.now();
    const windowAt = record?.requestWindowAt ?? 0;
    const requestCount = windowAt > now - REQUEST_WINDOW_MS ? record?.requestCount ?? 0 : 0;
    if (requestCount >= MAX_REQUESTS) throw new Error("Too many code requests. Try again later.");
    const values = {
      userId: args.userId,
      permissionCodeHash: args.codeHash,
      permissionCodeExpiresAt: args.expiresAt,
      permissionCodeAttempts: 0,
      requestWindowAt: requestCount === 0 ? now : windowAt,
      requestCount: requestCount + 1,
      permissionVerifiedUntil: record?.permissionVerifiedUntil,
    };
    if (record) await ctx.db.patch(record._id, values);
    else await ctx.db.insert("adminRosterVerifications", values);
  },
});

export const clearPermissionCode = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const record = await ctx.db.query("adminRosterVerifications")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (record) await ctx.db.patch(record._id, { permissionCodeHash: undefined, permissionCodeExpiresAt: undefined, permissionCodeAttempts: undefined });
  },
});

export const clearCode = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const record = await ctx.db.query("adminRosterVerifications")
      .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (record) await ctx.db.patch(record._id, { codeHash: undefined, codeExpiresAt: undefined, codeAttempts: undefined });
  },
});

export async function requirePermissionVerification(ctx: QueryCtx | MutationCtx) {
  const userId = await requireRosterAdmin(ctx);
  const record = await ctx.db.query("adminRosterVerifications")
    .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
  if (!record?.permissionVerifiedUntil || record.permissionVerifiedUntil < Date.now()) {
    throw new Error("Verify the code sent to support@openworlds.dk before changing staff or administrator access.");
  }
}

export async function requireRosterVerification(ctx: QueryCtx | MutationCtx) {
  const userId = await requireRosterAdmin(ctx);
  const record = await ctx.db.query("adminRosterVerifications")
    .withIndex("by_user", (q) => q.eq("userId", userId)).unique();
  if (!record?.verifiedUntil || record.verifiedUntil < Date.now()) {
    throw new Error("Verify the code sent to careers@openworlds.dk before viewing accounts.");
  }
}
