import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireStaffUnlock } from "./staffUnlock";

/**
 * Moderation is capability-based. Administrators always have every capability;
 * everyone else needs a verified staff account whose exact department and
 * position matches either the built-in role table below or an admin-created
 * override in `moderationRolePermissions`.
 *
 * Capabilities are intentionally narrow:
 * - view:             see reports, accounts, bans and image cases
 * - warn:             issue a warning
 * - suspend:          temporary account restriction (up to 30 days)
 * - ban:              permanent account ban, or a suspension longer than 30 days
 * - ip-ban:           add or lift an IP/CIDR network block
 * - review-appeals:   read and decide appeals
 * - view-audit:       read the moderation audit log
 */
export const MODERATION_CAPABILITIES = [
  "view",
  "warn",
  "suspend",
  "ban",
  "ip-ban",
  "review-appeals",
  "view-audit",
] as const;

export type ModerationCapability = (typeof MODERATION_CAPABILITIES)[number];

export type ModerationAccess = {
  isAdmin: boolean;
  canView: boolean;
  canAct: boolean;
  canWarn: boolean;
  canSuspend: boolean;
  canBan: boolean;
  canPermanentBan: boolean;
  canIpBan: boolean;
  canViewAppeals: boolean;
  canReviewAppeals: boolean;
  canViewAudit: boolean;
  capabilities: ModerationCapability[];
  source: "admin" | "configured" | "default" | "none";
  department: string | null;
  position: string | null;
};

export type DefaultModerationRole = {
  department: string;
  position: string;
  capabilities: ModerationCapability[];
};

const ALL: ModerationCapability[] = [...MODERATION_CAPABILITIES];
const TRUST_LEAD: ModerationCapability[] = ["view", "warn", "suspend", "ban", "ip-ban", "review-appeals", "view-audit"];
const COMMUNITY_MOD: ModerationCapability[] = ["view", "warn", "suspend", "ban", "view-audit"];
const APPEALS: ModerationCapability[] = ["view", "review-appeals", "view-audit"];

/**
 * Sensible starting roles. An administrator can change any of these in the
 * Trust & Safety permissions tab without editing code. These defaults are only
 * used until an override row exists for that exact department + position.
 */
export const DEFAULT_MODERATION_ROLES: DefaultModerationRole[] = [
  // Executive leadership: oversight of every moderation capability.
  { department: "Executive Leadership", position: "Chief Technical Officer (CTO)", capabilities: ALL },
  { department: "Executive Leadership", position: "Chief Operating Officer (COO)", capabilities: ALL },
  { department: "Executive Leadership", position: "Chief Financial Officer (CFO)", capabilities: ALL },
  { department: "Executive Leadership", position: "Chief Marketing Officer (CMO)", capabilities: ALL },
  { department: "Executive Leadership", position: "Executive Strategic & Advisory Board", capabilities: ["view", "view-audit"] },

  // Community operations: the coordinator can act on reports; the other roles
  // have lighter-touch access instead of inheriting every power.
  { department: "Community Operations & Player Engagement", position: "Community Operations Coordinator", capabilities: ["view", "warn", "suspend", "ban", "review-appeals", "view-audit"] },
  { department: "Community Operations & Player Engagement", position: "Community Events Coordinator", capabilities: ["view", "warn", "suspend"] },
  { department: "Community Operations & Player Engagement", position: "Player Feedback Coordinator", capabilities: ["view", "warn"] },

  // Faction moderation roles.
  { department: "Faction", position: "Community Moderator", capabilities: COMMUNITY_MOD },
  { department: "Faction", position: "Trust & Safety Moderator", capabilities: TRUST_LEAD },
  { department: "Faction", position: "Player Reports Moderator", capabilities: COMMUNITY_MOD },
  { department: "Faction", position: "Moderation Appeals Reviewer", capabilities: APPEALS },
  { department: "Faction", position: "Community Safety Coordinator", capabilities: TRUST_LEAD },

  // Legacy department name kept so existing assignments keep working.
  { department: "Trust & Safety / Moderation", position: "Trust & Safety Moderator", capabilities: TRUST_LEAD },
  { department: "Trust & Safety / Moderation", position: "Moderation Appeals Reviewer", capabilities: APPEALS },
  { department: "Trust & Safety / Moderation", position: "Community Moderator", capabilities: COMMUNITY_MOD },

  // Support can see reports and bans, but not appeals or audit history.
  { department: "Player Support & Service", position: "Support Escalations Coordinator", capabilities: ["view"] },
];

const DEFAULT_BY_KEY = new Map(
  DEFAULT_MODERATION_ROLES.map((role) => [`${roleKey(role.department)}|${roleKey(role.position)}`, role.capabilities]),
);

function roleKey(value?: string | null) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function moderationRoleKey(department?: string | null, position?: string | null) {
  return `${roleKey(department)}|${roleKey(position)}`;
}

function normalizeCapabilities(values: readonly string[] | undefined): ModerationCapability[] {
  const allowed = new Set<string>(MODERATION_CAPABILITIES);
  const result: ModerationCapability[] = [];
  for (const value of values ?? []) {
    if (allowed.has(value) && !result.includes(value as ModerationCapability)) {
      result.push(value as ModerationCapability);
    }
  }
  return result;
}

