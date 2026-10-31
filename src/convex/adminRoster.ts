import { query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireStaffUnlock, staffUnlockState } from "./staffUnlock";

/**
 * Compatibility layer for the previous emailed-code gates. Everything now
 * shares one authenticator-based unlock per signed-in session.
 */

export const rosterStatus = query({
  args: {},
  handler: async (ctx) => {
    const state = await staffUnlockState(ctx);
    return {
      isAdmin: state.isAdmin,
      verifiedUntil: state.verifiedUntil,
      permissionVerifiedUntil: state.verifiedUntil,
      creatorVerifiedUntil: state.verifiedUntil,
    };
  },
});

export const creatorRosterStatus = query({
  args: {},
  handler: async (ctx) => {
    const state = await staffUnlockState(ctx);
    return { canManage: state.canAct, verifiedUntil: state.verifiedUntil };
  },
});

export async function requireRosterVerification(ctx: QueryCtx | MutationCtx) {
  const state = await requireStaffUnlock(ctx);
  if (!state.isAdmin) throw new Error("Verified administrator access is required.");
}

export async function requirePermissionVerification(ctx: QueryCtx | MutationCtx) {
  const state = await requireStaffUnlock(ctx);
  if (!state.isAdmin) throw new Error("Verified administrator access is required.");
}

export async function requireCreatorManagementAuthorization(ctx: QueryCtx | MutationCtx) {
  await requireStaffUnlock(ctx);
}

export async function requireCreatorVerification(ctx: QueryCtx | MutationCtx) {
  await requireStaffUnlock(ctx);
}
