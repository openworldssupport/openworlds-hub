import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { deriveBadge, isEmailAddress } from "../lib/staff";
import { requireSiteAvailable } from "./siteStatus";
import { requireCompanyAdmin } from "./admin";
import { requireCreatorManagementAuthorization, requireCreatorVerification, requirePermissionVerification } from "./adminRoster";

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
    const creators = await Promise.all(records.map(async (record, index) => {
      const linkedUser = linkedUsers[index];
      if (linkedUser?.isSiteBanned) return null;
      return {
        username: record.username,
        displayName: record.displayName,
        image: linkedUser?.profileImageStorageId ? await ctx.storage.getUrl(linkedUser.profileImageStorageId) : linkedUser?.image ?? null,
        socialPlatform: record.socialPlatform ?? null,
        socialUrl: record.socialUrl ?? null,
      };
    }));
    const visibleCreators = creators.filter((creator) => creator !== null);
    const knownUsernames = new Set(visibleCreators.map((creator) => creator.username.toLowerCase()));
    const legacyCreators = await ctx.db.query("users")
      .withIndex("by_official_creator", (q) => q.eq("isOfficialCreator", true))
      .collect();
    for (const creator of legacyCreators) {
      const username = creator.playerLogin?.trim();
      if (creator.emailVerificationTime === undefined || creator.isSiteBanned || !username || knownUsernames.has(username.toLowerCase())) continue;
      visibleCreators.push({ username, displayName: username, image: creator.profileImageStorageId ? await ctx.storage.getUrl(creator.profileImageStorageId) : creator.image ?? null, socialPlatform: null, socialUrl: null });
      knownUsernames.add(username.toLowerCase());
    }
    return visibleCreators.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

/** Staff creator roster. Private contact emails are not returned. */
/** Access check and own-profile details for the private Creator Space. */
export const creatorSpaceAccess = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) return { allowed: false as const, accessLevel: null, creatorProfile: null };

    const user = await ctx.db.get(userId);
    if (!user || user.isSiteBanned) return { allowed: false as const, accessLevel: null, creatorProfile: null };

    const isAdmin = user.emailVerificationTime !== undefined &&
      (user.role === "admin" || user.email?.trim().toLowerCase() === "support@openworlds.dk");
    const isStaff = user.emailVerificationTime !== undefined &&
      Boolean(user.staffAccess || user.department?.trim() || user.position?.trim());
    const creatorRecord = user.role === "user" && user.recoveryEmailVerifiedAt !== undefined
      ? await ctx.db.query("officialCreators")
        .withIndex("by_linked_user", (q) => q.eq("linkedUserId", userId))
        .first()
      : null;
    const isCreator = Boolean(creatorRecord);
    const accessLevel = isAdmin ? "admin" as const : isStaff ? "staff" as const : isCreator ? "creator" as const : null;

    if (!accessLevel) return { allowed: false as const, accessLevel: null, creatorProfile: null };

    const record = creatorRecord;

    return {
      allowed: true as const,
      accessLevel,
      creatorProfile: record ? {
        username: record.username,
        displayName: record.displayName,
        socialPlatform: record.socialPlatform ?? null,
        socialUrl: record.socialUrl ?? null,
      } : null,
    };
  },
});

export const staffOfficialCreators = query({
  args: {},
  handler: async (ctx) => {
    await requireCreatorVerification(ctx);
    return (await ctx.db.query("officialCreators").collect())
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map(({ _id, username, displayName, socialPlatform, socialUrl, linkedUserId }) => ({
        _id,
        username,
        displayName,
        socialPlatform: socialPlatform ?? null,
        socialUrl: socialUrl ?? null,
        isLinked: Boolean(linkedUserId),
      }));
  },
});

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
    await requireCreatorManagementAuthorization(ctx);
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
    if (!matched) throw new Error("The email must be verified on the OpenWorlds account with this username before the creator badge can be approved.");
    if (matched.isSiteBanned) throw new Error("This account is restricted and cannot be verified as a creator.");
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
    await requireCreatorManagementAuthorization(ctx);
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

