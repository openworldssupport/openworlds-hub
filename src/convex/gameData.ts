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
    return worlds.flatMap((world, index) => {
      const owner = owners[index];
      if (!owner || owner.isSiteBanned) return [];
      return [{
        id: world._id,
        title: world.title,
        description: world.description,
        ownerUsername: owner.profileDiscoverable && owner.recoveryEmailVerifiedAt !== undefined ? owner.playerLogin ?? null : null,
      }];
    });
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
      createdAt: world.createdAt,
      ownerUsername: owner.profileDiscoverable && owner.recoveryEmailVerifiedAt !== undefined ? owner.playerLogin ?? null : null,
    };
  },
});

/** Publish a real world listing under the authenticated player's account. */
export const publishWorld = mutation({
  args: { title: v.string(), description: v.string() },
  handler: async (ctx, { title, description }) => {
    await requireSiteAvailable(ctx);
    const { userId } = await requirePlayer(ctx);
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (cleanTitle.length < 2 || cleanTitle.length > 60) throw new Error("World title must be 2–60 characters.");
    if (cleanDescription.length > 240) throw new Error("Description must be 240 characters or fewer.");
    await ctx.db.insert("publishedWorlds", {
      ownerId: userId,
      title: cleanTitle,
      description: cleanDescription,
      createdAt: Date.now(),
    });
    return { ok: true };
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
