import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
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
      ...(user.role === "user" ? { playerName: user.name ?? "Player" } : {}),
    };
  },
});
