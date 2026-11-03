import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { consumeSecondFactor } from "./secondFactor";

const MAX_DEVICE_ID_LENGTH = 128;
const MAX_USER_AGENT_LENGTH = 512;

function describeDevice(userAgent: string) {
  const ua = userAgent.slice(0, MAX_USER_AGENT_LENGTH);
  const deviceType: "phone" | "tablet" | "desktop" = /iPad|Tablet/i.test(ua)
    ? "tablet"
    : /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)
      ? "phone"
      : "desktop";
  const platform = /iPhone|iPad|iPod/i.test(ua)
    ? "iOS"
    : /Android/i.test(ua)
      ? "Android"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Macintosh|Mac OS X/i.test(ua)
          ? "macOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Unknown OS";
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /OPR\/|Opera/i.test(ua)
      ? "Opera"
      : /Firefox\//i.test(ua)
        ? "Firefox"
        : /Chrome\//i.test(ua)
          ? "Chrome"
          : /Safari\//i.test(ua)
            ? "Safari"
            : "Browser";
  return {
    label: `${browser} on ${platform}`,
    browser,
    platform,
    deviceType,
  };
}

/** The address that has actually been verified for account alerts. */
function verifiedAlertEmail(user: Doc<"users">) {
  const recovery = user.recoveryEmail?.trim().toLowerCase();
  if (recovery && user.recoveryEmailVerifiedAt !== undefined) return recovery;
  const accountEmail = user.email?.trim().toLowerCase();
  if (!accountEmail || user.emailVerificationTime === undefined) return undefined;
  if (accountEmail.endsWith("@players.openworlds.invalid")) return undefined;
  return accountEmail;
}

async function deleteSessionAndTokens(ctx: MutationCtx, sessionId: Id<"authSessions">) {
  const tokens = await ctx.db
    .query("authRefreshTokens")
    .withIndex("sessionId", (q) => q.eq("sessionId", sessionId))
    .collect();
  for (const token of tokens) await ctx.db.delete(token._id);
  // A removed sign-in must not leave a staff tool unlocked behind it.
  const unlocks = await ctx.db
    .query("staffUnlocks")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();
  for (const unlock of unlocks) await ctx.db.delete(unlock._id);
  await ctx.db.delete(sessionId);
}

/**
 * Ending another device is a high-impact action: it must be performed by an
 * account with an authenticator enabled, and the action itself must include a
 * fresh authenticator or recovery code. This prevents a stolen session from
 * being used to kick the real owner off every other device.
 */
async function requireSessionRevocationVerification(ctx: MutationCtx, rawCode: string): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  const sessionId = await getAuthSessionId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const session = sessionId ? await ctx.db.get(sessionId) : null;
  if (!userId || !sessionId || !user || !session || session.userId !== userId || session.expirationTime <= Date.now()) {
    throw new Error("Sign in again to manage devices.");
  }
  if (user.isAnonymous || user.isSiteBanned) throw new Error("Sign in to manage devices.");
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new Error("Turn on two-step verification with an authenticator app before signing out devices.");
  }
  const code = rawCode.trim();
  if (!code) throw new Error("Enter a current authenticator or recovery code.");
  const result = await consumeSecondFactor(ctx, user, code);
  if (!result.ok) throw new Error(result.message);
  return user;
}

/**
 * Called by the website whenever a signed-in session is active. It records the
 * browser once per auth session and refreshes its last-seen time. The first
 * device on an account is recorded silently; later unrecognized devices send
 * an alert to the account's verified email address.
 */