function isPublicCompanyStaff(user: {
  emailVerificationTime?: number;
  isSiteBanned?: boolean;
  role?: string;
  staffAccess?: boolean;
  department?: string;
  position?: string;
}) {
  return user.emailVerificationTime !== undefined && !user.isSiteBanned &&
    (user.role === "admin" || user.staffAccess === true || Boolean(user.department?.trim() || user.position?.trim()));
}

export const publicPlayerProfile = query({
  args: { username: v.string() },
  handler: async (ctx, { username: rawUsername }) => {
    await requireSiteAvailable(ctx);
    const identifier = rawUsername.trim().replace(/^@/, "");
    if (!identifier || identifier.length > 64) return null;
    const staffProfileId = identifier.startsWith("staff-")
      ? ctx.db.normalizeId("users", identifier.slice("staff-".length))
      : null;
    const username = identifier.toLowerCase();
    const user = staffProfileId
      ? await ctx.db.get(staffProfileId)
      : await ctx.db.query("users")
        .withIndex("by_player_login", (q) => q.eq("playerLogin", username))
        .unique();
    if (!user || user.isSiteBanned) return null;
    const isCompanyStaff = isPublicCompanyStaff(user);
    const isVerifiedPlayer = user.role === "user" && user.recoveryEmailVerifiedAt !== undefined;
    if (!isCompanyStaff && !isVerifiedPlayer) return null;
    const officialCreator = await ctx.db.query("officialCreators")
      .withIndex("by_linked_user", (q) => q.eq("linkedUserId", user._id))
      .first();
    if (!user.profileDiscoverable && !officialCreator && !isCompanyStaff) return null;
    const publicName = isCompanyStaff
      ? [user.nickname, user.name].find((value) => value?.trim() && !isEmailAddress(value))?.trim() ?? null
      : isEmailAddress(user.name) ? officialCreator?.displayName ?? null : user.name?.trim() || officialCreator?.displayName || null;
    return {
      username: user.playerLogin?.trim() ?? null,
      profileKey: user.playerLogin?.trim() ?? `staff-${user._id}`,
      hasPlayerAccount: user.role === "user" && Boolean(user.playerLogin?.trim()),
      displayName: publicName,
      image: user.profileImageStorageId ? await ctx.storage.getUrl(user.profileImageStorageId) : user.image ?? null,
      about: user.publicBio?.trim() ?? "",
      socialPlatform: officialCreator?.socialPlatform ?? null,
      socialUrl: officialCreator?.socialUrl ?? null,
      isOfficialCreator: Boolean(officialCreator) || user.isOfficialCreator === true,
      isCompanyStaff,
      publicBadge: isCompanyStaff ? user.publicBadge ?? deriveBadge(user.department, user.position) : null,
      friendsVisible: user.profileFriendsVisible === true,
      friendCount: user.profileFriendsVisible === true
        ? new Set([
          ...(await ctx.db.query("friendRequests").withIndex("by_sender", (q) => q.eq("senderId", user._id)).collect()).filter((r) => r.status === "accepted").map((r) => r.receiverId),
          ...(await ctx.db.query("friendRequests").withIndex("by_receiver", (q) => q.eq("receiverId", user._id)).collect()).filter((r) => r.status === "accepted").map((r) => r.senderId),
        ]).size
        : null,
    };
  },
});

async function findPlayerByUsername(ctx: MutationCtx, rawUsername: string) {
  const username = rawUsername.trim().replace(/^@/, "").toLowerCase();
  if (!username || username.length > 32) return null;
  return await ctx.db.query("users").withIndex("by_player_login", (q) => q.eq("playerLogin", username)).unique();
}

async function requireVerifiedPlayer(ctx: MutationCtx) {
  await requireSiteAvailable(ctx);
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  if (!user || user.role !== "user" || user.isSiteBanned || !user.recoveryEmail || user.recoveryEmailVerifiedAt === undefined) {
    throw new Error("A signed-in player with a verified recovery email is required.");
  }
  return user;
}

