import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { consumeSecondFactor, hashValue } from "./secondFactor";
import { maskPhone } from "../lib/staff";
import { requireSiteAvailable } from "./siteStatus";
import { smsConfigStatus } from "./smsConfig";

const RESEND_COOLDOWN_MS = 60 * 1000;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;
const VERIFY_WINDOW_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 8;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

function normalizePhone(raw: string) {
  const compact = raw.trim().replace(/[\s().-]/g, "");
  // Danish mobile numbers are eight digits. Accept them without +45 so the
  // common local format works, while still requiring a country code for
  // everything else.
  const normalized = compact.startsWith("00")
    ? `+${compact.slice(2)}`
    : compact.startsWith("+")
      ? compact
      : /^\d{8}$/.test(compact)
        ? `+45${compact}`
        : `+${compact}`;
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error("Enter a phone number in international format, for example +4512345678.");
  }
  return normalized;
}

function newChallengeToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function currentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  if (!user || user.isAnonymous || user.isSiteBanned) {
    throw new Error("Sign in to manage your phone number.");
  }
  return user;
}

/** The signed-in account's phone state. The full number never leaves the server. */
export const status = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!user || user.isAnonymous || user.isSiteBanned) {
      return { signedIn: false as const, phoneNumber: null, pendingPhoneNumber: null, verified: false };
    }
    return {
      signedIn: true as const,
      phoneNumber: maskPhone(user.phoneNumber),
      pendingPhoneNumber: maskPhone(user.pendingPhoneNumber),
      verified: Boolean(user.phoneNumber && user.phoneVerifiedAt !== undefined),
    };
  },
});

export const smsStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const userId = await getAuthUserId(ctx);
    return { signedIn: Boolean(userId), ...smsConfigStatus() };
  },
});

export const pendingForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || !user.pendingPhoneNumber) return null;
    return { phoneNumber: user.pendingPhoneNumber, requestId: user.pendingPhoneVerificationId };
  },
});

/** Validates and reserves a pending phone number before the SMS is sent. */
export const preparePhoneVerification = internalMutation({
  args: { userId: v.id("users"), phoneNumber: v.string() },
  handler: async (ctx, { userId, phoneNumber: rawPhone }) => {
    await requireSiteAvailable(ctx);
    const user = await ctx.db.get(userId);
    if (!user || user.isAnonymous || user.isSiteBanned) throw new Error("Sign in to add a phone number.");
    const phoneNumber = normalizePhone(rawPhone);
    if (user.phoneNumber === phoneNumber && user.phoneVerifiedAt !== undefined) {
      throw new Error("That phone number is already verified on this account.");
    }
    const usedBy = await ctx.db.query("users").withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber)).first();
    if (usedBy && usedBy._id !== user._id) throw new Error("That phone number is already linked to another account.");
    const now = Date.now();
    if ((user.phoneCodeLastSentAt ?? 0) > now - RESEND_COOLDOWN_MS) {
      throw new Error("Wait a minute before requesting another text message.");
    }
    const count = user.phoneCodeWindowAt && now - user.phoneCodeWindowAt < SEND_WINDOW_MS
      ? user.phoneCodeSendCount ?? 0
      : 0;
    if (count >= MAX_SENDS_PER_HOUR) throw new Error("Too many text messages requested. Try again later.");
    await ctx.db.patch(user._id, {
      pendingPhoneNumber: phoneNumber,
      pendingPhoneVerificationId: undefined,
      phoneCodeLastSentAt: now,
      phoneCodeWindowAt: count === 0 ? now : user.phoneCodeWindowAt,
      phoneCodeSendCount: count + 1,
      phoneVerifyAttemptCount: 0,
      phoneVerifyAttemptWindowAt: undefined,
    });
    return { phoneNumber };
  },
});

export const cancelPhoneVerification = internalMutation({
  args: { userId: v.id("users"), phoneNumber: v.string() },
  handler: async (ctx, { userId, phoneNumber }) => {
    const user = await ctx.db.get(userId);
    if (user?.pendingPhoneNumber === phoneNumber) {
      // A failed SMS request should not consume the resend cooldown or the
      // hourly quota. Roll back the reservation made by preparePhoneVerification.
      const sends = user.phoneCodeSendCount ?? 1;
      const remainingSends = Math.max(sends - 1, 0);
      await ctx.db.patch(user._id, {
        pendingPhoneNumber: undefined,
        pendingPhoneVerificationId: undefined,
        phoneCodeLastSentAt: undefined,
        phoneCodeWindowAt: remainingSends === 0 ? undefined : user.phoneCodeWindowAt,
        phoneCodeSendCount: remainingSends === 0 ? undefined : remainingSends,
      });
    }
  },
});

