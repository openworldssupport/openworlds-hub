import { getAuthUserId, invalidateSessions, modifyAccountCredentials } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { linkVerifiedCreatorAccount } from "./users";
import { requireSiteAvailable } from "./siteStatus";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) throw new Error("Enter a valid recovery email address.");
  return email;
}

async function requirePlayer(ctx: MutationCtx) {
  await requireSiteAvailable(ctx);
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  if (!user || user.role !== "user" || user.isSiteBanned) throw new Error("Player account required.");
  return user;
}

function hashCode(code: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(code)).then((digest) =>
    Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""),
  );
}

function newCode() {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  return String(random[0]! % 1_000_000).padStart(6, "0");
}

export const recoveryStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!user || user.role !== "user" || user.isSiteBanned) throw new Error("Player account required.");
    return { recoveryEmail: user.recoveryEmail ?? null, pendingEmail: user.pendingRecoveryEmail ?? null, isVerified: Boolean(user.recoveryEmail && user.recoveryEmailVerifiedAt) };
  },
});

export const requestRecoveryEmailCode = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email: rawEmail }) => {
    const user = await requirePlayer(ctx);
    const email = normalizeEmail(rawEmail);
    if (email === user.email?.trim().toLowerCase()) {
      throw new Error("Use an email address different from your player sign-in email as your recovery email.");
    }
    const now = Date.now();
    const windowStart = user.recoveryCodeWindowAt ?? 0;
    const count = windowStart > now - RESEND_WINDOW_MS ? (user.recoveryCodeRequestCount ?? 0) : 0;
    if (count >= MAX_REQUESTS_PER_HOUR) throw new Error("Too many recovery code requests. Try again later.");
    const code = newCode();
    const previous = await ctx.db.query("playerRecoveryCodes").withIndex("by_user_created", (q) => q.eq("userId", user._id)).collect();
    await Promise.all(previous.map((row) => ctx.db.delete(row._id)));
    await ctx.db.insert("playerRecoveryCodes", { userId: user._id, email, codeHash: await hashCode(code), purpose: "verify-email", createdAt: now, expiresAt: now + CODE_TTL_MS, attempts: 0 });
    await ctx.db.patch(user._id, { pendingRecoveryEmail: email, recoveryCodeWindowAt: count === 0 ? now : windowStart, recoveryCodeRequestCount: count + 1 });
    await ctx.scheduler.runAfter(0, internal.supportEmail.sendPlayerRecoveryCode, { email, code });
    return { ok: true };
  },
});

export const verifyRecoveryEmail = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code: rawCode }) => {
    const user = await requirePlayer(ctx);
    const code = rawCode.trim();
    if (!/^\d{6}$/.test(code)) throw new Error("Enter the six-digit code from your email.");
    const row = await ctx.db.query("playerRecoveryCodes").withIndex("by_user_created", (q) => q.eq("userId", user._id)).order("desc").first();
    if (!row || row.purpose !== "verify-email" || row.expiresAt < Date.now()) throw new Error("That code has expired. Request another code.");
    if (await hashCode(code) !== row.codeHash) {
      const attempts = row.attempts + 1;
      await ctx.db.patch(row._id, { attempts });
      if (attempts >= MAX_ATTEMPTS) await ctx.db.delete(row._id);
      return {
        ok: false as const,
        message: attempts >= MAX_ATTEMPTS
          ? "Too many incorrect codes. Request another code."
          : `Incorrect code. ${MAX_ATTEMPTS - attempts} attempts remain.`,
      };
    }
    const prior = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", row.email)).first();
    if (prior && prior._id !== user._id) throw new Error("That email cannot be used as a recovery email.");
    await ctx.db.patch(user._id, { recoveryEmail: row.email, recoveryEmailVerifiedAt: Date.now(), pendingRecoveryEmail: undefined });
    await ctx.db.delete(row._id);
    await linkVerifiedCreatorAccount(ctx, user._id);
    return { ok: true as const };
  },
});

export const findResetAccount = internalQuery({
  args: { login: v.string() },
  handler: async (ctx, { login }) => {
    await requireSiteAvailable(ctx);
    const normalized = login.trim().toLowerCase();
    const user = await ctx.db.query("users").filter((q) => q.or(q.eq(q.field("email"), normalized), q.eq(q.field("playerLogin"), normalized))).first();
    if (!user || user.role !== "user" || !user.recoveryEmail || !user.recoveryEmailVerifiedAt) return null;
    return { userId: user._id, email: user.email!, recoveryEmail: user.recoveryEmail };
  },
});