function acceptedFriendship(a: string, b: string, requests: Array<{ senderId: string; receiverId: string; status: string }>) {
  return requests.some((request) => request.status === "accepted" &&
    ((request.senderId === a && request.receiverId === b) || (request.senderId === b && request.receiverId === a)));
}

export const friendStatus = query({
  args: { username: v.string() },
  handler: async (ctx, { username: rawUsername }) => {
    await requireSiteAvailable(ctx);
    const username = rawUsername.trim().replace(/^@/, "").toLowerCase();
    const target = await ctx.db.query("users").withIndex("by_player_login", (q) => q.eq("playerLogin", username)).unique();
    if (!target || target.role !== "user" || target.isSiteBanned || !target.profileDiscoverable || !target.recoveryEmail || target.recoveryEmailVerifiedAt === undefined) return { status: "unavailable" as const };
    const viewerId = await getAuthUserId(ctx);
    if (!viewerId) return { status: "signed-out" as const };
    if (viewerId === target._id) return { status: "self" as const };
    const viewer = await ctx.db.get(viewerId);
    if (!viewer || viewer.role !== "user" || viewer.isSiteBanned || !viewer.recoveryEmail || viewer.recoveryEmailVerifiedAt === undefined) return { status: "unavailable" as const };
    const [outgoing, incoming] = await Promise.all([
      ctx.db.query("friendRequests").withIndex("by_sender", (q) => q.eq("senderId", viewerId)).collect(),
      ctx.db.query("friendRequests").withIndex("by_receiver", (q) => q.eq("receiverId", viewerId)).collect(),
    ]);
    const relation = [...outgoing, ...incoming].find((r) =>
      (r.senderId === viewerId && r.receiverId === target._id) || (r.senderId === target._id && r.receiverId === viewerId));
    if (!relation) return { status: "none" as const };
    if (relation.status === "accepted") return { status: "friends" as const };
    return { status: relation.senderId === viewerId ? "outgoing" as const : "incoming" as const, requestId: relation._id };
  },
});

export const sendFriendRequest = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const sender = await requireVerifiedPlayer(ctx);
    const receiver = await findPlayerByUsername(ctx, username);
    if (!receiver || receiver.role !== "user" || receiver.isSiteBanned || !receiver.profileDiscoverable || receiver.recoveryEmailVerifiedAt === undefined) throw new Error("That player is not available for friend requests.");
    if (sender._id === receiver._id) throw new Error("You cannot send a friend request to yourself.");
    const [outgoing, incoming] = await Promise.all([
      ctx.db.query("friendRequests").withIndex("by_sender", (q) => q.eq("senderId", sender._id)).collect(),
      ctx.db.query("friendRequests").withIndex("by_receiver", (q) => q.eq("receiverId", sender._id)).collect(),
    ]);
    const existing = [...outgoing, ...incoming].find((r) =>
      (r.senderId === sender._id && r.receiverId === receiver._id) || (r.senderId === receiver._id && r.receiverId === sender._id));
    if (existing) {
      if (existing.status === "accepted") return { status: "friends" as const };
      if (existing.status === "pending") return { status: existing.senderId === sender._id ? "outgoing" as const : "incoming" as const };
      await ctx.db.delete(existing._id);
    }
    const pendingOutgoing = outgoing.filter((request) => request.status === "pending");
    if (pendingOutgoing.length >= 20) throw new Error("You have reached the limit of 20 pending friend requests. Cancel or resolve some first.");
    const now = Date.now();
    await ctx.db.insert("friendRequests", { senderId: sender._id, receiverId: receiver._id, status: "pending", createdAt: now, updatedAt: now });
    return { status: "outgoing" as const };
  },
});

export const respondToFriendRequest = mutation({
  args: { requestId: v.id("friendRequests"), accept: v.boolean() },
  handler: async (ctx, { requestId, accept }) => {
    const user = await requireVerifiedPlayer(ctx);
    const request = await ctx.db.get(requestId);
    if (!request || request.receiverId !== user._id || request.status !== "pending") throw new Error("This friend request is no longer available.");
    await ctx.db.patch(requestId, { status: accept ? "accepted" : "declined", updatedAt: Date.now() });
    return { status: accept ? "friends" as const : "declined" as const };
  },
});

