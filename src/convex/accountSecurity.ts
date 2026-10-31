import { getAuthSessionId, getAuthUserId, retrieveAccount, signInViaProvider } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireSiteAvailable } from "./siteStatus";
import { consumeSecondFactor, hashValue, matchingTotpCounter } from "./secondFactor";

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function encodeBase32(bytes: Uint8Array) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let i = 0; i < bits.length; i += 5) output += alphabet[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  return output;
}

const hash = hashValue;

export const hashToken = internalAction({
  args: { token: v.string() },
  handler: async (_ctx, { token }) => await hash(token),
});

export async function hashLoginChallenge(value: string) {
  return await hash(value);
}

function makeRecoveryCodes() {
  return Array.from({ length: 10 }, () => {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
    return `${value.slice(0, 8)}-${value.slice(8)}`;
  });
}

async function currentAccount(ctx: any) {
  await requireSiteAvailable(ctx);
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  if (!user || user.isAnonymous || user.isSiteBanned) throw new Error("Sign in to manage account security.");
  if (user.role === "user" && (!user.recoveryEmail || user.recoveryEmailVerifiedAt === undefined)) {
    throw new Error("Verify your recovery email before managing account security.");
  }
  return user;
}

export const status = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const userId = await getAuthUserId(ctx);
    const sessionId = await getAuthSessionId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!user || user.isAnonymous || user.isSiteBanned) return { signedIn: false, enabled: false, verified: false };
    return {
      signedIn: true,
      enabled: user.twoFactorEnabled === true,
      verified: user.twoFactorEnabled !== true || user.twoFactorVerifiedSessionId === sessionId,
      setupPending: Boolean(user.twoFactorPendingSecret),
      recoveryCodesRemaining: user.twoFactorRecoveryCodeHashes?.length ?? 0,
    };
  },
});

export const updateProfile = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name: rawName }) => {
    const user = await currentAccount(ctx);
    const name = rawName.trim();
    const maxLength = user.role === "user" ? 32 : 40;
    if (name.length < 2 || name.length > maxLength || /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(name)) throw new Error(`Choose a display name between 2 and ${maxLength} characters.`);
    await ctx.db.patch(user._id, user.role === "user" ? { name } : { nickname: name });
    return { name };
  },
});

export const beginSetup = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await currentAccount(ctx);
    if (user.twoFactorEnabled) throw new Error("Two-step verification is already enabled.");
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    const secret = encodeBase32(bytes);
    await ctx.db.patch(user._id, { twoFactorPendingSecret: secret });
    const label = encodeURIComponent(user.email?.trim().toLowerCase() || user.playerLogin || "OpenWorlds account");
    const issuer = encodeURIComponent("OpenWorlds");
    return { secret, uri: `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30` };
  },
});

export const confirmSetup = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await currentAccount(ctx);
    const secret = user.twoFactorPendingSecret;
    if (!secret) throw new Error("Start setup before confirming your authenticator app.");
    const now = Date.now();
    const windowAt = user.twoFactorAttemptWindowAt ?? 0;
    const attempts = windowAt > now - ATTEMPT_WINDOW_MS ? user.twoFactorAttemptCount ?? 0 : 0;
    if (attempts >= MAX_ATTEMPTS) throw new Error("Too many incorrect codes. Wait 10 minutes and try again.");
    const counter = await matchingTotpCounter(secret, code.trim());
    if (counter === null) {
      await ctx.db.patch(user._id, { twoFactorAttemptWindowAt: attempts === 0 ? now : windowAt, twoFactorAttemptCount: attempts + 1 });
      throw new Error(attempts + 1 >= MAX_ATTEMPTS ? "Too many incorrect codes. Wait 10 minutes and try again." : "That code is incorrect or expired. Try the current code from your authenticator app.");
    }
    const codes = makeRecoveryCodes();
    const sessionId = await getAuthSessionId(ctx);
    await ctx.db.patch(user._id, {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorPendingSecret: undefined,
      twoFactorVerifiedSessionId: sessionId ?? undefined,
      twoFactorLastCounter: counter,
      twoFactorRecoveryCodeHashes: await Promise.all(codes.map(hash)),
      twoFactorAttemptCount: 0,
      twoFactorAttemptWindowAt: undefined,
    });
    return { ok: true, recoveryCodes: codes };
  },
});

