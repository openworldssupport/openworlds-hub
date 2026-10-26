import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { isEmailAddress } from "../lib/staff";
import { requireSiteAvailable } from "./siteStatus";
import { requireCompanyAdmin } from "./admin";
import { requirePermissionVerification } from "./adminRoster";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
/**
 * Link a player to an admin-approved creator only after both identity fields
 * are verified together: the OpenWorlds username and verified recovery email.
 */
export async function linkVerifiedCreatorAccount(ctx: MutationCtx, userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (!user) return false;

  const linkedRecord = await ctx.db.query("officialCreators")
    .withIndex("by_linked_user", (q) => q.eq("linkedUserId", userId))
    .first();
  const username = user.playerLogin?.trim().toLowerCase();
  const email = user.recoveryEmail?.trim().toLowerCase();
  const record = user.role === "user" && !user.isSiteBanned && username && email && user.recoveryEmailVerifiedAt
    ? await ctx.db.query("officialCreators").withIndex("by_email", (q) => q.eq("email", email)).first()
    : null;
  const isExactMatch = Boolean(record && record.username.trim().toLowerCase() === username);
  const usernameOwner = isExactMatch
    ? await ctx.db.query("officialCreators").withIndex("by_username", (q) => q.eq("username", username!)).first()
    : null;
  const canLink = Boolean(
    record && isExactMatch && (!usernameOwner || usernameOwner._id === record._id) &&
    (!record.linkedUserId || record.linkedUserId === userId),
  );

  if (!canLink) {
    if (linkedRecord) await ctx.db.patch(linkedRecord._id, { linkedUserId: undefined, updatedAt: Date.now() });
    if (user.isOfficialCreator) await ctx.db.patch(userId, { isOfficialCreator: undefined });
    return false;
  }

  if (linkedRecord && linkedRecord._id !== record!._id) {
    await ctx.db.patch(linkedRecord._id, { linkedUserId: undefined, updatedAt: Date.now() });
  }
  await ctx.db.patch(record!._id, { linkedUserId: userId, updatedAt: Date.now() });
  if (user.isOfficialCreator !== true) await ctx.db.patch(userId, { isOfficialCreator: true });
  return true;
}