export const removeFriend = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await requireVerifiedPlayer(ctx);
    const other = await findPlayerByUsername(ctx, username);
    if (!other) return { ok: true };
    const outgoing = await ctx.db.query("friendRequests").withIndex("by_sender", (q) => q.eq("senderId", user._id)).collect();
    const incoming = await ctx.db.query("friendRequests").withIndex("by_receiver", (q) => q.eq("receiverId", user._id)).collect();
    const relation = [...outgoing, ...incoming].find((r) =>
      r.status === "accepted" && ((r.senderId === user._id && r.receiverId === other._id) || (r.senderId === other._id && r.receiverId === user._id)));
    if (relation) await ctx.db.delete(relation._id);
    return { ok: true };
  },
});

export const myFriends = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!user || user.role !== "user" || user.isSiteBanned || !user.recoveryEmail || user.recoveryEmailVerifiedAt === undefined) return null;
    const [outgoing, incoming] = await Promise.all([
      ctx.db.query("friendRequests").withIndex("by_sender", (q) => q.eq("senderId", userId!)).collect(),
      ctx.db.query("friendRequests").withIndex("by_receiver", (q) => q.eq("receiverId", userId!)).collect(),
    ]);
    const requests = [...outgoing, ...incoming];
    const friendIds = [...new Set(requests.filter((r) => r.status === "accepted").map((r) => r.senderId === userId ? r.receiverId : r.senderId))];
    const pending = requests.filter((r) => r.status === "pending" && r.receiverId === userId);
    const friends = await Promise.all(friendIds.map((id) => ctx.db.get(id)));
    const requestsWithUsers = await Promise.all(pending.map(async (request) => ({ requestId: request._id, user: await ctx.db.get(request.senderId) })));
    const safeProfile = (friend: typeof friends[number]) => friend && friend.role === "user" && !friend.isSiteBanned && friend.playerLogin?.trim() ? {
      username: friend.playerLogin.trim(),
      displayName: isEmailAddress(friend.name) ? null : friend.name?.trim() || null,
      image: friend.profileImageStorageId ? null : friend.image ?? null,
    } : null;
    const friendProfiles = await Promise.all(friends.map(async (friend) => {
      if (!friend || friend.role !== "user" || friend.isSiteBanned || !friend.profileDiscoverable || !friend.playerLogin?.trim()) return null;
      return {
        username: friend.playerLogin.trim(),
        displayName: isEmailAddress(friend.name) ? null : friend.name?.trim() || null,
        image: friend.profileImageStorageId ? await ctx.storage.getUrl(friend.profileImageStorageId) : friend.image ?? null,
      };
    }));
    return {
      friends: friendProfiles.filter((friend): friend is NonNullable<typeof friend> => friend !== null),
      requests: requestsWithUsers.flatMap(({ requestId, user: sender }) => { const profile = safeProfile(sender); return profile ? [{ requestId, ...profile }] : []; }),
    };
  },
});

export const publicFriendList = query({
  args: { username: v.string() },
  handler: async (ctx, { username: rawUsername }) => {
    await requireSiteAvailable(ctx);
    const username = rawUsername.trim().replace(/^@/, "").toLowerCase();
    const owner = await ctx.db.query("users").withIndex("by_player_login", (q) => q.eq("playerLogin", username)).unique();
    if (!owner || owner.role !== "user" || owner.isSiteBanned || !owner.profileDiscoverable || owner.profileFriendsVisible !== true || !owner.recoveryEmail || owner.recoveryEmailVerifiedAt === undefined) return [];
    const outgoing = await ctx.db.query("friendRequests").withIndex("by_sender", (q) => q.eq("senderId", owner._id)).collect();
    const incoming = await ctx.db.query("friendRequests").withIndex("by_receiver", (q) => q.eq("receiverId", owner._id)).collect();
    const ids = [...new Set([...outgoing, ...incoming].filter((r) => r.status === "accepted").map((r) => r.senderId === owner._id ? r.receiverId : r.senderId))];
    const friends = await Promise.all(ids.map((id) => ctx.db.get(id)));
    const visibleFriends = friends.filter((friend) => friend && friend.role === "user" && !friend.isSiteBanned && friend.profileDiscoverable && friend.recoveryEmail && friend.recoveryEmailVerifiedAt !== undefined && friend.playerLogin?.trim());
    return await Promise.all(visibleFriends.map(async (friend) => ({
      username: friend!.playerLogin!.trim(),
      displayName: isEmailAddress(friend!.name) ? null : friend!.name?.trim() || null,
      image: friend!.profileImageStorageId ? await ctx.storage.getUrl(friend!.profileImageStorageId) : friend!.image ?? null,
    })));
  },
});

