import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireSiteAvailable } from "./siteStatus";
import { requireStaffUnlock } from "./staffUnlock";
import { accountLabel, applyBan, findSignupBlock, isBanActive, liftBan, recordAudit } from "./bans";
import { severityForCategory } from "../lib/moderationPolicy";
import type { Doc } from "./_generated/dataModel";

const reportCategory = v.union(
  v.literal("harassment"),
  v.literal("hate-speech"),
  v.literal("scam"),
  v.literal("cheating"),
  v.literal("inappropriate-content"),
  v.literal("other"),
);

const banType = v.union(v.literal("temporary"), v.literal("permanent"));

const MAX_REPORTS_PER_DAY = 10;
const MAX_EVIDENCE_LINKS = 3;

function normalizeEvidenceLinks(rawLinks: string[] | undefined) {
  const links: string[] = [];
  for (const raw of rawLinks ?? []) {
    const value = raw.trim();
    if (!value || value.length > 500 || links.includes(value)) continue;
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") throw new Error("not https");
      links.push(value);
    } catch {
      throw new Error("Evidence links must be valid HTTPS links, one per line.");
    }
    if (links.length > MAX_EVIDENCE_LINKS) throw new Error("Add no more than 3 evidence links.");
  }
  return links;
}

function isCompanyAdminAccount(user: { role?: string; email?: string }) {
  return user.role === "admin" || user.email?.trim().toLowerCase() === "contact@openworlds.dk";
}

/** The contact team: verified company staff or administrators. */
async function requireModerationStaff(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const verifiedStaff = Boolean(user && user.emailVerificationTime !== undefined && !isBanActive(user) &&
    (isCompanyAdminAccount(user) || user.staffAccess || user.department?.trim() || user.position?.trim()));
  if (!user || !verifiedStaff) throw new Error("Verified staff or administrator access is required.");
  return user;
}

async function requireModerationAction(ctx: MutationCtx): Promise<Doc<"users">> {
  await requireSiteAvailable(ctx);
  const actor = await requireModerationStaff(ctx);
  await requireStaffUnlock(ctx);
  return actor;
}

async function findUserByUsername(ctx: QueryCtx | MutationCtx, rawUsername: string) {
  const username = rawUsername.trim().replace(/^@/, "").toLowerCase();
  if (!username || username.length > 64) return null;
  return await ctx.db.query("users").withIndex("by_player_login", (q) => q.eq("playerLogin", username)).unique();
}

/** Player-submitted report about another account. */
export const submitPlayerReport = mutation({
  args: {
    username: v.string(),
    category: reportCategory,
    message: v.string(),
    evidenceLinks: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { username, category, message, evidenceLinks: rawEvidence }) => {
    await requireSiteAvailable(ctx);
    const reporterId = await getAuthUserId(ctx);
    const reporter = reporterId ? await ctx.db.get(reporterId) : null;
    if (!reporter || isBanActive(reporter)) throw new Error("Sign in to report a player.");
    const target = await findUserByUsername(ctx, username);
    if (!target) throw new Error("That player could not be found.");
    if (target._id === reporter._id) throw new Error("You cannot report your own account.");
    if (isBanActive(target)) throw new Error("This account is already restricted. Our team is reviewing it.");

    const cleanMessage = message.trim();
    if (cleanMessage.length < 20 || cleanMessage.length > 1500) {
      throw new Error("Describe the problem in 20–1,500 characters.");
    }
    const evidenceLinks = normalizeEvidenceLinks(rawEvidence);
    const recent = await ctx.db.query("playerReports")
      .withIndex("by_reporter_created", (q) => q.eq("reporterId", reporter._id).gte("createdAt", Date.now() - 24 * 60 * 60 * 1000))
      .take(MAX_REPORTS_PER_DAY + 5);
    if (recent.filter((report) => report.status === "open").some((report) => report.targetId === target._id)) {
      throw new Error("You already have an open report about this player. Our team is reviewing it.");
    }
    if (recent.length >= MAX_REPORTS_PER_DAY) {
      throw new Error("You have sent several reports today. Please wait before sending another.");
    }

    const reportId = await ctx.db.insert("playerReports", {
      reporterId: reporter._id,
      reporterLabel: accountLabel(reporter),
      targetId: target._id,
      targetLabel: accountLabel(target),
      targetUsername: target.playerLogin ?? undefined,
      category,
      message: cleanMessage,
      ...(evidenceLinks.length ? { evidenceLinks } : {}),
      status: "open",
      createdAt: Date.now(),
    });
    // Run the evidence review after the report is committed. The assessment
    // never acts on a single uncorroborated report.
    await ctx.scheduler.runAfter(0, internal.automatedModeration.assessTarget, {
      targetId: target._id,
      triggerReportId: reportId,
    });
    return { ok: true as const };
  },
});