export const verifyCurrentSession = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await currentAccount(ctx);
    if (!user.twoFactorEnabled || !user.twoFactorSecret) throw new Error("Two-step verification is not enabled.");
    const result = await consumeSecondFactor(ctx, user, code);
    if (!result.ok) return result;
    const sessionId = await getAuthSessionId(ctx);
    if (!sessionId) throw new Error("Sign in again before verifying your code.");
    await ctx.db.patch(user._id, { twoFactorVerifiedSessionId: sessionId });
    return { ok: true as const, usedRecoveryCode: result.usedRecoveryCode };
  },
});

export const getStaffOtpToken = internalQuery({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, { email: rawEmail, code }) => {
    const email = rawEmail.trim().toLowerCase();
    const expectedHash = await hash(code.trim());
    const verification = await ctx.db.query("authVerificationCodes").withIndex("code", (q) => q.eq("code", expectedHash)).unique();
    if (!verification || verification.emailVerified?.trim().toLowerCase() !== email || verification.expirationTime < Date.now()) return false;
    const account = await ctx.db.get(verification.accountId);
    return account?.provider === "email-otp" && account.providerAccountId === email;
  },
});

export const consumeStaffOtpCode = internalMutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, { email: rawEmail, code }) => {
    const email = rawEmail.trim().toLowerCase();
    const expectedHash = await hash(code.trim());
    const verification = await ctx.db.query("authVerificationCodes").withIndex("code", (q) => q.eq("code", expectedHash)).unique();
    if (!verification || verification.emailVerified?.trim().toLowerCase() !== email || verification.expirationTime < Date.now()) return false;
    const account = await ctx.db.get(verification.accountId);
    if (account?.provider !== "email-otp" || account.providerAccountId !== email) return false;
    await ctx.db.delete(verification._id);
    return true;
  },
});

export const completeStaffSignIn = internalAction({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, { email: rawEmail, code }) => {
    const email = rawEmail.trim().toLowerCase();
    const account = await ctx.runQuery(internal.accountSecurity.staffAccountForSignIn, { email });
    if (!account) throw new Error("Staff sign-in verification failed.");
    if (account.twoFactorEnabled) {
      const user = await ctx.runQuery(internal.accountSecurity.staffTwoFactorApproved, { userId: account.userId });
      if (!user) throw new Error("Two-step verification is required to finish signing in.");
    }
    const { emailOtp } = await import("./auth/emailOtp");
    const signInResult = await signInViaProvider(ctx as never, emailOtp as Parameters<typeof signInViaProvider>[1], { params: { email, code: code.trim() } });
    if (!signInResult) throw new Error("The sign-in code could not be verified. Request a new code.");
    return { ok: true };
  },
});

export const staffTwoFactorApproved = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return Boolean(user && user.twoFactorEnabled && typeof user.twoFactorLoginVerifiedUntil === "number" && user.twoFactorLoginVerifiedUntil > Date.now());
  },
});

export const staffAccountForSignIn = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();
    const user = await ctx.db.query("users").filter((q) => q.eq(q.field("email"), normalized)).first();
    if (!user || user.role === "user" || user.isAnonymous || user.isSiteBanned) return null;
    const invitation = await ctx.db.query("companyAccess").withIndex("by_email", (q) => q.eq("email", normalized)).first();
    const assigned = Boolean(user.staffAccess || user.department?.trim() || user.position?.trim());
    if (normalized !== "support@openworlds.dk" && !invitation && !assigned) return null;
    return { userId: user._id, twoFactorEnabled: user.twoFactorEnabled === true };
  },
});