export const sendPlayerMessage = mutation({
  args: { username: v.string(), body: v.string() },
  handler: async (ctx, { username, body }) => {
    const sender = await requireVerifiedPlayer(ctx);
    const receiver = await findPlayerByUsername(ctx, username);
    if (!receiver || receiver.role !== "user" || receiver.isSiteBanned || !receiver.profileDiscoverable || !receiver.recoveryEmail || receiver.recoveryEmailVerifiedAt === undefined || receiver._id === sender._id) throw new Error("This player cannot receive messages.");
    const outgoing = await ctx.db.query("friendRequests").withIndex("by_sender", (q) => q.eq("senderId", sender._id)).collect();
    const incoming = await ctx.db.query("friendRequests").withIndex("by_receiver", (q) => q.eq("receiverId", sender._id)).collect();
    if (!acceptedFriendship(sender._id, receiver._id, [...outgoing, ...incoming])) throw new Error("You can message this player only after they accept your friend request.");
    const cleanBody = body.trim();
    if (!cleanBody || cleanBody.length > 2000) throw new Error("Message must be 1–2,000 characters.");
    const recentMessages = await ctx.db.query("playerMessages")
      .withIndex("by_sender_created", (q) => q.eq("senderId", sender._id).gte("createdAt", Date.now() - 10 * 60 * 1000))
      .take(30);
    if (recentMessages.length >= 20) throw new Error("You are sending messages too quickly. Please try again later.");
    const [participantA, participantB] = [sender._id, receiver._id].sort((a, b) => String(a).localeCompare(String(b)));
    return await ctx.db.insert("playerMessages", { participantA, participantB, senderId: sender._id, receiverId: receiver._id, body: cleanBody, createdAt: Date.now() });
  },
});

export const playerConversation = query({
  args: { username: v.string() },
  handler: async (ctx, { username: rawUsername }) => {
    await requireSiteAvailable(ctx);
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    const other = await ctx.db.query("users").withIndex("by_player_login", (q) => q.eq("playerLogin", rawUsername.trim().replace(/^@/, "").toLowerCase())).unique();
    if (!user || user.role !== "user" || user.isSiteBanned || !user.recoveryEmail || user.recoveryEmailVerifiedAt === undefined || !other || other.role !== "user" || other.isSiteBanned || !other.recoveryEmail || other.recoveryEmailVerifiedAt === undefined || other._id === user._id) return null;
    const outgoing = await ctx.db.query("friendRequests").withIndex("by_sender", (q) => q.eq("senderId", user._id)).collect();
    const incoming = await ctx.db.query("friendRequests").withIndex("by_receiver", (q) => q.eq("receiverId", user._id)).collect();
    if (!acceptedFriendship(user._id, other._id, [...outgoing, ...incoming])) return null;
    const [participantA, participantB] = [user._id, other._id].sort((a, b) => String(a).localeCompare(String(b)));
    const messages = await ctx.db.query("playerMessages").withIndex("by_pair_created", (q) => q.eq("participantA", participantA).eq("participantB", participantB)).order("desc").take(100);
    return {
      username: other.playerLogin?.trim() ?? "Player",
      messages: messages.reverse().map((message) => ({ body: message.body, sentByMe: message.senderId === user._id, createdAt: message.createdAt })),
    };
  },
});