/** Whether the signed-in viewer can report this profile, and if they already did. */
export const reportState = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    await requireSiteAvailable(ctx);
    const viewerId = await getAuthUserId(ctx);
    const viewer = viewerId ? await ctx.db.get(viewerId) : null;
    const target = await findUserByUsername(ctx, username);
    if (!viewer || !target || isBanActive(viewer)) return { signedIn: Boolean(viewer), canReport: false, reported: false };
    if (target._id === viewer._id) return { signedIn: true, canReport: false, reported: false };
    const reports = await ctx.db.query("playerReports")
      .withIndex("by_reporter_created", (q) => q.eq("reporterId", viewer._id))
      .order("desc")
      .take(50);
    return {
      signedIn: true,
      canReport: !isBanActive(target) && Boolean(target.playerLogin?.trim()),
      reported: reports.some((report) => report.status === "open" && report.targetId === target._id),
    };
  },
});

/** Contact-team moderation queue: reports, bans, appeals, and the audit trail. */
export const queue = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const viewer = await requireModerationStaff(ctx);
    const [reports, bannedAccounts, appeals, audit, media, assessments] = await Promise.all([
      ctx.db.query("playerReports").withIndex("by_status_created", (q) => q.eq("status", "open")).order("desc").take(50),
      ctx.db.query("users").filter((q) => q.eq(q.field("isSiteBanned"), true)).take(200),
      ctx.db.query("securityAppeals").withIndex("by_status_created", (q) => q.eq("status", "pending")).order("desc").take(50),
      ctx.db.query("moderationLog").withIndex("by_created").order("desc").take(40),
      ctx.db.query("mediaModeration").withIndex("by_status_created", (q) => q.eq("status", "open")).order("desc").take(50),
      ctx.db.query("moderationAssessments").withIndex("by_created").order("desc").take(20),
    ]);
    return {
      isAdmin: isCompanyAdminAccount(viewer),
      reports: reports.map((report) => ({
        _id: report._id,
        category: report.category,
        message: report.message,
        createdAt: report.createdAt,
        reporterLabel: report.reporterLabel,
        targetLabel: report.targetLabel,
        targetUsername: report.targetUsername ?? null,
        targetId: report.targetId,
        evidenceLinks: report.evidenceLinks ?? [],
      })),
      assessments: assessments.map((assessment) => ({
        _id: assessment._id,
        targetLabel: assessment.targetLabel,
        targetUsername: assessment.targetUsername ?? null,
        category: assessment.category,
        severity: assessment.severity,
        evidenceScore: assessment.evidenceScore,
        independentReporters: assessment.independentReporters,
        verifiedReporters: assessment.verifiedReporters,
        evidenceLinks: assessment.evidenceLinks,
        evidenceDomains: assessment.evidenceDomains,
        status: assessment.status,
        reasons: assessment.reasons,
        actionTaken: assessment.actionTaken,
        actionExpiresAt: assessment.actionExpiresAt ?? null,
        createdAt: assessment.createdAt,
      })),
      bans: bannedAccounts.filter((user) => isBanActive(user)).map((user) => ({
        userId: user._id,
        name: accountLabel(user),
        email: user.email ?? "",
        username: user.playerLogin ?? null,
        reason: user.siteBanReason ?? "No reason recorded",
        banType: user.banType ?? "permanent",
        expiresAt: user.banExpiresAt ?? null,
        bannedAt: user.siteBannedAt ?? 0,
      })),
      appeals: await Promise.all(appeals.map(async (appeal) => {
        const user = await ctx.db.get(appeal.userId);
        return {
          _id: appeal._id,
          name: appeal.email || "Banned account",
          email: appeal.email,
          message: appeal.message,
          createdAt: appeal.createdAt,
          banType: user?.banType ?? "permanent",
        };
      })),
      media: await Promise.all(media.map(async (item) => ({
        _id: item._id,
        displayName: item.displayName,
        username: item.username ?? null,
        reason: item.reason,
        detail: item.detail,
        createdAt: item.createdAt,
        imageUrl: item.storageId ? await ctx.storage.getUrl(item.storageId) : null,
      }))),
      audit: audit.map((entry) => ({
        _id: entry._id,
        actorLabel: entry.actorLabel,
        action: entry.action,
        targetLabel: entry.targetLabel,
        reason: entry.reason,
        createdAt: entry.createdAt,
      })),
    };
  },
});

