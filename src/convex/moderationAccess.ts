import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireStaffUnlock } from "./staffUnlock";

/**
 * Moderation is limited to the right department and position, not merely any
 * staff account. Administrators retain full access.
 *
 * Access is intentionally an explicit department + position allowlist rather
 * than a loose keyword check. Only these roles can see moderation cases:
 * - Faction + Community Moderator: view, act and review appeals
 * - Faction or Trust & Safety / Moderation + Trust & Safety Moderator: view, act and review appeals
 * - Faction or Trust & Safety / Moderation + Moderation Appeals Reviewer: view, act and review appeals
 * - Player Support & Service + Support Escalations Coordinator: view reports and bans only
 *
 * Support does not get access to appeal messages or appeal decisions.
 */
const FACTION_DEPARTMENT = /^faction$/i;
const TRUST_DEPARTMENT = /^(trust\s*&\s*safety(?:\s*\/\s*moderation)?|moderation)$/i;
const SUPPORT_DEPARTMENT = /^player support\s*&\s*service$/i;

const COMMUNITY_MODERATOR = /^community moderator$/i;
const TRUST_SAFETY_MODERATOR = /^trust\s*&\s*safety moderator$/i;
const APPEALS_REVIEWER = /^moderation appeals reviewer$/i;
const SUPPORT_ESCALATIONS = /^support escalations coordinator$/i;

export type ModerationAccess = {
  isAdmin: boolean;
  canView: boolean;
  canAct: boolean;
  canViewAppeals: boolean;
  canReviewAppeals: boolean;
  canPermanentBan: boolean;
};

function text(value?: string | null) {
  return value?.trim() ?? "";
}

export function moderationAccess(user: Doc<"users"> | null | undefined): ModerationAccess {
  const none = { isAdmin: false, canView: false, canAct: false, canViewAppeals: false, canReviewAppeals: false, canPermanentBan: false };
  if (!user) return none;
  const isAdmin = user.role === "admin" || user.email?.trim().toLowerCase() === "contact@openworlds.dk";
  if (isAdmin) return { isAdmin: true, canView: true, canAct: true, canViewAppeals: true, canReviewAppeals: true, canPermanentBan: true };

  const department = text(user.department);
  const position = text(user.position);
  const verifiedStaff = user.emailVerificationTime !== undefined &&
    !user.isSiteBanned &&
    Boolean(user.staffAccess || department || position);
  if (!verifiedStaff) return none;

  const isFaction = FACTION_DEPARTMENT.test(department);
  const isTrust = TRUST_DEPARTMENT.test(department);
  const isSupport = SUPPORT_DEPARTMENT.test(department);
  const isModerationDepartment = isFaction || isTrust;

  const communityModerator = isFaction && COMMUNITY_MODERATOR.test(position);
  const trustSafetyModerator = isModerationDepartment && TRUST_SAFETY_MODERATOR.test(position);
  const appealsReviewer = isModerationDepartment && APPEALS_REVIEWER.test(position);
  const supportViewer = isSupport && SUPPORT_ESCALATIONS.test(position);

  const canView = communityModerator || trustSafetyModerator || appealsReviewer || supportViewer;
  const canAct = communityModerator || trustSafetyModerator || appealsReviewer;
  const canViewAppeals = communityModerator || trustSafetyModerator || appealsReviewer;
  const canReviewAppeals = canViewAppeals;
  return { isAdmin: false, canView, canAct, canViewAppeals, canReviewAppeals, canPermanentBan: false };
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
