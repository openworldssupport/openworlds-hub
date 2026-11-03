import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { isEmailAddress } from "../lib/staff";

/**
 * Shared ban + accountability helpers. Kept free of generated-api imports so
 * both auth callbacks and moderation mutations can use them without cycles.
 */

export type ModerationAction =
  | "ban-temporary"
  | "ban-permanent"
  | "unban"
  | "report-dismissed"
  | "report-warned"
  | "report-banned"
  | "automatic-warning"
  | "automatic-ban"
  | "appeal-approved"
  | "appeal-declined"
  | "image-blocked"
  | "image-reviewed";

/** A ban only restricts access until it expires; permanent bans never expire. */
export function isBanActive(user: { isSiteBanned?: boolean; banExpiresAt?: number }, now = Date.now()) {
  return user.isSiteBanned === true && (!user.banExpiresAt || user.banExpiresAt > now);
}

/** Public label used in reports and audit entries; emails are never shown. */
export function accountLabel(user: { nickname?: string; name?: string; playerLogin?: string } | null) {
  return [user?.nickname, user?.name, user?.playerLogin]
    .find((value) => value?.trim() && !isEmailAddress(value))?.trim() ?? "Account";
}

/**
 * Server-side guard used by auth so a banned account cannot start a new
 * session. Throws with the real, actionable reason.
 */
export function assertAccountAllowed(user: { isSiteBanned?: boolean; banExpiresAt?: number } | null) {
  if (!user || !isBanActive(user)) return;
  throw new Error(
    "This account is restricted and cannot sign in. If you believe this is a mistake, sign in to the restricted account and submit an appeal there, or email contact@openworlds.dk.",
  );
}

/** Active email/username block created by a ban. */
export async function findSignupBlock(ctx: QueryCtx | MutationCtx, identifiers: { email?: string; recoveryEmail?: string; username?: string }) {
  const now = Date.now();
  const emails = [...new Set([identifiers.email, identifiers.recoveryEmail]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value)))];
  const username = identifiers.username?.trim().toLowerCase();
  const candidates: Array<Doc<"bannedIdentities">> = [];
  for (const email of emails) {
    const byEmail = await ctx.db.query("bannedIdentities").withIndex("by_email", (q) => q.eq("email", email)).first();
    if (byEmail) candidates.push(byEmail);
  }
  if (username) {
    const byUsername = await ctx.db.query("bannedIdentities").withIndex("by_username", (q) => q.eq("username", username)).first();
    if (byUsername) candidates.push(byUsername);
  }
  const active = candidates.find((row) => !row.expiresAt || row.expiresAt > now);
  return active ?? null;
}

/** Throws when a banned email/username tries to create a new account. */
export async function assertSignupAllowed(ctx: QueryCtx | MutationCtx, identifiers: { email?: string; recoveryEmail?: string; username?: string }) {
  const block = await findSignupBlock(ctx, identifiers);
  if (!block) return;
  throw new Error(
    "This account was banned, so new accounts with the same email or username cannot be created. If you believe the ban is unfair, submit an appeal from the banned account or email contact@openworlds.dk.",
  );
}

export async function recordAudit(ctx: MutationCtx, entry: {
  /** Omitted for automatic safety decisions. */
  actorId?: Id<"users">;
  actorLabel: string;
  action: ModerationAction;
  targetId?: Id<"users">;
  targetLabel: string;
  reason: string;
  reportId?: Id<"playerReports">;
}) {
  await ctx.db.insert("moderationLog", {
    actorId: entry.actorId,
    actorLabel: entry.actorLabel,
    action: entry.action,
    targetId: entry.targetId,
    targetLabel: entry.targetLabel,
    reason: entry.reason,
    reportId: entry.reportId,
    createdAt: Date.now(),
  });
}

/** Applies a ban and records the email/username block plus an audit entry. */
export async function applyBan(ctx: MutationCtx, options: {
  /** Omitted for an automatic, evidence-threshold decision. */
  actorId?: Id<"users">;
  actorLabel: string;
  target: Doc<"users">;
  reason: string;
  type: "temporary" | "permanent";
  expiresAt?: number;
  reportId?: Id<"playerReports">;
  /** Overrides the audit label for automatic decisions. */
  auditAction?: ModerationAction;
}) {
  const now = Date.now();
  const { target, actorId, actorLabel, reason, type, expiresAt, reportId } = options;
  await ctx.db.patch(target._id, {
    isSiteBanned: true,
    siteBanReason: reason,
    siteBannedAt: now,
    banType: type,
    banExpiresAt: expiresAt,
  });

  const existingRows = await ctx.db.query("bannedIdentities").withIndex("by_user", (q) => q.eq("userId", target._id)).collect();
  await Promise.all(existingRows.map((row) => ctx.db.delete(row._id)));
  const emails = [...new Set([target.email, target.recoveryEmail]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value)))];
  const username = target.playerLogin?.trim().toLowerCase();
  for (const email of emails) {
    await ctx.db.insert("bannedIdentities", {
      userId: target._id,
      email,
      username,
      reason,
      expiresAt,
      createdAt: now,
      createdBy: actorId,
    });
  }
  if (username) {
    await ctx.db.insert("bannedIdentities", {
      userId: target._id,
      username,
      reason,
      expiresAt,
      createdAt: now,
      createdBy: actorId,
    });
  }

  await recordAudit(ctx, {
    actorId,
    actorLabel,
    action: options.auditAction ?? (type === "permanent" ? "ban-permanent" : "ban-temporary"),
    targetId: target._id,
    targetLabel: accountLabel(target),
    reason,
    reportId,
  });
}

/** Lifts a ban and clears every signup block for the account. */
export async function liftBan(ctx: MutationCtx, options: {
  /** Omitted when a temporary ban expires automatically. */
  actorId?: Id<"users">;
  actorLabel: string;
  target: Doc<"users">;
  reason: string;
  action?: ModerationAction;
  reportId?: Id<"playerReports">;
}) {
  const { target, actorId, actorLabel, reason } = options;
  await ctx.db.patch(target._id, {
    isSiteBanned: undefined,
    siteBanReason: undefined,
    siteBannedAt: undefined,
    banType: undefined,
    banExpiresAt: undefined,
    securityViolationCount: 0,
  });
  const rows = await ctx.db.query("bannedIdentities").withIndex("by_user", (q) => q.eq("userId", target._id)).collect();
  await Promise.all(rows.map((row) => ctx.db.delete(row._id)));
  // A pending appeal is resolved when the restriction ends, even if it ended
  // because time ran out rather than because someone reviewed it.
  const pendingAppeals = await ctx.db.query("securityAppeals").withIndex("by_user", (q) => q.eq("userId", target._id)).collect();
  await Promise.all(pendingAppeals
    .filter((appeal) => appeal.status === "pending")
    .map((appeal) => ctx.db.patch(appeal._id, { status: "approved", reviewedAt: Date.now() })));
  await recordAudit(ctx, {
    actorId,
    actorLabel,
    action: options.action ?? "unban",
    targetId: target._id,
    targetLabel: accountLabel(target),
    reason,
    reportId: options.reportId,
  });
}
