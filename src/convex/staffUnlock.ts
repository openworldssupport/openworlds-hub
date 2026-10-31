import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { consumeSecondFactor } from "./secondFactor";

const UNLOCK_MS = 15 * 60 * 1000;

function isAdminAccount(user: { role?: string; email?: string; emailVerificationTime?: number; isSiteBanned?: boolean } | null) {
  return Boolean(user && user.emailVerificationTime !== undefined && !user.isSiteBanned &&
    (user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk"));
}

function isStaffAccount(user: { role?: string; email?: string; emailVerificationTime?: number; isSiteBanned?: boolean; staffAccess?: boolean; department?: string; position?: string } | null) {
  return isAdminAccount(user) || Boolean(user && user.emailVerificationTime !== undefined && !user.isSiteBanned &&
    (user.staffAccess || user.department?.trim() || user.position?.trim()));
}

/**
 * Resolves whether the signed-in member is staff and whether this browser
 * session currently holds a live elevation.
 */
export async function staffUnlockState(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const sessionId = await getAuthSessionId(ctx);
  const canAct = Boolean(userId && sessionId && isStaffAccount(user));
  if (!canAct || !userId) {
    return { canAct: false, isAdmin: false, enrolled: false, userId: null, sessionId: null, verifiedUntil: 0 };
  }
  const record = await ctx.db.query("staffUnlocks").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
  const verifiedUntil = record && record.sessionId === sessionId && record.verifiedUntil > Date.now() ? record.verifiedUntil : 0;
  return {
    canAct: true,
    isAdmin: isAdminAccount(user),
    enrolled: Boolean(user && user.twoFactorEnabled && user.twoFactorSecret),
    userId,
    sessionId,
    verifiedUntil,
  };
}

/** Throws unless the current session holds a live staff elevation. */
export async function requireStaffUnlock(ctx: QueryCtx | MutationCtx) {
  const state = await staffUnlockState(ctx);
  if (!state.canAct) throw new Error("Verified staff or administrator access is required.");
  if (!state.verifiedUntil) {
    throw new Error("Unlock staff tools with your authenticator app before making this change.");
  }
  return state;
}

/** Boolean variant for read paths that degrade gracefully instead of throwing. */
export async function isStaffUnlocked(ctx: QueryCtx | MutationCtx) {
  return (await staffUnlockState(ctx)).verifiedUntil > Date.now();
}

export const status = query({
  args: {},
  handler: async (ctx) => {
    const state = await staffUnlockState(ctx);
    return {
      canAct: state.canAct,
      isAdmin: state.isAdmin,
      enrolled: state.enrolled,
      verifiedUntil: state.verifiedUntil,
    };
  },
});

/**
 * Confirms a 6-digit code from the member's own authenticator app (or a saved
 * recovery code) and unlocks staff tools for this session for 15 minutes.
 */
export const unlock = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const state = await staffUnlockState(ctx);
    if (!state.canAct || !state.sessionId) throw new Error("Verified staff or administrator access is required.");
    if (!state.enrolled) throw new Error("Add an authenticator app under Account security before unlocking staff tools.");
    const user = await ctx.db.get(state.userId);
    if (!user) throw new Error("Verified staff or administrator access is required.");
    const result = await consumeSecondFactor(ctx, user, code);
    if (!result.ok) throw new Error(result.message);
    const verifiedUntil = Date.now() + UNLOCK_MS;
    const userId = state.userId;
    const existing = await ctx.db.query("staffUnlocks").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { sessionId: state.sessionId, verifiedUntil, createdAt: Date.now() });
    } else {
      await ctx.db.insert("staffUnlocks", { userId, sessionId: state.sessionId, verifiedUntil, createdAt: Date.now() });
    }
    return { verifiedUntil, usedRecoveryCode: result.ok ? result.usedRecoveryCode : false };
  },
});