export const recordPhoneVerifyFailure = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return { allowed: false as const, remaining: 0 };
    const now = Date.now();
    const count = user.phoneVerifyAttemptWindowAt && now - user.phoneVerifyAttemptWindowAt < VERIFY_WINDOW_MS
      ? user.phoneVerifyAttemptCount ?? 0
      : 0;
    if (count >= MAX_VERIFY_ATTEMPTS) return { allowed: false as const, remaining: 0 };
    await ctx.db.patch(user._id, {
      phoneVerifyAttemptWindowAt: count === 0 ? now : user.phoneVerifyAttemptWindowAt,
      phoneVerifyAttemptCount: count + 1,
    });
    return { allowed: true as const, remaining: Math.max(MAX_VERIFY_ATTEMPTS - count - 1, 0) };
  },
});

export const markPhoneVerified = internalMutation({
  args: { userId: v.id("users"), phoneNumber: v.string() },
  handler: async (ctx, { userId, phoneNumber }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.pendingPhoneNumber !== phoneNumber) {
      throw new Error("That phone verification expired. Request a new code.");
    }
    const usedBy = await ctx.db.query("users").withIndex("by_phone", (q) => q.eq("phoneNumber", phoneNumber)).first();
    if (usedBy && usedBy._id !== user._id) throw new Error("That phone number is already linked to another account.");
    await ctx.db.patch(user._id, {
      phoneNumber,
      phoneVerifiedAt: Date.now(),
      pendingPhoneNumber: undefined,
      pendingPhoneVerificationId: undefined,
      phoneVerifyAttemptCount: 0,
      phoneVerifyAttemptWindowAt: undefined,
    });
    return { ok: true as const, phoneNumber: maskPhone(phoneNumber) };
  },
});

/**
 * Phone verification is a deliberate action. Removing a number is protected
 * by the existing authenticator/recovery code when two-step is enabled.
 */
export const removePhoneNumber = mutation({
  args: { code: v.optional(v.string()) },
  handler: async (ctx, { code }) => {
    const user = await currentUser(ctx);
    if (user.twoFactorEnabled) {
      if (!code?.trim()) throw new Error("Enter an authenticator or recovery code to remove your phone number.");
      const result = await consumeSecondFactor(ctx, user, code);
      if (!result.ok) throw new Error(result.message);
    }
    await ctx.db.patch(user._id, {
      phoneNumber: undefined,
      phoneVerifiedAt: undefined,
      pendingPhoneNumber: undefined,
      pendingPhoneVerificationId: undefined,
      phoneCodeLastSentAt: undefined,
      phoneCodeWindowAt: undefined,
      phoneCodeSendCount: undefined,
      phoneVerifyAttemptCount: undefined,
      phoneVerifyAttemptWindowAt: undefined,
    });
    return { ok: true as const };
  },
});

/** Sends a setup code to a new number. */
export const setPhoneVerificationId = internalMutation({
  args: { userId: v.id("users"), phoneNumber: v.string(), requestId: v.string() },
  handler: async (ctx, { userId, phoneNumber, requestId }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.pendingPhoneNumber !== phoneNumber) {
      throw new Error("That phone verification expired. Request a new code.");
    }
    await ctx.db.patch(user._id, { pendingPhoneVerificationId: requestId });
  },
});

export const requestPhoneVerification = action({
  args: { phoneNumber: v.string() },
  handler: async (ctx, { phoneNumber }): Promise<{ ok: true; phoneNumber: string | null }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to add a phone number.");
    const prepared = await ctx.runMutation(internal.phoneVerification.preparePhoneVerification, {
      userId,
      phoneNumber,
    });
    try {
      const sent = await ctx.runAction(internal.phone.sendCode, { phoneNumber: prepared.phoneNumber });
      await ctx.runMutation(internal.phoneVerification.setPhoneVerificationId, {
        userId,
        phoneNumber: prepared.phoneNumber,
        requestId: sent.requestId,
      });
    } catch (error) {
      await ctx.runMutation(internal.phoneVerification.cancelPhoneVerification, {
        userId,
        phoneNumber: prepared.phoneNumber,
      });
      throw error;
    }
    return { ok: true as const, phoneNumber: maskPhone(prepared.phoneNumber) };
  },
});