export const searchPlayerProfiles = query({
  args: { search: v.string() },
  handler: async (ctx, { search }) => {
    await requireSiteAvailable(ctx);
    const term = search.trim().replace(/^@/, "").slice(0, 80);
    if (term.length < 2) return [];
    const [usernameMatches, nameMatches, nicknameMatches] = await Promise.all([
      ctx.db.query("users")
        .withSearchIndex("search_player_profiles", (q) => q.search("playerLogin", term))
        .take(50),
      ctx.db.query("users")
        .withSearchIndex("search_player_display_names", (q) => q.search("name", term))
        .take(50),
      ctx.db.query("users")
        .withSearchIndex("search_public_nicknames", (q) => q.search("nickname", term))
        .take(50),
    ]);
    const unique = new Map([...usernameMatches, ...nameMatches, ...nicknameMatches].map((user) => [user._id, user]));
    const normalizedTerm = term.toLowerCase();
    const matches = [...unique.values()]
      .filter((user) => {
        if (user.isSiteBanned) return false;
        return isPublicCompanyStaff(user) || (user.role === "user" && user.profileDiscoverable === true && user.recoveryEmailVerifiedAt !== undefined && Boolean(user.playerLogin?.trim()));
      })
      .map((user) => {
        const username = user.playerLogin?.trim() ?? null;
        const isCompanyStaff = isPublicCompanyStaff(user);
        const displayName = isCompanyStaff
          ? [user.nickname, user.name].find((value) => value?.trim() && !isEmailAddress(value))?.trim() ?? null
          : isEmailAddress(user.name) ? null : user.name?.trim() || null;
        const normalizedUsername = username?.toLowerCase() ?? "";
        const normalizedName = displayName?.toLowerCase() ?? "";
        const exact = normalizedUsername === normalizedTerm || normalizedName === normalizedTerm;
        const startsWith = normalizedUsername.startsWith(normalizedTerm) || normalizedName.startsWith(normalizedTerm);
        return {
          username,
          profileKey: username ?? `staff-${user._id}`,
          hasPlayerAccount: user.role === "user" && Boolean(username),
          displayName,
          imageStorageId: user.profileImageStorageId,
          fallbackImage: user.image ?? null,
          isOfficialCreator: user.isOfficialCreator === true,
          isCompanyStaff,
          publicBadge: isCompanyStaff ? user.publicBadge ?? deriveBadge(user.department, user.position) : null,
          exact,
          rank: exact ? 0 : startsWith ? 1 : 2,
        };
      })
      .sort((a, b) => a.rank - b.rank || (a.displayName ?? a.username ?? a.profileKey).localeCompare(b.displayName ?? b.username ?? b.profileKey))
      .slice(0, 40);
    return await Promise.all(matches.map(async ({ rank: _rank, imageStorageId, fallbackImage, ...profile }) => ({
      ...profile,
      image: imageStorageId ? await ctx.storage.getUrl(imageStorageId) : fallbackImage,
    })));
  },
});

/** Search player accounts for staff creator verification; never returns private emails. */
export const searchPlayersForCreatorVerification = query({
  args: { search: v.string() },
  handler: async (ctx, { search }) => {
    await requireCreatorVerification(ctx);
    const term = search.trim().replace(/^@/, "").slice(0, 80);
    if (term.length < 2) return [];
    const [usernameMatches, nameMatches] = await Promise.all([
      ctx.db.query("users")
        .withSearchIndex("search_players_by_username", (q) => q.search("playerLogin", term).eq("role", "user"))
        .take(50),
      ctx.db.query("users")
        .withSearchIndex("search_players_by_name", (q) => q.search("name", term).eq("role", "user"))
        .take(50),
    ]);
    const unique = new Map([...usernameMatches, ...nameMatches].map((user) => [user._id, user]));
    const normalizedTerm = term.toLowerCase();
    return [...unique.values()]
      .filter((user) => user.role === "user" && !user.isAnonymous && !user.isSiteBanned && user.recoveryEmailVerifiedAt !== undefined && Boolean(user.playerLogin?.trim()))
      .map((user) => {
        const username = user.playerLogin!.trim();
        const displayName = isEmailAddress(user.name) ? null : user.name?.trim() || null;
        const normalizedUsername = username.toLowerCase();
        const normalizedName = displayName?.toLowerCase() ?? "";
        const exact = normalizedUsername === normalizedTerm || normalizedName === normalizedTerm;
        const startsWith = normalizedUsername.startsWith(normalizedTerm) || normalizedName.startsWith(normalizedTerm);
        return {
          username,
          displayName,
          isOfficialCreator: user.isOfficialCreator === true,
          exact,
          rank: exact ? 0 : startsWith ? 1 : 2,
        };
      })
      .sort((a, b) => a.rank - b.rank || a.username.localeCompare(b.username))
      .slice(0, 40)
      .map(({ rank: _rank, ...player }) => player);
  },
});