export const authorizeStaffTwoFactor = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.role === "user" || user.isAnonymous || user.isSiteBanned || !user.twoFactorEnabled || !user.twoFactorSecret) throw new Error("Staff two-step verification failed.");
    await ctx.db.patch(userId, { twoFactorLoginVerifiedUntil: Date.now() + 90 * 1000 });
    return true;
  },
});

export const prepareStaffSignIn = action({
  args: { email: v.string(), emailCode: v.string(), authenticatorCode: v.optional(v.string()) },
  handler: async (ctx, { email: rawEmail, emailCode, authenticatorCode }) => {
    const email = rawEmail.trim().toLowerCase();
    const account = await ctx.runQuery(internal.accountSecurity.staffAccountForSignIn, { email });
    if (!account) throw new Error("Staff sign-in verification failed.");
    const validOtp = await ctx.runQuery(internal.accountSecurity.getStaffOtpToken, { email, code: emailCode.trim() });
    if (!validOtp) throw new Error("That email code is incorrect or expired.");
    if (account.twoFactorEnabled && !authenticatorCode?.trim()) return { needsTwoFactor: true };
    if (account.twoFactorEnabled) {
      const result = await ctx.runMutation(internal.accountSecurity.consumeStaffSignInCode, {
        userId: account.userId,
        code: authenticatorCode!.trim().toUpperCase(),
      });
      if (!result.ok) throw new Error(result.message);
    }
    if (account.twoFactorEnabled) await ctx.runMutation(internal.accountSecurity.authorizeStaffTwoFactor, { userId: account.userId });
    return { needsTwoFactor: false };
  },
});

export const consumeStaffSignInCode = internalMutation({
  args: { userId: v.id("users"), code: v.string() },
  handler: async (ctx, { userId, code }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.role === "user" || user.isAnonymous || user.isSiteBanned || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return { ok: false as const, message: "Staff sign-in verification failed." };
    }
    const result = await consumeSecondFactor(ctx, user, code);
    if (!result.ok) return result;
    return { ok: true as const };
  },
});

export const passwordSignIn = action({
  args: { login: v.string(), password: v.string() },
  handler: async (ctx, { login: rawLogin, password }) => {
    await ctx.runQuery(internal.siteStatus.requireAuthAccess, {});
    const login = rawLogin.trim().toLowerCase();
    const accountId = /^[a-z0-9][a-z0-9._-]{2,23}$/.test(login) ? `${login}@players.openworlds.invalid` : login;
    let account;
    try { account = await retrieveAccount(ctx, { provider: "player-password", account: { id: accountId, secret: password } }); }
    catch { throw new Error("Username/email or password is incorrect."); }
    if (!account || account.user.role !== "user" || account.user.isSiteBanned) throw new Error("Username/email or password is incorrect.");
    const recoveryEmailVerified = Boolean(account.user.recoveryEmail && account.user.recoveryEmailVerifiedAt !== undefined);
    if (!account.user.twoFactorEnabled) return { required: false, recoveryEmailVerified };
    const random = new Uint8Array(32);
    crypto.getRandomValues(random);
    const token = Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("");
    await ctx.runMutation(internal.accountSecurity.createLoginChallenge, { userId: account.user._id, tokenHash: await hashLoginChallenge(token), expiresAt: Date.now() + 5 * 60 * 1000 });
    return { required: true, token, recoveryEmailVerified };
  },
});

