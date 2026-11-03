import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSiteAvailable } from "./siteStatus";
import type { Doc } from "./_generated/dataModel";

/** A website tab counts as online while it sends heartbeats. */
const WEBSITE_ACTIVE_MS = 2 * 60 * 1000;
/** The game client refreshes less often, so its window is wider. */
const GAME_ACTIVE_MS = 5 * 60 * 1000;

export type PresenceState = "in-game" | "online" | "offline";

export function presenceState(user: Pick<Doc<"users">, "lastWebsiteSeenAt" | "lastGameSeenAt">, now = Date.now()): PresenceState {
  if (user.lastGameSeenAt && now - user.lastGameSeenAt <= GAME_ACTIVE_MS) return "in-game";
  if (user.lastWebsiteSeenAt && now - user.lastWebsiteSeenAt <= WEBSITE_ACTIVE_MS) return "online";
  return "offline";
}

function isPublicCompanyStaff(user: Pick<Doc<"users">, "emailVerificationTime" | "isSiteBanned" | "role" | "staffAccess" | "department" | "position">) {
  return user.emailVerificationTime !== undefined && !user.isSiteBanned &&
    (user.role === "admin" || user.staffAccess === true || Boolean(user.department?.trim() || user.position?.trim()));
}

/** Website heartbeat. Called while a signed-in tab is visible. */
export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!user || user.isSiteBanned) return { ok: false as const };
    await ctx.db.patch(user._id, { lastWebsiteSeenAt: Date.now() });
    return { ok: true as const };
  },
});

/**
 * Game-client presence. The game reports when a session starts or ends so the
 * website can show "In game" next to the player.
 */
export const reportGameActivity = mutation({
  args: {
    active: v.boolean(),
    activity: v.optional(v.string()),
  },
  handler: async (ctx, { active, activity }) => {
    await requireSiteAvailable(ctx);
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!user || user.isSiteBanned) throw new Error("Sign in to report game presence.");
    if (active) {
      const label = activity?.trim().slice(0, 40);
      await ctx.db.patch(user._id, {
        lastGameSeenAt: Date.now(),
        ...(label ? { gameActivity: label } : {}),
      });
    } else {
      await ctx.db.patch(user._id, { lastGameSeenAt: undefined, gameActivity: undefined });
    }
    return { ok: true as const };
  },
});

/** Presence shown on a public profile. Hidden profiles return null. */
export const publicPresence = query({
  args: { username: v.string() },
  handler: async (ctx, { username: rawUsername }) => {
    await requireSiteAvailable(ctx);
    const username = rawUsername.trim().replace(/^@/, "").toLowerCase();
    if (!username || username.length > 64) return null;
    const user = await ctx.db.query("users").withIndex("by_player_login", (q) => q.eq("playerLogin", username)).unique();
    if (!user || user.isSiteBanned) return null;
    if (user.profileDiscoverable !== true && !isPublicCompanyStaff(user)) return null;
    const state = presenceState(user);
    return {
      state,
      activity: state === "in-game" ? user.gameActivity ?? "In game" : null,
      lastWebsiteSeenAt: user.lastWebsiteSeenAt ?? null,
      lastGameSeenAt: user.lastGameSeenAt ?? null,
    };
  },
});
