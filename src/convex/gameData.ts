import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

const MAX_SAVE_BYTES = 64 * 1024;
const saveState = v.object({ version: v.number(), data: v.any() });

async function requirePlayer(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in to access player data.");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "user" || user.isSiteBanned) throw new Error("Player account required.");
  return { userId, user };
}

/** Current player's private profile and save data. */
export const myGameData = query({
  args: {},
  handler: async (ctx) => {
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
    const { userId } = await requirePlayer(ctx);
    const name = displayName.trim();
    if (name.length < 2 || name.length > 32) throw new Error("Player name must be 2–32 characters.");
    await ctx.db.patch(userId, { name });
    const saved = await ctx.db.query("playerGameData").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (saved) await ctx.db.patch(saved._id, { displayName: name, updatedAt: Date.now() });
    return { displayName: name };
  },
});

/** Store the caller's save only; user IDs are derived from the verified session. */
export const saveGame = mutation({
  args: { state: saveState },
  handler: async (ctx, { state }) => {
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