/** Confirms a setup code and activates the number. */
export const verifyPhoneNumber = action({
  args: { code: v.string() },
  handler: async (ctx, { code }): Promise<{ ok: true; phoneNumber: string | null }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to verify a phone number.");
    if (!/^\d{6}$/.test(code.trim())) throw new Error("Enter the six-digit code from the text message.");
    const pending = await ctx.runQuery(internal.phoneVerification.pendingForUser, { userId });
    if (!pending?.requestId) throw new Error("Request a new phone verification code.");
    const checked = await ctx.runAction(internal.phone.checkCode, {
      requestId: pending.requestId,
      code: code.trim(),
    });
    if (!checked.approved) {
      const attempt = await ctx.runMutation(internal.phoneVerification.recordPhoneVerifyFailure, { userId });
      if (!attempt.allowed || attempt.remaining <= 0) {
        throw new Error("Too many incorrect codes. Request a new code later.");
      }
      throw new Error(`That code is incorrect or expired. ${attempt.remaining} attempts remain.`);
    }
    return await ctx.runMutation(internal.phoneVerification.markPhoneVerified, {
      userId,
      phoneNumber: pending.phoneNumber,
    });
  },
});

/** Player sign-in: prepare the SMS send for an existing 2FA challenge. */
export const preparePhoneSignInSend = internalMutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const challenge = await ctx.db.query("twoFactorLoginChallenges")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!challenge || challenge.expiresAt < Date.now() || challenge.verifiedAt !== undefined) {
      throw new Error("Two-step sign-in expired. Start again.");
    }
    const user = await ctx.db.get(challenge.userId);
    if (!user || !user.phoneNumber || user.phoneVerifiedAt === undefined) {
      throw new Error("No verified phone number is available for this account.");
    }
    if ((challenge.phoneSentAt ?? 0) > Date.now() - RESEND_COOLDOWN_MS) {
      throw new Error("Wait a minute before requesting another text message.");
    }
    await ctx.db.patch(challenge._id, { phoneSentAt: Date.now(), phoneVerificationId: undefined });
    return { phoneNumber: user.phoneNumber, maskedPhone: maskPhone(user.phoneNumber) };
  },
});

export const cancelPhoneSignInSend = internalMutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const challenge = await ctx.db.query("twoFactorLoginChallenges")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (challenge) await ctx.db.patch(challenge._id, { phoneSentAt: undefined, phoneVerificationId: undefined });
  },
});

export const setPhoneSignInRequestId = internalMutation({
  args: { tokenHash: v.string(), requestId: v.string() },
  handler: async (ctx, { tokenHash, requestId }) => {
    const challenge = await ctx.db.query("twoFactorLoginChallenges")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!challenge || challenge.expiresAt < Date.now() || challenge.verifiedAt !== undefined) {
      throw new Error("Two-step sign-in expired. Start again.");
    }
    await ctx.db.patch(challenge._id, { phoneVerificationId: requestId });
  },
});

export const phoneSignInTarget = internalQuery({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const challenge = await ctx.db.query("twoFactorLoginChallenges")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!challenge || challenge.expiresAt < Date.now() || challenge.verifiedAt !== undefined) return null;
    const user = await ctx.db.get(challenge.userId);
    if (!user || !user.phoneNumber || user.phoneVerifiedAt === undefined) return null;
    return {
      userId: challenge.userId,
      phoneNumber: user.phoneNumber,
      requestId: challenge.phoneVerificationId,
      attempts: challenge.phoneAttempts ?? 0,
    };
  },
});

export const recordPhoneSignInFailure = internalMutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const challenge = await ctx.db.query("twoFactorLoginChallenges")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!challenge) return { allowed: false as const, remaining: 0 };
    const attempts = (challenge.phoneAttempts ?? 0) + 1;
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      await ctx.db.delete(challenge._id);
      return { allowed: false as const, remaining: 0 };
    }
    await ctx.db.patch(challenge._id, { phoneAttempts: attempts });
    return { allowed: true as const, remaining: MAX_VERIFY_ATTEMPTS - attempts };
  },
});

export const markPhoneSignInVerified = internalMutation({
  args: { tokenHash: v.string(), userId: v.id("users") },
  handler: async (ctx, { tokenHash, userId }) => {
    const challenge = await ctx.db.query("twoFactorLoginChallenges")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!challenge || challenge.userId !== userId || challenge.expiresAt < Date.now()) {
      throw new Error("Two-step sign-in expired. Start again.");
    }
    await ctx.db.patch(challenge._id, { verifiedAt: Date.now(), phoneVerificationId: undefined });
    return { ok: true as const };
  },
});