export const register = mutation({
  args: {
    deviceId: v.string(),
    userAgent: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to manage devices.");
    const sessionId = await getAuthSessionId(ctx);
    if (!sessionId) throw new Error("Sign in again to manage devices.");
    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== userId || session.expirationTime <= Date.now()) {
      throw new Error("This sign-in session has expired. Sign in again.");
    }
    const user = await ctx.db.get(userId);
    if (!user || user.isAnonymous || user.isSiteBanned) throw new Error("Sign in to manage devices.");

    const deviceId = args.deviceId.trim();
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(deviceId) || deviceId.length > MAX_DEVICE_ID_LENGTH) {
      throw new Error("This browser could not be identified. Reload the page and try again.");
    }
    const described = describeDevice(args.userAgent);
    const now = Date.now();
    const existingForSession = await ctx.db
      .query("accountDevices")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    if (existingForSession) {
      await ctx.db.patch(existingForSession._id, {
        deviceId,
        ...described,
        lastSeenAt: now,
      });
      return { ok: true, newDevice: false, alertScheduled: false };
    }

    const knownDevice = await ctx.db
      .query("accountDevices")
      .withIndex("by_user_device", (q) => q.eq("userId", userId).eq("deviceId", deviceId))
      .first();

    await ctx.db.insert("accountDevices", {
      userId,
      sessionId,
      deviceId,
      ...described,
      createdAt: now,
      lastSeenAt: now,
    });

    const isNewDevice = !knownDevice;
    const alertEmail = verifiedAlertEmail(user);
    const recentDevices = alertEmail && isNewDevice
      ? await ctx.db.query("accountDevices")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(50)
      : [];
    const recentNewDeviceCount = recentDevices.filter((record) => record.createdAt > now - 60 * 60 * 1000).length;
    if (isNewDevice && alertEmail && recentNewDeviceCount < 3) {
      await ctx.scheduler.runAfter(0, internal.supportEmail.sendNewDeviceLogin, {
        email: alertEmail,
        device: described.label,
        browser: described.browser,
        platform: described.platform,
        signedInAt: now,
      });
    }
    return { ok: true, newDevice: isNewDevice, alertScheduled: Boolean(isNewDevice && alertEmail && recentNewDeviceCount < 3) };
  },
});

/** Whether the auth session behind this request still exists. */
export const currentSession = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const sessionId = await getAuthSessionId(ctx);
    if (!userId || !sessionId) return { active: false };
    const session = await ctx.db.get(sessionId);
    return {
      active: Boolean(session && session.userId === userId && session.expirationTime > Date.now()),
    };
  },
});

/** All auth sessions for the signed-in account, newest activity first. */
export const devices = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { devices: [] };
    const user = await ctx.db.get(userId);
    if (!user || user.isAnonymous || user.isSiteBanned) return { devices: [] };

    const now = Date.now();
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .take(100);
    const active = sessions.filter((session) => session.expirationTime > now);
    const records = await ctx.db
      .query("accountDevices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(100);
    const bySession = new Map(records.map((record) => [record.sessionId, record]));
    const currentSessionId = await getAuthSessionId(ctx);

    return {
      devices: active
        .map((session) => {
          const record = bySession.get(session._id);
          return {
            sessionId: session._id as string,
            current: session._id === currentSessionId,
            label: record?.label ?? "Device details unavailable",
            browser: record?.browser ?? null,
            platform: record?.platform ?? null,
            deviceType: record?.deviceType ?? null,
            createdAt: record?.createdAt ?? session._creationTime,
            lastSeenAt: record?.lastSeenAt ?? session._creationTime,
            expiresAt: session.expirationTime,
          };
        })
        .sort((a, b) => {
          if (a.current !== b.current) return a.current ? -1 : 1;
          return b.lastSeenAt - a.lastSeenAt;
        }),
      emailAlerts: Boolean(verifiedAlertEmail(user)),
      twoFactorEnabled: user.twoFactorEnabled === true,
    };
  },
});

/** End one other signed-in device. A fresh authenticator code is required. */
export const revoke = mutation({
  args: { sessionId: v.string(), code: v.string() },
  handler: async (ctx, { sessionId: rawSessionId, code }) => {
    const user = await requireSessionRevocationVerification(ctx, code);
    const sessionId = ctx.db.normalizeId("authSessions", rawSessionId);
    const session = sessionId ? await ctx.db.get(sessionId) : null;
    if (!session || session.userId !== user._id) {
      throw new Error("That device is not signed in to your account.");
    }
    const currentSessionId = await getAuthSessionId(ctx);
    if (session._id === currentSessionId) {
      throw new Error("Use Sign out all devices to end this session.");
    }
    await deleteSessionAndTokens(ctx, session._id);
    const records = await ctx.db
      .query("accountDevices")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();
    for (const record of records) await ctx.db.delete(record._id);
    return { ok: true };
  },
});

/** End every session on the account, including the one making this request. */
export const signOutAll = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await requireSessionRevocationVerification(ctx, code);
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();
    for (const session of sessions) await deleteSessionAndTokens(ctx, session._id);
    const records = await ctx.db
      .query("accountDevices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const record of records) await ctx.db.delete(record._id);
    return { ok: true, ended: sessions.length };
  },
});