export const reserveResetRequest = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "user" || !user.recoveryEmail || !user.recoveryEmailVerifiedAt) return { allowed: false };
    const now = Date.now();
    const windowStart = user.recoveryCodeWindowAt ?? 0;
    const count = windowStart > now - RESEND_WINDOW_MS ? (user.recoveryCodeRequestCount ?? 0) : 0;
    if (count >= MAX_REQUESTS_PER_HOUR) return { allowed: false };
    await ctx.db.patch(userId, { recoveryCodeWindowAt: count === 0 ? now : windowStart, recoveryCodeRequestCount: count + 1 });
    return { allowed: true };
  },
});

export const storeResetCode = internalMutation({
  args: { userId: v.id("users"), email: v.string(), codeHash: v.string(), now: v.number() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("playerRecoveryCodes").withIndex("by_user_created", (q) => q.eq("userId", args.userId)).collect();
    await Promise.all(rows.map((row) => ctx.db.delete(row._id)));
    await ctx.db.insert("playerRecoveryCodes", { userId: args.userId, email: args.email, codeHash: args.codeHash, purpose: "reset-password", createdAt: args.now, expiresAt: args.now + CODE_TTL_MS, attempts: 0 });
  },
});

export const consumePasswordResetCode = internalMutation({
  args: { login: v.string(), code: v.string() },
  handler: async (ctx, { login, code }) => {
    const normalizedLogin = login.trim().toLowerCase();
    const account = await ctx.db.query("users").filter((q) => q.or(q.eq(q.field("email"), normalizedLogin), q.eq(q.field("playerLogin"), normalizedLogin))).first();
    if (!account || account.role !== "user") throw new Error("Invalid or expired reset code.");
    const row = await ctx.db.query("playerRecoveryCodes").withIndex("by_user_created", (q) => q.eq("userId", account._id)).order("desc").first();
    if (!row || row.purpose !== "reset-password" || row.expiresAt < Date.now() || row.attempts >= MAX_ATTEMPTS) throw new Error("Invalid or expired reset code.");
    if (await hashCode(code.trim()) !== row.codeHash) {
      const attempts = row.attempts + 1;
      await ctx.db.patch(row._id, { attempts });
      if (attempts >= MAX_ATTEMPTS) await ctx.db.delete(row._id);
      return { ok: false as const };
    }
    await ctx.db.delete(row._id);
    return { ok: true as const, userId: account._id };
  },
});

export const beginPasswordReset = action({
  args: { login: v.string() },
  handler: async (ctx, { login }) => {
    const user = await ctx.runQuery(internal.playerRecovery.findResetAccount, { login: login.trim().toLowerCase() });
    if (!user) return { ok: true };
    const quota = await ctx.runMutation(internal.playerRecovery.reserveResetRequest, { userId: user.userId });
    if (!quota.allowed) return { ok: true };
    const code = newCode();
    await ctx.runMutation(internal.playerRecovery.storeResetCode, { userId: user.userId, email: user.recoveryEmail, codeHash: await hashCode(code), now: Date.now() });
    await ctx.runAction(internal.supportEmail.sendPlayerRecoveryCode, { email: user.recoveryEmail, code });
    return { ok: true };
  },
});

export const resetPassword = action({
  args: { login: v.string(), code: v.string(), newPassword: v.string() },
  handler: async (ctx, { login, code, newPassword }) => {
    if (newPassword.length < 12 || newPassword.length > 128) throw new Error("Use a password between 12 and 128 characters.");
    const user = await ctx.runQuery(internal.playerRecovery.findResetAccount, { login: login.trim().toLowerCase() });
    if (!user) throw new Error("Invalid or expired reset code.");
    const verified = await ctx.runMutation(internal.playerRecovery.consumePasswordResetCode, { login, code });
    if (!verified.ok || verified.userId !== user.userId) throw new Error("Invalid or expired reset code.");
    await modifyAccountCredentials(ctx, { provider: "player-password", account: { id: user.email, secret: newPassword } });
    await invalidateSessions(ctx, { userId: user.userId });
    return { ok: true };
  },
});
