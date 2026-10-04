/** The verified careers inbox that receives new applications. */
export const CAREERS_EMAIL = "careers@openworlds.dk";

import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/** The verified support address that is allowed to administer the site. */
export const SUPPORT_EMAIL = "support@openworlds.dk";

/**
 * True when the caller is a signed-in admin, or a signed-in user whose verified
 * email is the support address. Read-only, so it works for queries and mutations.
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  const user = await ctx.db.get(userId);
  const isVerifiedSupportAdmin =
    user?.email?.trim().toLowerCase() === SUPPORT_EMAIL && user.emailVerificationTime !== undefined;
  return user?.role === "admin" || Boolean(isVerifiedSupportAdmin);
}

/** Throws unless the caller is authorized to administer the site. */
export async function requireAdmin(ctx: MutationCtx): Promise<void> {
  if (!(await isAdmin(ctx))) throw new Error("Not authorized.");
}
