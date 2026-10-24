import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { isAdmin, requireAdmin } from "./admin";
import { requirePermissionVerification } from "./adminRoster";

async function requireSecurityStaff(ctx: QueryCtx | MutationCtx, verifyAdminPermission = true) {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const isVerifiedStaff = Boolean(user && user.emailVerificationTime !== undefined && !user.isSiteBanned && (user.staffAccess || user.department?.trim() || user.position?.trim()));
  if (!user || (!isVerifiedStaff && !(await isAdmin(ctx)))) throw new Error("Not authorized.");
  if (verifyAdminPermission && await isAdmin(ctx)) await requirePermissionVerification(ctx);
}

export async function recordSecurityViolation(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return;
  const user = await ctx.db.get(userId);
  if (!user || user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk" || user.isSiteBanned) return;
  const now = Date.now();
  const count = user.lastSecurityViolationAt && now - user.lastSecurityViolationAt < 60 * 60 * 1000
    ? (user.securityViolationCount ?? 0) + 1
    : 1;
  await ctx.db.patch(userId, {
    securityViolationCount: count,
    lastSecurityViolationAt: now,
    ...(count >= 5 ? {
      isSiteBanned: true,
      siteBanReason: "Repeated unauthorized access attempts",
      siteBannedAt: now,
    } : {}),
  });
}

export const createNewsPostingCode = internalMutation({
  args: { userId: v.id("users"), codeHash: v.string() },
  handler: async (ctx, { userId, codeHash }) => {
    const user = await ctx.db.get(userId);
    const eligible = user && user.emailVerificationTime !== undefined && !user.isSiteBanned &&
      (user.staffAccess || user.department?.trim() || user.position?.trim());
    if (!eligible || !user) throw new Error("Not authorized.");
    const now = Date.now();
    const windowStart = user.newsPostingCodeWindowAt ?? 0;
    const requestCount = windowStart > now - 60 * 60 * 1000 ? (user.newsPostingCodeRequestCount ?? 0) : 0;
    if (requestCount >= 3) throw new Error("Code request limit reached. Try again later.");
    await ctx.db.patch(userId, {
      newsPostingCodeWindowAt: requestCount === 0 ? now : windowStart,
      newsPostingCodeRequestCount: requestCount + 1,
      newsPostingCodeRequestedAt: now,
    });
    const previous = await ctx.db.query("newsPostingCodes").withIndex("by_user_created", (q) => q.eq("userId", userId)).collect();
    await Promise.all(previous.map((entry) => ctx.db.delete(entry._id)));
    await ctx.db.insert("newsPostingCodes", { userId, codeHash, createdAt: now, expiresAt: now + 10 * 60 * 1000, attempts: 0 });
    return { email: user.email ?? "", name: user.nickname ?? user.name ?? "Company member" };
  },
});

export const clearNewsCode = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const entries = await ctx.db.query("newsPostingCodes").withIndex("by_user_created", (q) => q.eq("userId", userId)).collect();
    await Promise.all(entries.map((entry) => ctx.db.delete(entry._id)));
  },
});

export const newsPostingStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!userId || !user) return { eligible: false, isAdmin: false, verifiedUntil: 0, isBanned: false };
    const administrator = user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk";
    const latestCode = await ctx.db.query("newsPostingCodes").withIndex("by_user_created", (q) => q.eq("userId", userId)).order("desc").first();
    const eligible = user.emailVerificationTime !== undefined && !user.isSiteBanned &&
      (user.staffAccess || user.department?.trim() || user.position?.trim());
    return { eligible: Boolean(eligible), isAdmin: administrator, verifiedUntil: user.newsPostingVerifiedUntil ?? 0, isBanned: user.isSiteBanned === true, hasCode: Boolean(latestCode && latestCode.expiresAt >= Date.now()) };
  },
});

export const verifyNewsPostingCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!userId || !user || user.emailVerificationTime === undefined || user.isSiteBanned || !(user.staffAccess || user.department?.trim() || user.position?.trim())) throw new Error("Not authorized.");
    const entries = await ctx.db.query("newsPostingCodes").withIndex("by_user_created", (q) => q.eq("userId", userId)).order("desc").take(1);
    const entry = entries[0];
    if (!entry || entry.expiresAt < Date.now()) return { verified: false, banned: false };
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(args.code.trim()));
    const codeHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    if (codeHash !== entry.codeHash) {
      const attempts = entry.attempts + 1;
      await ctx.db.patch(entry._id, { attempts });
      if (attempts >= 5) {
        await ctx.db.patch(userId, {
          isSiteBanned: true,
          siteBanReason: "Repeated failed news verification attempts",
          siteBannedAt: Date.now(),
        });
        const outstanding = await ctx.db.query("newsPostingCodes").withIndex("by_user_created", (q) => q.eq("userId", userId)).collect();
        await Promise.all(outstanding.map((codeEntry) => ctx.db.delete(codeEntry._id)));
        return { verified: false, banned: true };
      }
      return { verified: false, banned: false, remainingAttempts: 5 - attempts };
    }
    await ctx.db.patch(userId, { newsPostingVerifiedUntil: Date.now() + 60 * 60 * 1000 });
    await ctx.db.delete(entry._id);
    return { verified: true, banned: false, remainingAttempts: 0 };
  },
});