export const loginChallengeVerified = internalQuery({
  args: { tokenHash: v.string(), userId: v.id("users") },
  handler: async (ctx, { tokenHash, userId }) => {
    const challenge = await ctx.db.query("twoFactorLoginChallenges")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    return Boolean(challenge && challenge.userId === userId && challenge.expiresAt >= Date.now() && challenge.verifiedAt !== undefined);
  },
});

/** Player sign-in: request an SMS code for an already-created 2FA challenge. */
export const sendPhoneSignInCode = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<{ ok: true; phoneNumber: string | null }> => {
    const tokenHash = await hashValue(token);
    const prepared = await ctx.runMutation(internal.phoneVerification.preparePhoneSignInSend, { tokenHash });
    try {
      const sent = await ctx.runAction(internal.phone.sendCode, { phoneNumber: prepared.phoneNumber });
      await ctx.runMutation(internal.phoneVerification.setPhoneSignInRequestId, {
        tokenHash,
        requestId: sent.requestId,
      });
    } catch (error) {
      await ctx.runMutation(internal.phoneVerification.cancelPhoneSignInSend, { tokenHash });
      throw error;
    }
    return { ok: true as const, phoneNumber: prepared.maskedPhone };
  },
});

/** Player sign-in: verify the SMS code and mark the existing challenge verified. */
export const completePhoneSignIn = action({
  args: { token: v.string(), code: v.string() },
  handler: async (ctx, { token, code }): Promise<{ ok: true }> => {
    if (!/^\d{6}$/.test(code.trim())) throw new Error("Enter the six-digit code from the text message.");
    const tokenHash = await hashValue(token);
    const target = await ctx.runQuery(internal.phoneVerification.phoneSignInTarget, { tokenHash });
    if (!target?.requestId) throw new Error("Two-step sign-in expired. Start again.");
    const checked = await ctx.runAction(internal.phone.checkCode, {
      requestId: target.requestId,
      code: code.trim(),
    });
    if (!checked.approved) {
      const attempt = await ctx.runMutation(internal.phoneVerification.recordPhoneSignInFailure, { tokenHash });
      if (!attempt.allowed || attempt.remaining <= 0) throw new Error("Too many incorrect codes. Start signing in again.");
      throw new Error(`That code is incorrect or expired. ${attempt.remaining} attempts remain.`);
    }
    return await ctx.runMutation(internal.phoneVerification.markPhoneSignInVerified, { tokenHash, userId: target.userId });
  },
});

/** Staff email-code sign-in: issue a short-lived SMS challenge. */
export const createStaffPhoneChallenge = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.isAnonymous || user.isSiteBanned) throw new Error("Staff sign-in verification failed.");
    if (!user.twoFactorEnabled) throw new Error("Two-step verification is not enabled on this account.");
    if (!user.phoneNumber || user.phoneVerifiedAt === undefined) {
      throw new Error("Add and verify a phone number before using SMS sign-in.");
    }
    const now = Date.now();
    if ((user.phoneCodeLastSentAt ?? 0) > now - RESEND_COOLDOWN_MS) {
      throw new Error("Wait a minute before requesting another text message.");
    }
    const count = user.phoneCodeWindowAt && now - user.phoneCodeWindowAt < SEND_WINDOW_MS
      ? user.phoneCodeSendCount ?? 0
      : 0;
    if (count >= MAX_SENDS_PER_HOUR) throw new Error("Too many text messages requested. Try again later.");
    const token = newChallengeToken();
    const tokenHash = await hashValue(token);
    await ctx.db.patch(user._id, {
      phoneCodeLastSentAt: now,
      phoneCodeWindowAt: count === 0 ? now : user.phoneCodeWindowAt,
      phoneCodeSendCount: count + 1,
    });
    await ctx.db.insert("twoFactorLoginChallenges", {
      userId,
      tokenHash,
      createdAt: now,
      expiresAt: now + CHALLENGE_TTL_MS,
      attempts: 0,
      phoneSentAt: now,
    });
    return { userId, tokenHash, token, phoneNumber: user.phoneNumber, maskedPhone: maskPhone(user.phoneNumber) };
  },
});

export const setStaffPhoneRequestId = internalMutation({
  args: { tokenHash: v.string(), userId: v.id("users"), requestId: v.string() },
  handler: async (ctx, { tokenHash, userId, requestId }) => {
    const challenge = await ctx.db.query("twoFactorLoginChallenges")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (!challenge || challenge.userId !== userId || challenge.expiresAt < Date.now()) {
      throw new Error("The SMS sign-in request expired. Request a new code.");
    }
    await ctx.db.patch(challenge._id, { phoneVerificationId: requestId });
  },
});