function accessFromCapabilities(
  capabilities: ModerationCapability[],
  source: ModerationAccess["source"],
  department: string | null,
  position: string | null,
): ModerationAccess {
  const has = (capability: ModerationCapability) => capabilities.includes(capability);
  const canWarn = has("warn");
  const canSuspend = has("suspend");
  const canBan = has("ban");
  const canIpBan = has("ip-ban");
  const canReviewAppeals = has("review-appeals");
  return {
    isAdmin: false,
    canView: has("view"),
    canAct: canWarn || canSuspend || canBan || canIpBan,
    canWarn,
    canSuspend,
    canBan,
    canPermanentBan: canBan,
    canIpBan,
    canViewAppeals: canReviewAppeals,
    canReviewAppeals,
    canViewAudit: has("view-audit"),
    capabilities,
    source,
    department,
    position,
  };
}

function noneAccess(): ModerationAccess {
  return accessFromCapabilities([], "none", null, null);
}

function adminAccess(): ModerationAccess {
  return {
    ...accessFromCapabilities(ALL, "admin", null, null),
    isAdmin: true,
  };
}

function isCompanyAdminAccount(user: { role?: string; email?: string; emailVerificationTime?: number; isSiteBanned?: boolean }) {
  return user.emailVerificationTime !== undefined &&
    !user.isSiteBanned &&
    (user.role === "admin" || user.email?.trim().toLowerCase() === "contact@openworlds.dk");
}

function isVerifiedStaffAccount(user: Doc<"users">) {
  return user.emailVerificationTime !== undefined &&
    !user.isSiteBanned &&
    Boolean(user.staffAccess || user.department?.trim() || user.position?.trim());
}

/** Built-in access only; useful for showing the default in the permissions editor. */
export function defaultModerationAccess(user: Doc<"users"> | null | undefined): ModerationAccess {
  if (!user) return noneAccess();
  if (isCompanyAdminAccount(user)) return adminAccess();
  if (!isVerifiedStaffAccount(user)) return noneAccess();
  const department = user.department?.trim() || null;
  const position = user.position?.trim() || null;
  const capabilities = DEFAULT_BY_KEY.get(moderationRoleKey(department, position));
  return capabilities ? accessFromCapabilities([...capabilities], "default", department, position) : noneAccess();
}

/**
 * Resolve live access. This reads an exact department/position override when
 * one exists; otherwise it falls back to the built-in role table.
 */
export async function resolveModerationAccess(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users"> | null | undefined,
): Promise<ModerationAccess> {
  if (!user) return noneAccess();
  if (isCompanyAdminAccount(user)) return adminAccess();
  if (!isVerifiedStaffAccount(user)) return noneAccess();
  const department = user.department?.trim() || null;
  const position = user.position?.trim() || null;
  const override = await ctx.db
    .query("moderationRolePermissions")
    .withIndex("by_keys", (q) =>
      q.eq("departmentKey", roleKey(department)).eq("positionKey", roleKey(position)),
    )
    .unique();
  if (override) {
    return accessFromCapabilities(normalizeCapabilities(override.capabilities), "configured", department, position);
  }
  return defaultModerationAccess(user);
}

/** Signed-in user plus live access. */
export async function currentModerationAccess(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  return { user, access: await resolveModerationAccess(ctx, user) };
}

export async function requireModerationViewer(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const { user, access } = await currentModerationAccess(ctx);
  if (!user || !access.canView) {
    throw new Error("Your department or position does not include moderation access.");
  }
  return user;
}

const CAPABILITY_ACTION_LABEL: Record<Exclude<ModerationCapability, "view">, string> = {
  warn: "issue warnings",
  suspend: "suspend accounts",
  ban: "ban accounts",
  "ip-ban": "manage IP bans",
  "review-appeals": "review appeals",
  "view-audit": "view the audit log",
};

export async function requireModerationCapability(
  ctx: QueryCtx | MutationCtx,
  capability: Exclude<ModerationCapability, "view">,
): Promise<Doc<"users">> {
  return await requireAnyModerationCapability(ctx, [capability]);
}

/** Passes when the account has at least one of the requested capabilities. */
export async function requireAnyModerationCapability(
  ctx: QueryCtx | MutationCtx,
  capabilities: Array<Exclude<ModerationCapability, "view">>,
): Promise<Doc<"users">> {
  const { user, access } = await currentModerationAccess(ctx);
  if (!user || !access.canView) {
    throw new Error("Your department or position does not include moderation access.");
  }
  if (!capabilities.some((capability) => access.capabilities.includes(capability))) {
    const actions = capabilities.map((capability) => CAPABILITY_ACTION_LABEL[capability]);
    throw new Error(`Your department or position cannot ${actions.join(" or ")}. Ask an administrator to update moderation permissions.`);
  }
  await requireStaffUnlock(ctx);
  return user;
}

/** Any enforcement action (used by image safety cases). */
export async function requireModerationActor(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const { user, access } = await currentModerationAccess(ctx);
  if (!user || !access.canView) {
    throw new Error("Your department or position does not include moderation access.");
  }
  if (!access.canAct) {
    throw new Error("Your position can view moderation cases but cannot take enforcement action.");
  }
  await requireStaffUnlock(ctx);
  return user;
}

export async function requireAppealReviewer(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  return await requireModerationCapability(ctx, "review-appeals");
}
