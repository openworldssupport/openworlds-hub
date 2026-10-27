import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireSiteAvailable } from "./siteStatus";

const MAX_SAVE_BYTES = 64 * 1024;
const saveState = v.object({ version: v.number(), data: v.any() });

async function requirePlayer(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in to access player data.");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "user" || user.isSiteBanned) throw new Error("Player account required.");
  if (!user.recoveryEmail || user.recoveryEmailVerifiedAt === undefined) {
    throw new Error("Verify your recovery email to access your player account and saved game data.");
  }
  return { userId, user };
}

/** Search publicly published worlds by title. */
export const searchPublishedWorlds = query({
  args: { search: v.string() },
  handler: async (ctx, { search }) => {
    await requireSiteAvailable(ctx);
    const term = search.trim();
    if (term.length < 2) return [];
    const worlds = await ctx.db.query("publishedWorlds")
      .withSearchIndex("search_published_worlds", (q) => q.search("title", term))
      .take(20);
    const owners = await Promise.all(worlds.map((world) => ctx.db.get(world.ownerId)));
    const results = await Promise.all(worlds.map(async (world, index) => {
      const owner = owners[index];
      if (!owner || owner.isSiteBanned) return null;
      return {
        id: world._id,
        title: world.title,
        description: world.description,
        image: world.imageStorageIds?.[0] ? await ctx.storage.getUrl(world.imageStorageIds[0]) : null,
        ownerUsername: owner.profileDiscoverable && owner.recoveryEmailVerifiedAt !== undefined ? owner.playerLogin ?? null : null,
      };
    }));
    return results.filter((world) => world !== null);
  },
});

/** Public details for a single published world. */
export const publishedWorldDetails = query({
  args: { worldId: v.id("publishedWorlds") },
  handler: async (ctx, { worldId }) => {
    await requireSiteAvailable(ctx);
    const world = await ctx.db.get(worldId);
    if (!world) return null;
    const owner = await ctx.db.get(world.ownerId);
    if (!owner || owner.isSiteBanned) return null;
    return {
      id: world._id,
      title: world.title,
      description: world.description,
      images: (await Promise.all((world.imageStorageIds ?? []).map((storageId) => ctx.storage.getUrl(storageId)))).filter((url): url is string => Boolean(url)),
      createdAt: world.createdAt,
      ownerUsername: owner.profileDiscoverable && owner.recoveryEmailVerifiedAt !== undefined ? owner.playerLogin ?? null : null,
    };
  },
});

/** Publish a real world listing under the authenticated player's account. */
export const playerMediaUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    await requirePlayer(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const finalizePlayerImage = mutation({
  args: { storageId: v.id("_storage"), kind: v.union(v.literal("profile"), v.literal("world")) },
  handler: async (ctx, { storageId, kind }) => {
    await requireSiteAvailable(ctx);
    const { userId, user } = await requirePlayer(ctx);
    const metadata = await ctx.db.system.get("_storage", storageId);
    if (!metadata || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(metadata.contentType ?? "")) {
      if (metadata) await ctx.storage.delete(storageId);
      throw new Error("Choose a valid image file.");
    }
    if (metadata.size > 5 * 1024 * 1024) {
      await ctx.storage.delete(storageId);
      throw new Error("Images must be 5 MB or smaller.");
    }
    const existing = await ctx.db.query("playerMedia").withIndex("by_storage_id", (q) => q.eq("storageId", storageId)).unique();
    if (existing && (existing.ownerId !== userId || existing.kind !== kind)) throw new Error("This upload belongs to another account or purpose.");
    if (!existing) await ctx.db.insert("playerMedia", { storageId, ownerId: userId, kind, createdAt: Date.now() });
    if (kind === "profile") {
      if (user.profileImageStorageId && user.profileImageStorageId !== storageId) {
        const previous = await ctx.db.query("playerMedia").withIndex("by_storage_id", (q) => q.eq("storageId", user.profileImageStorageId!)).unique();
        if (previous?.ownerId === userId && previous.kind === "profile") {
          await ctx.storage.delete(user.profileImageStorageId);
          await ctx.db.delete(previous._id);
        }
      }
      await ctx.db.patch(userId, { profileImageStorageId: storageId });
    }
    return { url: await ctx.storage.getUrl(storageId) };
  },
});

export const myPublishedWorlds = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const { userId } = await requirePlayer(ctx);
    const worlds = await ctx.db.query("publishedWorlds").withIndex("by_owner", (q) => q.eq("ownerId", userId)).order("desc").take(50);
    return await Promise.all(worlds.map(async (world) => ({
      id: world._id,
      title: world.title,
      description: world.description,
      image: world.imageStorageIds?.[0] ? await ctx.storage.getUrl(world.imageStorageIds[0]) : null,
      createdAt: world.createdAt,
    })));
  },
});