export const rollbackStaffPhoneSend = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;
    const sends = user.phoneCodeSendCount ?? 1;
    const remainingSends = Math.max(sends - 1, 0);
    await ctx.db.patch(user._id, {
      phoneCodeLastSentAt: undefined,
      phoneCodeWindowAt: remainingSends === 0 ? undefined : user.phoneCodeWindowAt,
      phoneCodeSendCount: remainingSends === 0 ? undefined : remainingSends,
    });
  },
});

export const staffPhoneChallengeTarget = internalQuery({
  args: { tokenHash: v.string(), userId: v.id("users") },
  handler: async (ctx, { tokenHash, userId }) => {
    const challenge = await ctx.db.query("twoFactorLoginChallenges")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    const user = await ctx.db.get(userId);
    if (!challenge || challenge.userId !== userId || !user || challenge.expiresAt < Date.now()) return null;
    if (!user.phoneNumber || user.phoneVerifiedAt === undefined) return null;
    return { phoneNumber: user.phoneNumber, requestId: challenge.phoneVerificationId };
  },
});

export const deletePhoneChallenge = internalMutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const challenge = await ctx.db.query("twoFactorLoginChallenges")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (challenge) await ctx.db.delete(challenge._id);
  },
});

export const sendStaffPhoneSignInCode = action({
  args: { email: v.string(), emailCode: v.string() },
  handler: async (ctx, { email: rawEmail, emailCode }): Promise<{ ok: true; token: string; phoneNumber: string | null }> => {
    const email = rawEmail.trim().toLowerCase();
    const validOtp = await ctx.runQuery(internal.accountSecurity.getStaffOtpToken, {
      email,
      code: emailCode.trim(),
    });
    if (!validOtp) throw new Error("That email code is incorrect or expired.");
    const account = await ctx.runQuery(internal.accountSecurity.staffAccountForSignIn, { email });
    if (!account?.userId) throw new Error("Staff sign-in verification failed.");
    const challenge = await ctx.runMutation(internal.phoneVerification.createStaffPhoneChallenge, {
      userId: account.userId,
    });
    try {
      const sent = await ctx.runAction(internal.phone.sendCode, { phoneNumber: challenge.phoneNumber });
      await ctx.runMutation(internal.phoneVerification.setStaffPhoneRequestId, {
        tokenHash: challenge.tokenHash,
        userId: challenge.userId,
        requestId: sent.requestId,
      });
    } catch (error) {
      await ctx.runMutation(internal.phoneVerification.deletePhoneChallenge, { tokenHash: challenge.tokenHash });
      await ctx.runMutation(internal.phoneVerification.rollbackStaffPhoneSend, { userId: challenge.userId });
      throw error;
    }
    return { ok: true as const, token: challenge.token, phoneNumber: challenge.maskedPhone };
  },
});

export const completeStaffPhoneSignIn = action({
  args: { email: v.string(), emailCode: v.string(), token: v.string(), code: v.string() },
  handler: async (ctx, { email: rawEmail, emailCode, token, code }): Promise<{ ok: true }> => {
    if (!/^\d{6}$/.test(code.trim())) throw new Error("Enter the six-digit code from the text message.");
    const email = rawEmail.trim().toLowerCase();
    const validOtp = await ctx.runQuery(internal.accountSecurity.getStaffOtpToken, {
      email,
      code: emailCode.trim(),
    });
    if (!validOtp) throw new Error("That email code is incorrect or expired.");
    const account = await ctx.runQuery(internal.accountSecurity.staffAccountForSignIn, { email });
    if (!account?.userId) throw new Error("Staff sign-in verification failed.");
    const tokenHash = await hashValue(token);
    const target = await ctx.runQuery(internal.phoneVerification.staffPhoneChallengeTarget, {
      tokenHash,
      userId: account.userId,
    });
    if (!target?.requestId) throw new Error("The SMS sign-in request expired. Request a new code.");
    const checked = await ctx.runAction(internal.phone.checkCode, {
      requestId: target.requestId,
      code: code.trim(),
    });
    if (!checked.approved) throw new Error("That code is incorrect or expired.");
    await ctx.runMutation(internal.accountSecurity.authorizeStaffTwoFactor, { userId: account.userId });
    await ctx.runMutation(internal.phoneVerification.deletePhoneChallenge, { tokenHash });
    return { ok: true as const };
  },
});