export const currentProfilePrivacy = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "user") return null;
    return {
      discoverable: user.profileDiscoverable === true,
      recoveryEmailVerified: Boolean(user.recoveryEmail && user.recoveryEmailVerifiedAt !== undefined),
      displayName: isEmailAddress(user.name) ? "" : user.name?.trim() ?? "",
      about: user.publicBio ?? "",
      friendsVisible: user.profileFriendsVisible === true,
      profileImage: user.profileImageStorageId ? await ctx.storage.getUrl(user.profileImageStorageId) : user.image ?? null,
    };
  },
});

export const updatePublicProfile = mutation({
  args: { displayName: v.string(), about: v.string(), friendsVisible: v.boolean() },
  handler: async (ctx, args) => {
    await requireSiteAvailable(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to update your profile.");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "user" || user.isSiteBanned) throw new Error("Player account required.");
    if (!user.recoveryEmail || user.recoveryEmailVerifiedAt === undefined) throw new Error("Verify your recovery email first.");
    const displayName = args.displayName.trim();
    const about = args.about.trim();
    if (displayName.length < 2 || displayName.length > 32) throw new Error("Display name must be 2–32 characters.");
    if (about.length > 500) throw new Error("About me must be 500 characters or fewer.");
    await ctx.db.patch(userId, { name: displayName, publicBio: about, profileFriendsVisible: args.friendsVisible });
    const saved = await ctx.db.query("playerGameData").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (saved) await ctx.db.patch(saved._id, { displayName, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const setProfileDiscoverability = mutation({
  args: { discoverable: v.boolean() },
  handler: async (ctx, { discoverable }) => {
    await requireSiteAvailable(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to update your profile privacy.");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "user" || user.isSiteBanned) throw new Error("Player account required.");
    if (!user.recoveryEmail || user.recoveryEmailVerifiedAt === undefined) throw new Error("Verify your recovery email before changing player profile settings.");
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
    const hasCompanyCreatorSpaceAccess = user.emailVerificationTime !== undefined && (
      user.role === "admin" ||
      user.email?.trim().toLowerCase() === "support@openworlds.dk" ||
      user.staffAccess === true ||
      Boolean(user.department?.trim() || user.position?.trim())
    );
    const hasVerifiedCreatorSpaceAccess = user.role === "user" && user.recoveryEmailVerifiedAt !== undefined
      ? Boolean(await ctx.db.query("officialCreators")
        .withIndex("by_linked_user", (q) => q.eq("linkedUserId", userId))
        .first())
      : false;
    const hasCreatorSpaceAccess = !user.isSiteBanned && (hasCompanyCreatorSpaceAccess || hasVerifiedCreatorSpaceAccess);

    return {
      userId: user._id,
      name: isEmailAddress(user.name) ? null : user.name ?? null,
      role: user.role ?? null,
      department: user.department ?? null,
      position: user.position ?? null,
      publicBadge: user.publicBadge ?? null,
      nickname: isEmailAddress(user.nickname) ? null : user.nickname ?? null,
      canAccessCreatorSpace: hasCreatorSpaceAccess,
      ...(user.role === "user" ? {
        playerName: user.name ?? "Player",
        playerUsername: user.playerLogin ?? null,
        isOfficialCreator: user.isOfficialCreator === true,
        recoveryEmailVerified: Boolean(user.recoveryEmail && user.recoveryEmailVerifiedAt !== undefined),
      } : {}),
    };
  },
});