/** Warnings shown privately to the signed-in account. */
export const myWarnings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { warnings: [] };
    const warnings = await ctx.db
      .query("moderationWarnings")
      .withIndex("by_target_created", (q) => q.eq("targetId", userId))
      .order("desc")
      .take(20);
    return {
      warnings: warnings.map((warning) => ({
        _id: warning._id,
        severity: warning.severity,
        reason: warning.reason,
        source: warning.source,
        createdAt: warning.createdAt,
        acknowledgedAt: warning.acknowledgedAt ?? null,
      })),
    };
  },
});

/** Close a report with no action, a warning, or a ban. */
export const reviewReport = mutation({
  args: {
    reportId: v.id("playerReports"),
    decision: v.union(v.literal("dismiss"), v.literal("warn"), v.literal("ban-temporary"), v.literal("ban-permanent")),
    reason: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, { reportId, decision, reason: rawReason, days }) => {
    const actor = await requireModerationAction(ctx);
    const report = await ctx.db.get(reportId);
    if (!report || report.status !== "open") throw new Error("This report is no longer open.");
    const reason = rawReason.trim();
    if (reason.length < 10 || reason.length > 300) throw new Error("Add a review note of 10–300 characters.");

    const target = await ctx.db.get(report.targetId);
    const now = Date.now();
    const actorLabel = accountLabel(actor);

    if (decision === "dismiss" || decision === "warn") {
      await ctx.db.patch(report._id, {
        status: "closed",
        resolution: decision === "dismiss" ? "no-action" : "warned",
        resolutionNote: reason,
        resolvedAt: now,
        resolvedBy: actor._id,
      });
      await recordAudit(ctx, {
        actorId: actor._id,
        actorLabel,
        action: decision === "dismiss" ? "report-dismissed" : "report-warned",
        targetId: report.targetId,
        targetLabel: report.targetLabel,
        reason,
        reportId: report._id,
      });
      if (decision === "warn") {
        await ctx.db.insert("moderationWarnings", {
          targetId: report.targetId,
          targetLabel: report.targetLabel,
          actorId: actor._id,
          actorLabel,
          source: "staff",
          severity: severityForCategory(report.category),
          reason,
          reportIds: [report._id],
          evidenceLinks: report.evidenceLinks ?? [],
          createdAt: now,
        });
      }
      return { ok: true as const, decision };
    }

    if (decision === "ban-permanent" && !isCompanyAdminAccount(actor)) {
      throw new Error("Only an administrator can issue a permanent ban.");
    }
    if (!target) throw new Error("The reported account no longer exists.");
    if (isCompanyAdminAccount(target)) throw new Error("Administrator accounts cannot be banned from the moderation queue.");
    if ((target.staffAccess || target.department?.trim() || target.position?.trim()) && !isCompanyAdminAccount(actor)) {
      throw new Error("Only an administrator can ban a staff account.");
    }
    if (isBanActive(target)) throw new Error("This account is already serving a ban.");

    let expiresAt: number | undefined;
    if (decision === "ban-temporary") {
      const length = Math.floor(days ?? 0);
      if (!Number.isFinite(length) || length < 1 || length > 90) throw new Error("Temporary bans last between 1 and 90 days.");
      if (length > 30 && !isCompanyAdminAccount(actor)) {
        throw new Error("Staff can issue temporary bans up to 30 days. Ask an administrator for a longer or permanent ban.");
      }
      expiresAt = now + length * 24 * 60 * 60 * 1000;
    }

    await applyBan(ctx, {
      actorId: actor._id,
      actorLabel,
      target,
      reason,
      type: decision === "ban-permanent" ? "permanent" : "temporary",
      expiresAt,
      reportId: report._id,
    });
    if (expiresAt) {
      await ctx.scheduler.runAt(expiresAt, internal.moderation.liftExpiredBan, { userId: target._id });
    }

    await ctx.db.patch(report._id, {
      status: "closed",
      resolution: "banned",
      resolutionNote: reason,
      resolvedAt: now,
      resolvedBy: actor._id,
    });
    // Close any other open reports about the same account so the queue stays honest.
    const otherReports = await ctx.db.query("playerReports").withIndex("by_target", (q) => q.eq("targetId", target._id)).collect();
    await Promise.all(otherReports
      .filter((item) => item.status === "open" && item._id !== report._id)
      .map((item) => ctx.db.patch(item._id, {
        status: "closed",
        resolution: "banned",
        resolutionNote: "Account banned from a related report.",
        resolvedAt: now,
        resolvedBy: actor._id,
      })));
    return { ok: true as const, decision };
  },
});

