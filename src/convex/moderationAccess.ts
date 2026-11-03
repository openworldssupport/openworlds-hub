import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireStaffUnlock } from "./staffUnlock";

/**
 * Moderation is limited to the right department and position, not merely any
 * staff account. Administrators retain full access.
 *
 * Examples:
 * - Faction + Community Moderator: view and act
 * - Faction + Moderation Appeals Reviewer: view, act and review appeals
 * - Trust & Safety / Moderation + Trust & Safety Moderator: view and act
 * - Player Support & Service + Support Escalations Coordinator: view only
 */
const MODERATION_DEPARTMENT = /(faction|trust\s*&\s*safety|moderation|community|player support|support)/i;
const MODERATION_POSITION = /(moderator|moderation|trust\s*&\s*safety|safety|appeals|community manager|head of community|community operations|support escalations|support lead)/i;
const ACTION_POSITION = /(moderator|moderation|trust\s*&\s*safety|safety|appeals|head of community|community manager|lead)/i;
const APPEAL_POSITION = /(appeals|moderator|moderation|trust\s*&\s*safety|safety|head of community|community manager|lead)/i;

export type ModerationAccess = {
  isAdmin: boolean;
  canView: boolean;
  canAct: boolean;
  canReviewAppeals: boolean;
  canPermanentBan: boolean;
};

function text(value?: string | null) {
  return value?.trim() ?? "";
}

export function moderationAccess(user: Doc<"users"> | null | undefined): ModerationAccess {
  if (!user) return { isAdmin: false, canView: false, canAct: false, canReviewAppeals: false, canPermanentBan: false };
  const isAdmin = user.role === "admin" || user.email?.trim().toLowerCase() === "contact@openworlds.dk";
  if (isAdmin) return { isAdmin: true, canView: true, canAct: true, canReviewAppeals: true, canPermanentBan: true };

  const department = text(user.department);
  const position = text(user.position);
  const verifiedStaff = user.emailVerificationTime !== undefined &&
    !user.isSiteBanned &&
    Boolean(user.staffAccess || department || position);
  if (!verifiedStaff) return { isAdmin: false, canView: false, canAct: false, canReviewAppeals: false, canPermanentBan: false };

  const departmentMatches = MODERATION_DEPARTMENT.test(department);
  const positionMatches = MODERATION_POSITION.test(position);
  const canView = departmentMatches && positionMatches;
  const canAct = departmentMatches && ACTION_POSITION.test(position);
  const canReviewAppeals = departmentMatches && APPEAL_POSITION.test(position);
  return { isAdmin: false, canView, canAct, canReviewAppeals, canPermanentBan: false };
}

export async function requireModerationViewer(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  if (!user || !moderationAccess(user).canView) {
    throw new Error("Your department or position does not include moderation access.");
  }
  return user;
}

export async function requireModerationActor(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const user = await requireModerationViewer(ctx);
  if (!moderationAccess(user).canAct) {
    throw new Error("Your position can view moderation cases but cannot issue warnings or bans.");
  }
  await requireStaffUnlock(ctx);
  return user;
}

export async function requireAppealReviewer(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const user = await requireModerationViewer(ctx);
  if (!moderationAccess(user).canReviewAppeals) {
    throw new Error("Your position can view moderation cases but cannot decide appeals.");
  }
  await requireStaffUnlock(ctx);
  return user;
}