export const publishWorld = mutation({
  args: { title: v.string(), description: v.string(), imageStorageIds: v.optional(v.array(v.id("_storage"))) },
  handler: async (ctx, { title, description, imageStorageIds = [] }) => {
    await requireSiteAvailable(ctx);
    const { userId } = await requirePlayer(ctx);
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (cleanTitle.length < 2 || cleanTitle.length > 60) throw new Error("World title must be 2–60 characters.");
    if (cleanDescription.length > 1000) throw new Error("Description must be 1,000 characters or fewer.");
    if (imageStorageIds.length > 5 || new Set(imageStorageIds).size !== imageStorageIds.length) throw new Error("Choose up to 5 unique world images.");
    for (const storageId of imageStorageIds) {
      const asset = await ctx.db.query("playerMedia").withIndex("by_storage_id", (q) => q.eq("storageId", storageId)).unique();
      if (!asset || asset.ownerId !== userId || asset.kind !== "world" || asset.worldId) throw new Error("One or more world images are invalid or already used.");
    }
    const worldId = await ctx.db.insert("publishedWorlds", {
      ownerId: userId,
      title: cleanTitle,
      description: cleanDescription,
      imageStorageIds,
      createdAt: Date.now(),
    });
    for (const storageId of imageStorageIds) {
      const asset = await ctx.db.query("playerMedia").withIndex("by_storage_id", (q) => q.eq("storageId", storageId)).unique();
      if (asset) await ctx.db.patch(asset._id, { worldId });
    }
    return { ok: true, worldId };
  },
});

/** Current player's private profile and save data. */
export const myGameData = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const { userId, user } = await requirePlayer(ctx);
    const saved = await ctx.db.query("playerGameData").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    return {
      displayName: user.name ?? saved?.displayName ?? "Player",
      save: saved?.state ?? null,
      updatedAt: saved?.updatedAt ?? null,
    };
  },
});

/** Update the display name on the authenticated player's own account. */
export const updateProfile = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, { displayName }) => {
    await requireSiteAvailable(ctx);
    const { userId } = await requirePlayer(ctx);
    const name = displayName.trim();
    if (name.length < 2 || name.length > 32) throw new Error("Player name must be 2–32 characters.");
    await ctx.db.patch(userId, { name, profileDiscoverable: true });
    const saved = await ctx.db.query("playerGameData").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (saved) await ctx.db.patch(saved._id, { displayName: name, updatedAt: Date.now() });
    return { displayName: name };
  },
});

/** Store the caller's save only; user IDs are derived from the verified session. */
export const saveGame = mutation({
  args: { state: saveState },
  handler: async (ctx, { state }) => {
    await requireSiteAvailable(ctx);
    const { userId, user } = await requirePlayer(ctx);
    const serialized = JSON.stringify(state);
    if (new TextEncoder().encode(serialized).byteLength > MAX_SAVE_BYTES) {
      throw new Error("Game saves must be 64 KB or smaller.");
    }
    if (!Number.isSafeInteger(state.version) || state.version !== 1) throw new Error("Unsupported save version.");

    const existing = await ctx.db.query("playerGameData").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { state, updatedAt: now });
    } else {
      await ctx.db.insert("playerGameData", {
        userId,
        displayName: user.name ?? "Player",
        state,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { savedAt: now };
  },
});
