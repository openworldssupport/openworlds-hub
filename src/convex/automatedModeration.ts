import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { accountLabel, applyBan, isBanActive, recordAudit } from "./bans";
import { severityForCategory, severityRank, type ModerationSeverity } from "../lib/moderationPolicy";

const REPORT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const REPORTER_MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const WARNING_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_BAN_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_ASSESSMENT_REPORTS = 12;
const AUTO_WARNING_SCORE = 65;
const AUTO_BAN_SCORE = 90;

function normalizedEvidence(links: string[] | undefined) {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const link of links ?? []) {
    const trimmed = link.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    try {
      const url = new URL(trimmed);
      if (url.protocol !== "https:") continue;
      seen.add(trimmed);
      values.push(trimmed);
    } catch {
      // Ignore malformed legacy evidence rather than weakening the assessment.
    }
  }
  return values;
}

function evidenceDomain(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function reporterIsVerified(reporter: Doc<"users">) {
  return reporter.emailVerificationTime !== undefined ||
    Boolean(reporter.recoveryEmail && reporter.recoveryEmailVerifiedAt !== undefined);
}

function isEstablishedReporter(reporter: Doc<"users">, now: number) {
  return reporter._creationTime <= now - REPORTER_MIN_AGE_MS;
}

function dominantCategory(reports: Doc<"playerReports">[]) {
  const counts = new Map<string, number>();
  for (const report of reports) counts.set(report.category, (counts.get(report.category) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return severityRank(severityForCategory(b[0])) - severityRank(severityForCategory(a[0]));
  })[0]?.[0] ?? "other";
}

function automaticReason(
  severity: ModerationSeverity,
  category: string,
  reportCount: number,
  verifiedReporters: number,
  evidenceLinks: number,
  assessmentId: Id<"moderationAssessments">,
  action: "warning" | "ban",
) {
  return [
    `Automated ${severity} ${category} review: ${reportCount} detailed reports from ${verifiedReporters} established verified accounts, with ${evidenceLinks} independent evidence links.`,
    action === "ban"
      ? `Case ${assessmentId}. This is a temporary, reviewable restriction; permanent bans require an administrator.`
      : `Case ${assessmentId}. This warning is recorded on the account and is reviewable by staff.`,
  ].join(" ");
}

/** Score one account's recent open reports and act only above strict thresholds. */
export const assessTarget = internalMutation({
  args: {
    targetId: v.id("users"),
    triggerReportId: v.id("playerReports"),
  },
  handler: async (ctx, { targetId, triggerReportId }) => {
    const target = await ctx.db.get(targetId);
    if (!target || isBanActive(target)) return { assessed: false as const };

    const now = Date.now();
    const allReports = await ctx.db
      .query("playerReports")
      .withIndex("by_target", (q) => q.eq("targetId", targetId))
      .order("desc")
      .take(100);
    const recent = allReports.filter((report) =>
      report.status === "open" &&
      report.createdAt >= now - REPORT_WINDOW_MS &&
      report.message.trim().length >= 80,
    );
    if (!recent.length) return { assessed: false as const };

    const reporterCache = new Map<Id<"users">, Doc<"users"> | null>();
    for (const report of recent) {
      if (!reporterCache.has(report.reporterId)) {
        reporterCache.set(report.reporterId, await ctx.db.get(report.reporterId));
      }
    }
    const category = dominantCategory(recent);
    const severity = severityForCategory(category);
    const sameCategory = recent.filter((report) => report.category === category);
    const verifiedSameCategory = sameCategory.filter((report) => {
      const reporter = reporterCache.get(report.reporterId);
      return Boolean(reporter && reporterIsVerified(reporter) && isEstablishedReporter(reporter, now));
    });
    const independentVerified = new Set(verifiedSameCategory.map((report) => report.reporterId)).size;
    const independent = new Set(sameCategory.map((report) => report.reporterId)).size;
    const links = [...new Set(sameCategory.flatMap((report) => normalizedEvidence(report.evidenceLinks)))];
    const domains = [...new Set(links.map(evidenceDomain).filter(Boolean))];
    const reportersWithEvidence = new Set(sameCategory
      .filter((report) => normalizedEvidence(report.evidenceLinks).length > 0)
      .map((report) => report.reporterId)).size;
    const detailed = sameCategory.filter((report) => report.message.trim().length >= 120);

    const priorWarnings = (await ctx.db
      .query("moderationWarnings")
      .withIndex("by_target_created", (q) => q.eq("targetId", targetId))
      .order("desc")
      .take(30))
      .filter((warning) => warning.createdAt >= now - 90 * 24 * 60 * 60 * 1000);
    const recentWarning = priorWarnings.some((warning) => warning.createdAt >= now - WARNING_COOLDOWN_MS);
    const priorAutoBan = (await ctx.db
      .query("moderationAssessments")
      .withIndex("by_target_created", (q) => q.eq("targetId", targetId))
      .order("desc")
      .take(30))
      .some((assessment) => assessment.actionTaken === "temporary-ban" && assessment.createdAt >= now - AUTO_BAN_COOLDOWN_MS);

    const severityBonus = severity === "critical" ? 15 : severity === "high" ? 10 : severity === "medium" ? 5 : 0;
    const evidenceScore = Math.min(100,
      severityBonus +
      Math.min(sameCategory.length, 4) * 8 +
      Math.min(independentVerified, 4) * 10 +
      Math.min(links.length, 4) * 6 +
      Math.min(domains.length, 3) * 5 +
      Math.min(reportersWithEvidence, 3) * 5 +
      Math.min(detailed.length, 3) * 4 +
      (priorWarnings.length > 0 ? 8 : 0),
    );

    const targetIsStaff = target.role !== "user" ||
      Boolean(target.staffAccess || target.department?.trim() || target.position?.trim()) ||
      target.email?.trim().toLowerCase() === "contact@openworlds.dk";
    const reasons: string[] = [];
    if (targetIsStaff) reasons.push("The reported account is staff or an administrator; automatic action is disabled and a person must review it.");
    if (independentVerified < 2) reasons.push("Fewer than two established verified accounts independently reported the same category.");
    if (sameCategory.length < 2) reasons.push("There are not at least two detailed reports in the same category.");
    if (links.length < 1) reasons.push("No usable HTTPS evidence link was supplied.");
    if (reportersWithEvidence < 2) reasons.push("Fewer than two reporters supplied usable evidence links.");
    if (severity === "low") reasons.push("The dominant category is low severity, so no automatic warning or ban is allowed.");
    if (recentWarning) reasons.push("A warning was already issued recently; another one is not issued automatically.");
    if (priorAutoBan) reasons.push("An automatic temporary ban was already used in the last 90 days; further action needs a person.");

    const canWarn = !targetIsStaff &&
      severity !== "low" &&
      independentVerified >= 2 &&
      sameCategory.length >= 2 &&
      links.length >= 1 &&
      domains.length >= 1 &&
      reportersWithEvidence >= 2 &&
      evidenceScore >= AUTO_WARNING_SCORE &&
      !recentWarning &&
      !priorAutoBan;

    const canBan = canWarn &&
      severity !== "medium" &&
      independentVerified >= 4 &&
      sameCategory.length >= 4 &&
      links.length >= 4 &&
      domains.length >= 3 &&
      reportersWithEvidence >= 3 &&
      evidenceScore >= AUTO_BAN_SCORE &&
      priorWarnings.length >= 1;

    const status: "automatically-warned" | "automatically-banned" | "needs-review" | "insufficient-evidence" =
      canBan ? "automatically-banned"
        : canWarn ? "automatically-warned"
          : evidenceScore >= 55 || (independentVerified >= 2 && links.length >= 1) ? "needs-review"
            : "insufficient-evidence";

    const assessmentId = await ctx.db.insert("moderationAssessments", {
      targetId,
      targetLabel: accountLabel(target),
      targetUsername: target.playerLogin ?? undefined,
      triggerReportId,
      reportIds: sameCategory.slice(0, MAX_ASSESSMENT_REPORTS).map((report) => report._id),
      category,
      severity,
      evidenceScore,
      independentReporters: independent,
      verifiedReporters: independentVerified,
      evidenceLinks: links.length,
      evidenceDomains: domains.length,
      status,
      reasons: reasons.length ? reasons : [
        `The report pattern met the automatic ${canBan ? "ban" : "warning"} threshold.`,
      ],
      actionTaken: "none",
      createdAt: now,
    });

    if (canBan) {
      const expiresAt = now + 3 * 24 * 60 * 60 * 1000;
      const reason = automaticReason(severity, category, sameCategory.length, independentVerified, links.length, assessmentId, "ban");
      await applyBan(ctx, {
        actorLabel: "Automated evidence review",
        target,
        reason,
        type: "temporary",
        expiresAt,
        reportId: triggerReportId,
        auditAction: "automatic-ban",
      });
      await ctx.db.patch(assessmentId, { status: "automatically-banned", actionTaken: "temporary-ban", actionExpiresAt: expiresAt });
      for (const report of sameCategory) {
        await ctx.db.patch(report._id, {
          status: "closed",
          resolution: "banned",
          resolutionNote: `Automated 3-day restriction after evidence review. Case ${assessmentId}.`,
          resolvedAt: now,
        });
      }
      await ctx.scheduler.runAt(expiresAt, internal.moderation.liftExpiredBan, { userId: targetId });
      return { assessed: true as const, status, evidenceScore, actionTaken: "temporary-ban" as const };
    }

    if (canWarn) {
      const reason = automaticReason(severity, category, sameCategory.length, independentVerified, links.length, assessmentId, "warning");
      await ctx.db.insert("moderationWarnings", {
        targetId,
        targetLabel: accountLabel(target),
        actorLabel: "Automated evidence review",
        source: "automated",
        severity,
        reason,
        reportIds: sameCategory.slice(0, MAX_ASSESSMENT_REPORTS).map((report) => report._id),
        evidenceLinks: links,
        createdAt: now,
      });
      await ctx.db.patch(assessmentId, { status: "automatically-warned", actionTaken: "warning" });
      await recordAudit(ctx, {
        actorLabel: "Automated evidence review",
        action: "automatic-warning",
        targetId,
        targetLabel: accountLabel(target),
        reason,
        reportId: triggerReportId,
      });
      return { assessed: true as const, status, evidenceScore, actionTaken: "warning" as const };
    }

    return { assessed: true as const, status, evidenceScore, actionTaken: "none" as const };
  },
});
