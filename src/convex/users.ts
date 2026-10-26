import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isEmailAddress } from "../lib/staff";
import { requireSiteAvailable } from "./siteStatus";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const publicOfficialCreators = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const creators = await ctx.db.query("users")
      .withIndex("by_official_creator", (q) => q.eq("isOfficialCreator", true))
      .collect();
    return creators
      .filter((creator) => creator.emailVerificationTime !== undefined && !creator.isSiteBanned && Boolean(creator.playerLogin?.trim()))
      .map((creator) => ({
        username: creator.playerLogin!.trim(),
        image: creator.image ?? null,
      }))
      .sort((a, b) => a.username.localeCompare(b.username));
  },
});

export const searchPlayerProfiles = query({
  args: { search: v.string() },
  handler: async (ctx, { search }) => {
    await requireSiteAvailable(ctx);
    const term = search.trim().replace(/^@/, "");
    if (term.length < 2) return [];
    const matches = await ctx.db.query("users")
      .withSearchIndex("search_player_profiles", (q) => q.search("playerLogin", term).eq("role", "user").eq("profileDiscoverable", true))
      .take(15);
    return matches
      .filter((user) => !user.isSiteBanned && user.profileDiscoverable !== false && Boolean(user.playerLogin?.trim()))
      .map((user) => ({
        username: user.playerLogin!.trim(),
        displayName: isEmailAddress(user.name) ? null : user.name ?? null,
        image: user.image ?? null,
        isOfficialCreator: user.isOfficialCreator === true,
      }));
  },
});

export const currentProfilePrivacy = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "user") return null;
    return { discoverable: user.profileDiscoverable === true };
  },
});

export const setProfileDiscoverability = mutation({
  args: { discoverable: v.boolean() },
  handler: async (ctx, { discoverable }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to update your profile privacy.");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "user" || user.isSiteBanned) throw new Error("Player account required.");
    await ctx.db.patch(userId, { profileDiscoverable: discoverable });
    return { discoverable };
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Expose only the profile fields needed by the client; never return the raw
    // auth user document (which includes the private sign-in email).
    return {
      userId: user._id,
      name: isEmailAddress(user.name) ? null : user.name ?? null,
      role: user.role ?? null,
      department: user.department ?? null,
      position: user.position ?? null,
      publicBadge: user.publicBadge ?? null,
      nickname: isEmailAddress(user.nickname) ? null : user.nickname ?? null,
      ...(user.role === "user" ? {
        playerName: user.name ?? "Player",
        isOfficialCreator: user.isOfficialCreator === true,
      } : {}),
    };
  },
});