/** Direct ban for reports that arrive outside the queue (for example by email). */
export const banAccount = mutation({
  args: { username: v.string(), type: banType, days: v.optional(v.number()), reason: v.string() },
  handler: async (ctx, { username, type, days, reason: rawReason }) => {
    const actor = await requireModerationAction(ctx);
    // Direct bans outside a reviewed report are reserved for administrators;
    // staff act through the report queue so every ban has a recorded report.
    if (!isCompanyAdminAccount(actor)) throw new Error("Only an administrator can ban an account outside a reviewed report.");
    const target = await findUserByUsername(ctx, username);
    if (!target) throw new Error("That player could not be found.");
    if (target._id === actor._id) throw new Error("You cannot ban your own account.");
    if (isCompanyAdminAccount(target)) throw new Error("Administrator accounts cannot be banned here.");
    if ((target.staffAccess || target.department?.trim() || target.position?.trim()) && !isCompanyAdminAccount(actor)) {
      throw new Error("Only an administrator can ban a staff account.");
    }
    if (isBanActive(target)) throw new Error("This account is already serving a ban.");
    if (type === "permanent" && !isCompanyAdminAccount(actor)) throw new Error("Only an administrator can issue a permanent ban.");
    const reason = rawReason.trim();
    if (reason.length < 10 || reason.length > 300) throw new Error("Add a reason of 10–300 characters.");
    let expiresAt: number | undefined;
    if (type === "temporary") {
      const length = Math.floor(days ?? 0);
      if (!Number.isFinite(length) || length < 1 || length > 90) throw new Error("Temporary bans last between 1 and 90 days.");
      expiresAt = Date.now() + length * 24 * 60 * 60 * 1000;
    }
    await applyBan(ctx, {
      actorId: actor._id,
      actorLabel: accountLabel(actor),
      target,
      reason,
      type,
      expiresAt,
    });
    if (expiresAt) {
      await ctx.scheduler.runAt(expiresAt, internal.moderation.liftExpiredBan, { userId: target._id });
    }
    return { ok: true as const };
  },
});

/** Lift a ban. Permanent bans can only be lifted by an administrator. */
export const unbanAccount = mutation({
  args: { userId: v.id("users"), reason: v.string() },
  handler: async (ctx, { userId, reason: rawReason }) => {
    const actor = await requireModerationAction(ctx);
    const target = await ctx.db.get(userId);
    if (!target || !isBanActive(target)) throw new Error("That account is not currently banned.");
    const reason = rawReason.trim();
    if (reason.length < 10 || reason.length > 300) throw new Error("Add a reason of 10–300 characters.");
    if ((target.banType ?? "permanent") === "permanent" && !isCompanyAdminAccount(actor)) {
      throw new Error("Only an administrator can lift a permanent ban.");
    }
    await liftBan(ctx, { actorId: actor._id, actorLabel: accountLabel(actor), target, reason });
    return { ok: true as const };
  },
});

/** Automatic lift when a temporary ban expires. */
export const liftExpiredBan = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || !user.isSiteBanned) return;
    if (!user.banExpiresAt || user.banExpiresAt > Date.now()) return;
    await liftBan(ctx, {
      actorLabel: "Automatic ban expiry",
      target: user,
      reason: "Temporary ban expired; access was restored automatically and any pending appeal was closed.",
    });
  },
});

/** Used by the hub username claim to keep banned usernames unavailable. */
export async function assertUsernameAvailable(ctx: MutationCtx, username: string) {
  const block = await findSignupBlock(ctx, { username });
  if (block) throw new Error("That username belongs to a banned account and cannot be used.");
}