export const completePasswordSignIn = action({
  args: { login: v.string(), token: v.string(), code: v.string() },
  handler: async (ctx, { login: rawLogin, token, code }) => {
    await ctx.runQuery(internal.siteStatus.requireAuthAccess, {});
    const login = rawLogin.trim().toLowerCase();
    const accountId = /^[a-z0-9][a-z0-9._-]{2,23}$/.test(login) ? `${login}@players.openworlds.invalid` : login;
    const account = await retrieveAccount(ctx, { provider: "player-password", account: { id: accountId } }).catch(() => null);
    if (!account || account.user.role !== "user" || account.user.isSiteBanned || !account.user.twoFactorEnabled) throw new Error("Sign-in verification failed.");
    if (!account.user.recoveryEmail || account.user.recoveryEmailVerifiedAt === undefined) {
      throw new Error("Verify a recovery email before signing in to your player account.");
    }
    const tokenHash = await hashLoginChallenge(token);
    const challenge = await ctx.runMutation(internal.accountSecurity.consumeLoginChallenge, { userId: account.user._id, tokenHash, code });
    if (!challenge.ok) throw new Error(challenge.message);
    return { ok: true };
  },
});

export const createLoginChallenge = internalMutation({
  args: { userId: v.id("users"), tokenHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, { userId, tokenHash, expiresAt }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "user" || user.isSiteBanned || !user.twoFactorEnabled) throw new Error("Sign-in verification failed.");
    const existing = await ctx.db.query("twoFactorLoginChallenges")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .collect();
    for (const challenge of existing) await ctx.db.delete(challenge._id);
    await ctx.db.insert("twoFactorLoginChallenges", { userId, tokenHash, createdAt: Date.now(), expiresAt, attempts: 0 });
    return { ok: true };
  },
});

export const consumeLoginChallenge = internalMutation({
  args: { userId: v.id("users"), tokenHash: v.string(), code: v.string() },
  handler: async (ctx, { userId, tokenHash, code }) => {
    const challenge = await ctx.db.query("twoFactorLoginChallenges")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    const user = await ctx.db.get(userId);
    if (!challenge || challenge.userId !== userId || !user || user.role !== "user" || user.isSiteBanned || !user.twoFactorEnabled || challenge.expiresAt < Date.now() || challenge.verifiedAt !== undefined) {
      return { ok: false as const, message: "Sign-in verification expired. Start again." };
    }
    const result = await consumeSecondFactor(ctx, user, code);
    if (!result.ok) {
      const attempts = challenge.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) await ctx.db.delete(challenge._id);
      else await ctx.db.patch(challenge._id, { attempts });
      return result;
    }
    await ctx.db.patch(challenge._id, { verifiedAt: Date.now() });
    return { ok: true as const };
  },
});

export const consumeVerifiedChallenge = internalMutation({
  args: { userId: v.id("users"), tokenHash: v.string() },
  handler: async (ctx, { userId, tokenHash }) => {
    const challenge = await ctx.db.query("twoFactorLoginChallenges").withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash)).unique();
    const user = await ctx.db.get(userId);
    if (!challenge || challenge.userId !== userId || !user || user.role !== "user" || user.isSiteBanned || !user.twoFactorEnabled || challenge.expiresAt < Date.now() || challenge.verifiedAt === undefined) return false;
    await ctx.db.delete(challenge._id);
    return true;
  },
});

export const consumeLoginCode = internalMutation({
  args: { userId: v.id("users"), code: v.string() },
  handler: async (ctx, { userId, code }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.isAnonymous || user.isSiteBanned || !user.twoFactorEnabled || !user.twoFactorSecret) return { ok: false as const, message: "Sign-in verification failed." };
    return await consumeSecondFactor(ctx, user, code);
  },
});

export const disable = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await currentAccount(ctx);
    if (!user.twoFactorEnabled || !user.twoFactorSecret) return { ok: true };
    const result = await consumeSecondFactor(ctx, user, code);
    if (!result.ok) throw new Error(result.message);
    await ctx.db.patch(user._id, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      twoFactorPendingSecret: undefined,
      twoFactorVerifiedSessionId: undefined,
      twoFactorRecoveryCodeHashes: undefined,
      twoFactorLastCounter: undefined,
      twoFactorAttemptCount: undefined,
      twoFactorAttemptWindowAt: undefined,
    });
    return { ok: true };
  },
});