export const publicOfficialCreators = query({ 
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const records = await ctx.db.query("officialCreators").collect();
    const linkedUsers = await Promise.all(records.map((record) => record.linkedUserId ? ctx.db.get(record.linkedUserId) : null));
    const creators = records.flatMap((record, index) => {
      const linkedUser = linkedUsers[index];
      if (linkedUser?.isSiteBanned) return [];
      return [{
        username: record.username,
        displayName: record.displayName,
        image: linkedUser?.image ?? null,
        socialPlatform: record.socialPlatform ?? null,
        socialUrl: record.socialUrl ?? null,
      }];
    });
    const knownUsernames = new Set(creators.map((creator) => creator.username.toLowerCase()));
    const legacyCreators = await ctx.db.query("users")
      .withIndex("by_official_creator", (q) => q.eq("isOfficialCreator", true))
      .collect();
    for (const creator of legacyCreators) {
      const username = creator.playerLogin?.trim();
      if (creator.emailVerificationTime === undefined || creator.isSiteBanned || !username || knownUsernames.has(username.toLowerCase())) continue;
      creators.push({ username, displayName: username, image: creator.image ?? null, socialPlatform: null, socialUrl: null });
      knownUsernames.add(username.toLowerCase());
    }
    return creators.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

/** Admin-only creator records, including private contact email. */
export const adminOfficialCreators = query({
  args: {},
  handler: async (ctx) => {
    await requireCompanyAdmin(ctx);
    await requirePermissionVerification(ctx);
    return (await ctx.db.query("officialCreators").collect())
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map(({ _id, email, username, displayName, socialPlatform, socialUrl, linkedUserId }) => ({
        _id, email, username, displayName,
        socialPlatform: socialPlatform ?? null,
        socialUrl: socialUrl ?? null,
        isLinked: Boolean(linkedUserId),
      }));
  },
});

/** Add or update an approved creator and grant the badge to a matching active player account. */
export const saveOfficialCreator = mutation({
  args: {
    email: v.string(),
    username: v.string(),
    displayName: v.string(),
    socialPlatform: v.optional(v.string()),
    socialUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCompanyAdmin(ctx);
    await requirePermissionVerification(ctx);
    const email = args.email.trim().toLowerCase();
    const username = args.username.trim().replace(/^@/, "");
    const displayName = args.displayName.trim();
    const socialPlatform = args.socialPlatform?.trim() || undefined;
    const socialUrl = args.socialUrl?.trim() || undefined;
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid contact email.");
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,31}$/.test(username)) throw new Error("Enter a valid OpenWorlds username (2–32 letters, numbers, dots, hyphens, or underscores).");
    if (displayName.length < 2 || displayName.length > 60) throw new Error("Display name must be 2–60 characters.");
    if (socialPlatform && socialPlatform.length > 40) throw new Error("Keep the social platform name under 40 characters.");
    if (socialUrl && (socialUrl.length > 500 || !/^https:\/\//i.test(socialUrl))) throw new Error("Use an HTTPS link under 500 characters for the social profile.");

    const normalizedUsername = username.toLowerCase();
    const usernameOwner = await ctx.db.query("officialCreators").withIndex("by_username", (q) => q.eq("username", normalizedUsername)).first();
    const emailRecord = await ctx.db.query("officialCreators").withIndex("by_email", (q) => q.eq("email", email)).first();
    if (usernameOwner && usernameOwner._id !== emailRecord?._id) throw new Error("That username is already assigned to another creator.");

    const byUsername = await ctx.db.query("users").withIndex("by_player_login", (q) => q.eq("playerLogin", normalizedUsername)).first();
    const byRecoveryEmail = await ctx.db.query("users").withIndex("by_recovery_email", (q) => q.eq("recoveryEmail", email)).first();
    const usernameAccount = byUsername?.role === "user" ? byUsername : null;
    const recoveryAccount = byRecoveryEmail?.role === "user" ? byRecoveryEmail : null;
    if (usernameAccount && recoveryAccount && usernameAccount._id !== recoveryAccount._id) {
      throw new Error("The username and verified recovery email belong to different player accounts.");
    }
    const matched = usernameAccount && recoveryAccount && usernameAccount._id === recoveryAccount._id &&
      recoveryAccount.recoveryEmailVerifiedAt !== undefined && recoveryAccount.recoveryEmail?.trim().toLowerCase() === email
      ? usernameAccount
      : null;
    if (matched?.isSiteBanned) throw new Error("This account is restricted and cannot be verified as a creator.");
    const linkedOwner = matched ? await ctx.db.query("officialCreators").withIndex("by_linked_user", (q) => q.eq("linkedUserId", matched._id)).first() : null;
    if (linkedOwner && linkedOwner._id !== emailRecord?._id) throw new Error("That player account is already linked to another creator record.");

    const now = Date.now();
    const values = {
      email,
      username: normalizedUsername,
      displayName,
      socialPlatform,
      socialUrl,
      linkedUserId: matched?._id,
      updatedAt: now,
    };
    if (emailRecord) await ctx.db.patch(emailRecord._id, values);
    else await ctx.db.insert("officialCreators", { ...values, createdAt: now, createdBy: (await getAuthUserId(ctx))! });
    if (emailRecord?.linkedUserId && emailRecord.linkedUserId !== matched?._id) {
      await ctx.db.patch(emailRecord.linkedUserId, { isOfficialCreator: undefined });
    }
    const usernameAccountAfterSave = await ctx.db.query("users")
      .withIndex("by_player_login", (q) => q.eq("playerLogin", normalizedUsername))
      .first();
    const linkedToAccount = usernameAccountAfterSave?.role === "user"
      ? await linkVerifiedCreatorAccount(ctx, usernameAccountAfterSave._id)
      : false;
    return { ok: true, linkedToAccount };
  },
});

/** Remove an approved creator and its badge from the linked player account. */
export const removeOfficialCreator = mutation({
  args: { creatorId: v.id("officialCreators") },
  handler: async (ctx, { creatorId }) => {
    await requireCompanyAdmin(ctx);
    await requirePermissionVerification(ctx);
    const record = await ctx.db.get(creatorId);
    if (!record) return { ok: true };
    if (record.linkedUserId) {
      const user = await ctx.db.get(record.linkedUserId);
      if (user) await ctx.db.patch(user._id, { isOfficialCreator: undefined });
    }
    await ctx.db.delete(creatorId);
    return { ok: true };
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