export const accessStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { signedIn: false, isAdmin: false, isBanned: false, reason: null };
    const user = await ctx.db.get(userId);
    if (!user) return { signedIn: false, isAdmin: false, isBanned: false, reason: null };
    const isAdmin = user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk";
    return {
      signedIn: true,
      isAdmin,
      isBanned: !isAdmin && user.isSiteBanned === true,
      reason: !isAdmin && user.isSiteBanned ? user.siteBanReason ?? null : null,
      hasPendingAppeal: (await ctx.db.query("securityAppeals").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").take(10)).some((appeal) => appeal.status === "pending"),
    };
  },
});

export const submitAppeal = mutation({
  args: { message: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to submit an appeal.");
    const user = await ctx.db.get(userId);
    if (!user || user.isSiteBanned !== true) throw new Error("This account does not have an active site ban.");
    const message = args.message.trim();
    if (message.length < 20 || message.length > 3000) throw new Error("Appeals must be 20–3,000 characters.");
    const pending = await ctx.db.query("securityAppeals").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").take(10);
    if (pending.some((appeal) => appeal.status === "pending")) throw new Error("You already have an appeal waiting for review.");
    await ctx.db.insert("securityAppeals", {
      userId,
      email: user.email ?? "",
      message,
      status: "pending",
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

export const listBansAndAppeals = query({
  args: {},
  handler: async (ctx) => {
    await requireSecurityStaff(ctx, false);
    const users = await ctx.db.query("users").filter((q) => q.eq(q.field("isSiteBanned"), true)).take(500);
    const appeals = await ctx.db.query("securityAppeals").withIndex("by_status_created", (q) => q.eq("status", "pending")).order("desc").take(100);
    return {
      bans: users.map((user) => ({
        userId: user._id,
        name: user.nickname ?? user.name ?? "Company account",
        email: user.email ?? "",
        reason: user.siteBanReason ?? "Automated security protection",
        bannedAt: user.siteBannedAt ?? 0,
      })),
      appeals: await Promise.all(appeals.map(async (appeal) => {
        const user = await ctx.db.get(appeal.userId);
        return { ...appeal, name: user?.nickname ?? user?.name ?? "Account appeal" };
      })),
    };
  },
});

export const setBan = mutation({
  args: { userId: v.id("users"), banned: v.boolean(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireSecurityStaff(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Account not found.");
    if (user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk") {
      throw new Error("Admin accounts cannot be banned through this control.");
    }
    const reason = args.reason?.trim();
    if (reason && reason.length > 300) throw new Error("Keep the reason under 300 characters.");
    await ctx.db.patch(args.userId, args.banned
      ? { isSiteBanned: true, siteBanReason: reason || "Staff review", siteBannedAt: Date.now() }
      : { isSiteBanned: undefined, siteBanReason: undefined, siteBannedAt: undefined, securityViolationCount: 0 });
    return { ok: true };
  },
});

export const reviewAppeal = mutation({
  args: { appealId: v.id("securityAppeals"), decision: v.union(v.literal("approved"), v.literal("declined")) },
  handler: async (ctx, args) => {
    await requireSecurityStaff(ctx);
    const appeal = await ctx.db.get(args.appealId);
    if (!appeal || appeal.status !== "pending") throw new Error("This appeal is no longer awaiting review.");
    const user = await ctx.db.get(appeal.userId);
    await ctx.db.patch(appeal._id, { status: args.decision, reviewedAt: Date.now(), reviewedBy: await getAuthUserId(ctx) ?? undefined });
    if (args.decision === "approved" && user) {
      await ctx.db.patch(user._id, { isSiteBanned: undefined, siteBanReason: undefined, siteBannedAt: undefined, securityViolationCount: 0 });
      const remainingAppeals = await ctx.db.query("securityAppeals").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
      const reviewerId = await getAuthUserId(ctx);
      await Promise.all(remainingAppeals.filter((item) => item.status === "pending" && item._id !== appeal._id).map((item) => ctx.db.patch(item._id, { status: "approved", reviewedAt: Date.now(), reviewedBy: reviewerId ?? undefined })));
    }
    return { ok: true };
  },
});
