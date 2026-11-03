import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireSiteAvailable } from "./siteStatus";
import { accountLabel, applyBan, findSignupBlock, isBanActive, liftBan, recordAudit } from "./bans";
import { severityForCategory } from "../lib/moderationPolicy";
import {
  currentModerationAccess,
  DEFAULT_MODERATION_ROLES,
  MODERATION_CAPABILITIES,
  moderationRoleKey,
  requireAnyModerationCapability,
  requireModerationActor,
  requireModerationCapability,
  type ModerationCapability,
} from "./moderationAccess";
import { requireRoleAdministrator } from "./admin";
import type { Doc, Id } from "./_generated/dataModel";

const reportCategory = v.union(
  v.literal("harassment"),
  v.literal("hate-speech"),
  v.literal("scam"),
  v.literal("cheating"),
  v.literal("inappropriate-content"),
  v.literal("display-name"),
  v.literal("profile-picture"),
  v.literal("terms-violation"),
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

async function requireModerationAction(ctx: MutationCtx): Promise<Doc<"users">> {
  await requireSiteAvailable(ctx);
  return await requireModerationActor(ctx);
}

async function findUserByUsername(ctx: QueryCtx | MutationCtx, rawUsername: string) {
  const username = rawUsername.trim().replace(/^@/, "").toLowerCase();
  if (!username || username.length > 80) return null;
  const byLogin = await ctx.db.query("users").withIndex("by_player_login", (q) => q.eq("playerLogin", username)).unique();
  if (byLogin) return byLogin;
  // Username-less profiles use an opaque account-<id> key. This lets people
  // report a display name or profile photo even when the account has no public
  // username.
  if (!username.startsWith("account-")) return null;
  const accountId = ctx.db.normalizeId("users", username.slice("account-".length));
  return accountId ? await ctx.db.get(accountId) : null;
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
      targetProfileKey: target.playerLogin ?? `account-${target._id}`,
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
      canReport: !isBanActive(target),
      reported: reports.some((report) => report.status === "open" && report.targetId === target._id),
    };
  },
});

/** Contact-team moderation queue: reports, bans, appeals, and the audit trail. */
export const queue = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAvailable(ctx);
    const { access } = await currentModerationAccess(ctx);
    if (!access.canView) {
      return {
        ...access,
        reports: [], bans: [], appeals: [], media: [], assessments: [], audit: [],
      };
    }
    const [reports, bannedAccounts, appeals, audit, media, assessments] = await Promise.all([
      ctx.db.query("playerReports").withIndex("by_status_created", (q) => q.eq("status", "open")).order("desc").take(50),
      ctx.db.query("users").withIndex("by_site_banned", (q) => q.eq("isSiteBanned", true)).take(200),
      ctx.db.query("securityAppeals").withIndex("by_status_created", (q) => q.eq("status", "pending")).order("desc").take(50),
      ctx.db.query("moderationLog").withIndex("by_created").order("desc").take(40),
      ctx.db.query("mediaModeration").withIndex("by_status_created", (q) => q.eq("status", "open")).order("desc").take(50),
      ctx.db.query("moderationAssessments").withIndex("by_created").order("desc").take(20),
    ]);
    return {
      ...access,
      reports: reports.map((report) => ({
        _id: report._id,
        category: report.category,
        message: report.message,
        createdAt: report.createdAt,
        reporterLabel: report.reporterLabel,
        targetLabel: report.targetLabel,
        targetUsername: report.targetUsername ?? null,
        targetProfileKey: report.targetProfileKey ?? (report.targetUsername ?? null),
        targetId: report.targetId,
        evidenceLinks: report.evidenceLinks ?? [],
      })),
      assessments: access.canViewAudit ? assessments.map((assessment) => ({
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
      })) : [],
      bans: bannedAccounts.filter((user) => isBanActive(user)).map((user) => ({
        userId: user._id,
        name: accountLabel(user),
        // Support can confirm and manage restrictions without receiving the
        // account's private contact address. Appeal reviewers get the email
        // because it is needed to review the appeal.
        email: access.canViewAppeals || access.isAdmin ? user.email ?? "" : "",
        username: user.playerLogin ?? null,
        reason: user.siteBanReason ?? "No reason recorded",
        banType: user.banType ?? "permanent",
        expiresAt: user.banExpiresAt ?? null,
        bannedAt: user.siteBannedAt ?? 0,
      })),
      appeals: access.canViewAppeals ? await Promise.all(appeals.map(async (appeal) => {
        const user = await ctx.db.get(appeal.userId);
        return {
          _id: appeal._id,
          name: appeal.email || "Banned account",
          email: appeal.email,
          message: appeal.message,
          createdAt: appeal.createdAt,
          banType: user?.banType ?? "permanent",
          targetIsStaff: Boolean(user && (user.role !== "user" || user.staffAccess || user.department?.trim() || user.position?.trim())),
        };
      })) : [],
      media: access.canViewAudit ? await Promise.all(media.map(async (item) => ({
        _id: item._id,
        displayName: item.displayName,
        username: item.username ?? null,
        reason: item.reason,
        detail: item.detail,
        createdAt: item.createdAt,
        imageUrl: item.storageId ? await ctx.storage.getUrl(item.storageId) : null,
      }))) : [],
      audit: access.canViewAudit
        ? audit
          .filter((entry) => access.canViewAppeals || !entry.action.startsWith("appeal-"))
          .map((entry) => ({
            _id: entry._id,
            actorLabel: entry.actorLabel,
            action: entry.action,
            targetLabel: entry.targetLabel,
            reason: entry.reason,
            createdAt: entry.createdAt,
          }))
        : [],
    };
  },
});

/** Dedicated appeals queue with the original ban evidence attached. */
export const appealsQueue = query({
  args: {},
  handler: async (ctx) => {
    const { access } = await currentModerationAccess(ctx);
    if (!access.canView || !access.canViewAppeals) {
      return { ...access, canView: false, canViewAppeals: false, canReviewAppeals: false, appeals: [] };
    }
    const appeals = await ctx.db
      .query("securityAppeals")
      .withIndex("by_status_created", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(30);

    return {
      ...access,
      appeals: await Promise.all(appeals.map(async (appeal) => {
        const user = await ctx.db.get(appeal.userId);
        const reports = await ctx.db
          .query("playerReports")
          .withIndex("by_target", (q) => q.eq("targetId", appeal.userId))
          .order("desc")
          .take(10);
        const assessments = await ctx.db
          .query("moderationAssessments")
          .withIndex("by_target_created", (q) => q.eq("targetId", appeal.userId))
          .order("desc")
          .take(5);
        return {
          _id: appeal._id,
          message: appeal.message,
          createdAt: appeal.createdAt,
          email: appeal.email,
          userId: appeal.userId,
          name: user ? accountLabel(user) : "Account unavailable",
          username: user?.playerLogin ?? null,
          profileKey: user ? (user.playerLogin ?? `account-${user._id}`) : null,
          targetIsStaff: Boolean(user && (user.role !== "user" || user.staffAccess || user.department?.trim() || user.position?.trim())),
          banType: user?.banType ?? "permanent",
          banReason: user?.siteBanReason ?? "No reason recorded",
          banExpiresAt: user?.banExpiresAt ?? null,
          bannedAt: user?.siteBannedAt ?? null,
          reports: reports.map((report) => ({
            _id: report._id,
            category: report.category,
            message: report.message,
            evidenceLinks: report.evidenceLinks ?? [],
            resolution: report.resolution ?? null,
            createdAt: report.createdAt,
          })),
          assessments: assessments.map((assessment) => ({
            _id: assessment._id,
            category: assessment.category,
            severity: assessment.severity,
            evidenceScore: assessment.evidenceScore,
            status: assessment.status,
            actionTaken: assessment.actionTaken,
            reasons: assessment.reasons,
            createdAt: assessment.createdAt,
          })),
        };
      })),
    };
  },
});

/** Capability flags for the signed-in account; used to hide staff tabs that
 *  the account cannot use. Sensitive data is still gated in its own query. */
export const myAccess = query({
  args: {},
  handler: async (ctx) => {
    const { access } = await currentModerationAccess(ctx);
    return access;
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

/** Staff account search for the moderation workspace. No emails are returned. */
export const searchAccounts = query({
  args: { search: v.string() },
  handler: async (ctx, { search }) => {
    const { access } = await currentModerationAccess(ctx);
    const term = search.trim().replace(/^@/, "").slice(0, 80);
    if (!access.canView || term.length < 2) return { accounts: [] as Array<{
      userId: Doc<"users">["_id"];
      label: string;
      username: string | null;
      profileKey: string | null;
      isBanned: boolean;
      banType: "temporary" | "permanent" | null;
      banExpiresAt: number | null;
      isStaffAccount: boolean;
      isAdmin: boolean;
    }> };

    const [usernameMatches, nameMatches, nicknameMatches, exact] = await Promise.all([
      ctx.db.query("users").withSearchIndex("search_players_by_username", (q) => q.search("playerLogin", term)).take(10),
      ctx.db.query("users").withSearchIndex("search_players_by_name", (q) => q.search("name", term)).take(10),
      ctx.db.query("users").withSearchIndex("search_public_nicknames", (q) => q.search("nickname", term)).take(10),
      ctx.db.query("users").withIndex("by_player_login", (q) => q.eq("playerLogin", term.toLowerCase())).unique(),
    ]);
    const unique = new Map<string, Doc<"users">>();
    for (const user of [exact, ...usernameMatches, ...nameMatches, ...nicknameMatches]) {
      if (user && !user.isAnonymous) unique.set(user._id, user);
    }
    return {
      accounts: [...unique.values()].slice(0, 20).map((user) => ({
        userId: user._id,
        label: accountLabel(user),
        username: user.playerLogin ?? null,
        profileKey: user.playerLogin ?? `account-${user._id}`,
        isBanned: isBanActive(user),
        banType: isBanActive(user) ? user.banType ?? "permanent" : null,
        banExpiresAt: user.banExpiresAt ?? null,
        isStaffAccount: Boolean(user.role !== "user" || user.staffAccess || user.department?.trim() || user.position?.trim()),
        isAdmin: isCompanyAdminAccount(user),
      })),
    };
  },
});

/** One account with the moderation context needed before acting. */
export const accountSnapshot = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const { access } = await currentModerationAccess(ctx);
    if (!access.canView) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const [warnings, reports, log] = await Promise.all([
      ctx.db.query("moderationWarnings").withIndex("by_target_created", (q) => q.eq("targetId", userId)).order("desc").take(10),
      ctx.db.query("playerReports").withIndex("by_target", (q) => q.eq("targetId", userId)).order("desc").take(15),
      ctx.db.query("moderationLog").withIndex("by_target_created", (q) => q.eq("targetId", userId)).order("desc").take(18),
    ]);
    return {
      userId: user._id,
      label: accountLabel(user),
      username: user.playerLogin ?? null,
      profileKey: user.playerLogin ?? `account-${user._id}`,
      image: user.profileImageStorageId ? await ctx.storage.getUrl(user.profileImageStorageId) : user.image ?? null,
      bio: user.publicBio ?? "",
      isBanned: isBanActive(user),
      banType: isBanActive(user) ? user.banType ?? "permanent" : null,
      banReason: isBanActive(user) ? user.siteBanReason ?? null : null,
      banExpiresAt: isBanActive(user) ? user.banExpiresAt ?? null : null,
      isStaffAccount: Boolean(user.role !== "user" || user.staffAccess || user.department?.trim() || user.position?.trim()),
      isAdmin: isCompanyAdminAccount(user),
      warnings: warnings.map((warning) => ({
        _id: warning._id,
        severity: warning.severity,
        reason: warning.reason,
        source: warning.source,
        createdAt: warning.createdAt,
      })),
      reports: reports.map((report) => ({
        _id: report._id,
        category: report.category,
        message: report.message,
        status: report.status,
        resolution: report.resolution ?? null,
        evidenceLinks: report.evidenceLinks ?? [],
        createdAt: report.createdAt,
      })),
      log: access.canViewAudit
        ? log.filter((entry) => access.canViewAppeals || !entry.action.startsWith("appeal-")).map((entry) => ({
          _id: entry._id,
          action: entry.action,
          actorLabel: entry.actorLabel,
          reason: entry.reason,
          createdAt: entry.createdAt,
        }))
        : [],
    };
  },
});

/** A direct warning issued from the account view. */
export const warnAccount = mutation({
  args: {
    userId: v.id("users"),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    reason: v.string(),
  },
  handler: async (ctx, { userId, severity, reason: rawReason }) => {
    const actor = await requireModerationCapability(ctx, "warn");
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("Account not found.");
    if (target._id === actor._id) throw new Error("You cannot warn your own account.");
    if ((target.role !== "user" || target.staffAccess || target.department?.trim() || target.position?.trim()) && !isCompanyAdminAccount(actor)) {
      throw new Error("Only an administrator can issue a warning to a staff account.");
    }
    const reason = rawReason.trim();
    if (reason.length < 10 || reason.length > 300) throw new Error("Add a reason of 10–300 characters.");
    const actorLabel = accountLabel(actor);
    await ctx.db.insert("moderationWarnings", {
      targetId: target._id,
      targetLabel: accountLabel(target),
      actorId: actor._id,
      actorLabel,
      source: "staff",
      severity,
      reason,
      reportIds: [],
      evidenceLinks: [],
      createdAt: Date.now(),
    });
    await recordAudit(ctx, {
      actorId: actor._id,
      actorLabel,
      action: "account-warned",
      targetId: target._id,
      targetLabel: accountLabel(target),
      reason,
    });
    return { ok: true as const };
  },
});

/** Suspend or permanently ban an account from its moderation profile. */
export const applyAccountAction = mutation({
  args: {
    userId: v.id("users"),
    action: v.union(v.literal("suspend"), v.literal("ban")),
    days: v.optional(v.number()),
    reason: v.string(),
  },
  handler: async (ctx, { userId, action, days, reason: rawReason }) => {
    const actor = action === "ban"
      ? await requireModerationCapability(ctx, "ban")
      : await requireModerationCapability(ctx, "suspend");
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("Account not found.");
    if (target._id === actor._id) throw new Error("You cannot restrict your own account.");
    if (isCompanyAdminAccount(target)) throw new Error("Administrator accounts cannot be restricted here.");
    if ((target.role !== "user" || target.staffAccess || target.department?.trim() || target.position?.trim()) && !isCompanyAdminAccount(actor)) {
      throw new Error("Only an administrator can restrict a staff account.");
    }
    if (isBanActive(target)) throw new Error("This account is already restricted.");
    const reason = rawReason.trim();
    if (reason.length < 10 || reason.length > 300) throw new Error("Add a reason of 10–300 characters.");
    const length = Math.floor(days ?? 0);
    if (action === "suspend" && (!Number.isFinite(length) || length < 1 || length > 30)) {
      throw new Error("Suspensions last between 1 and 30 days. Use a ban for a longer restriction.");
    }
    const now = Date.now();
    const expiresAt = action === "suspend" ? now + length * 24 * 60 * 60 * 1000 : undefined;
    await applyBan(ctx, {
      actorId: actor._id,
      actorLabel: accountLabel(actor),
      target,
      reason,
      type: action === "suspend" ? "temporary" : "permanent",
      expiresAt,
      auditAction: action === "suspend" ? "account-suspended" : "account-banned",
    });
    if (expiresAt) {
      await ctx.scheduler.runAt(expiresAt, internal.moderation.liftExpiredBan, { userId: target._id });
    }
    return { ok: true as const };
  },
});

function normalizeNetworkBlock(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (!value || value.length > 64) throw new Error("Enter an IPv4/IPv6 address or CIDR range.");
  const [address, prefixRaw, extra] = value.split("/");
  if (extra !== undefined) throw new Error("Enter a single IP address or CIDR range.");
  if (address.includes(":")) {
    try {
      new URL(`http://[${address}]`);
    } catch {
      throw new Error("Enter a valid IPv6 address or range.");
    }
    if (prefixRaw !== undefined) {
      const prefix = Number(prefixRaw);
      if (!Number.isInteger(prefix) || prefix < 48 || prefix > 128) throw new Error("IPv6 network blocks must use a prefix between /48 and /128.");
      return `${address}/${prefix}`;
    }
    return address;
  }
  const octets = address.split(".");
  if (octets.length !== 4 || octets.some((octet) => !/^\d{1,3}$/.test(octet) || Number(octet) > 255)) {
    throw new Error("Enter a valid IPv4 address or range.");
  }
  if (prefixRaw !== undefined) {
    const prefix = Number(prefixRaw);
    if (!Number.isInteger(prefix) || prefix < 16 || prefix > 32) throw new Error("IPv4 network blocks must use a prefix between /16 and /32.");
    return `${address}/${prefix}`;
  }
  return address;
}

/** IP/CIDR blocks for edge or game-server enforcement. */
export const networkBans = query({
  args: {},
  handler: async (ctx) => {
    const { access } = await currentModerationAccess(ctx);
    if (!access.canIpBan) return { canView: false, bans: [] as Array<{
      _id: Id<"networkBans">;
      network: string;
      reason: string;
      createdByLabel: string;
      createdAt: number;
      expiresAt: number | null;
    }> };
    const rows = await ctx.db.query("networkBans").withIndex("by_created").order("desc").take(200);
    const now = Date.now();
    return {
      canView: true,
      bans: rows
        .filter((row) => !row.liftedAt && (!row.expiresAt || row.expiresAt > now))
        .map((row) => ({
          _id: row._id,
          network: row.network,
          reason: row.reason,
          createdByLabel: row.createdByLabel,
          createdAt: row.createdAt,
          expiresAt: row.expiresAt ?? null,
        })),
    };
  },
});

export const addNetworkBan = mutation({
  args: { network: v.string(), reason: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, { network: rawNetwork, reason: rawReason, days }) => {
    const actor = await requireModerationCapability(ctx, "ip-ban");
    const network = normalizeNetworkBlock(rawNetwork);
    const reason = rawReason.trim();
    if (reason.length < 10 || reason.length > 300) throw new Error("Add a reason of 10–300 characters.");
    const length = Math.floor(days ?? 0);
    if (!Number.isFinite(length) || length < 0 || length > 3650) throw new Error("Network blocks last between 0 and 3,650 days. Use 0 for no expiry.");
    const now = Date.now();
    const existing = await ctx.db.query("networkBans").withIndex("by_network", (q) => q.eq("network", network)).first();
    if (existing && !existing.liftedAt && (!existing.expiresAt || existing.expiresAt > now)) {
      throw new Error("That IP or range is already blocked.");
    }
    const expiresAt = length > 0 ? now + length * 24 * 60 * 60 * 1000 : undefined;
    const actorLabel = accountLabel(actor);
    const banId = await ctx.db.insert("networkBans", {
      network,
      reason,
      createdBy: actor._id,
      createdByLabel: actorLabel,
      createdAt: now,
      ...(expiresAt ? { expiresAt } : {}),
    });
    await recordAudit(ctx, {
      actorId: actor._id,
      actorLabel,
      action: "ip-ban-added",
      targetLabel: `Network ${network}`,
      reason: `${reason}${expiresAt ? ` · expires ${new Date(expiresAt).toISOString()}` : " · no expiry"}`,
    });
    return { ok: true as const, banId, network };
  },
});

/** Read-only export for the edge/firewall integration. */
export const activeNetworkBlocks = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("networkBans").withIndex("by_created").order("desc").take(500);
    const now = Date.now();
    return rows
      .filter((row) => !row.liftedAt && (!row.expiresAt || row.expiresAt > now))
      .map((row) => ({ network: row.network, reason: row.reason, expiresAt: row.expiresAt ?? null }));
  },
});

export const liftNetworkBan = mutation({
  args: { banId: v.id("networkBans"), reason: v.string() },
  handler: async (ctx, { banId, reason: rawReason }) => {
    const actor = await requireModerationCapability(ctx, "ip-ban");
    const ban = await ctx.db.get(banId);
    if (!ban || ban.liftedAt) throw new Error("That network block is no longer active.");
    const reason = rawReason.trim();
    if (reason.length < 10 || reason.length > 300) throw new Error("Add a reason of 10–300 characters.");
    const actorLabel = accountLabel(actor);
    await ctx.db.patch(banId, {
      liftedAt: Date.now(),
      liftedBy: actor._id,
      liftedByLabel: actorLabel,
      liftReason: reason,
    });
    await recordAudit(ctx, {
      actorId: actor._id,
      actorLabel,
      action: "ip-ban-lifted",
      targetLabel: `Network ${ban.network}`,
      reason,
    });
    return { ok: true as const };
  },
});

/** Admin-only permission matrix for the Trust & Safety console. */
export const permissionMatrix = query({
  args: {},
  handler: async (ctx) => {
    const { access } = await currentModerationAccess(ctx);
    if (!access.isAdmin) return null;
    const overrides = await ctx.db.query("moderationRolePermissions").take(500);
    const byKeys = new Map(overrides.map((row) => [`${row.departmentKey}|${row.positionKey}`, row]));
    const roles = DEFAULT_MODERATION_ROLES.map((role) => {
      const key = moderationRoleKey(role.department, role.position);
      const override = byKeys.get(key);
      return {
        department: role.department,
        position: role.position,
        capabilities: override ? override.capabilities : role.capabilities,
        defaultCapabilities: role.capabilities,
        source: override ? "configured" as const : "default" as const,
      };
    });
    for (const override of overrides) {
      if (DEFAULT_MODERATION_ROLES.some((role) => moderationRoleKey(role.department, role.position) === `${override.departmentKey}|${override.positionKey}`)) continue;
      roles.push({
        department: override.department,
        position: override.position,
        capabilities: override.capabilities,
        defaultCapabilities: [] as ModerationCapability[],
        source: "configured" as const,
      });
    }
    return {
      capabilities: [...MODERATION_CAPABILITIES],
      roles: roles.sort((a, b) => a.department.localeCompare(b.department) || a.position.localeCompare(b.position)),
    };
  },
});

export const setRolePermissions = mutation({
  args: {
    department: v.string(),
    position: v.string(),
    capabilities: v.array(v.union(
      v.literal("view"),
      v.literal("warn"),
      v.literal("suspend"),
      v.literal("ban"),
      v.literal("ip-ban"),
      v.literal("review-appeals"),
      v.literal("view-audit"),
    )),
  },
  handler: async (ctx, args) => {
    const actor = await requireRoleAdministrator(ctx);
    const department = args.department.trim();
    const position = args.position.trim();
    if (!department || department.length > 80) throw new Error("Department must be 1–80 characters.");
    if (!position || position.length > 100) throw new Error("Position must be 1–100 characters.");
    const requested = new Set(args.capabilities);
    if (![...requested].every((capability) => MODERATION_CAPABILITIES.includes(capability))) {
      throw new Error("One or more moderation capabilities are invalid.");
    }
    // Every enforcement or review capability is meaningless without the base
    // view permission, so add it instead of saving a silently broken role.
    if (requested.size > 0) requested.add("view");
    const capabilities = [...requested] as ModerationCapability[];
    const actorId = actor._id;
    const departmentKey = department.trim().toLowerCase().replace(/\s+/g, " ");
    const positionKey = position.trim().toLowerCase().replace(/\s+/g, " ");
    const existing = await ctx.db.query("moderationRolePermissions")
      .withIndex("by_keys", (q) => q.eq("departmentKey", departmentKey).eq("positionKey", positionKey))
      .unique();
    const values = {
      department,
      position,
      departmentKey,
      positionKey,
      capabilities,
      updatedAt: Date.now(),
      updatedBy: actorId,
    };
    if (existing) await ctx.db.patch(existing._id, values);
    else await ctx.db.insert("moderationRolePermissions", values);
    await recordAudit(ctx, {
      actorId,
      actorLabel: accountLabel(actor),
      action: "permissions-updated",
      targetLabel: `${department} / ${position}`,
      reason: capabilities.length ? `Allowed: ${capabilities.join(", ")}` : "No moderation capabilities allowed.",
    });
    return { ok: true as const, capabilities };
  },
});

export const resetRolePermissions = mutation({
  args: { department: v.string(), position: v.string() },
  handler: async (ctx, args) => {
    const actor = await requireRoleAdministrator(ctx);
    const department = args.department.trim();
    const position = args.position.trim();
    const departmentKey = department.trim().toLowerCase().replace(/\s+/g, " ");
    const positionKey = position.trim().toLowerCase().replace(/\s+/g, " ");
    const existing = await ctx.db.query("moderationRolePermissions")
      .withIndex("by_keys", (q) => q.eq("departmentKey", departmentKey).eq("positionKey", positionKey))
      .unique();
    if (!existing) return { ok: true as const };
    await ctx.db.delete(existing._id);
    await recordAudit(ctx, {
      actorId: actor._id,
      actorLabel: accountLabel(actor),
      action: "permissions-updated",
      targetLabel: `${department} / ${position}`,
      reason: "Custom moderation permissions reset to the built-in role defaults.",
    });
    return { ok: true as const };
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
    const actor = decision === "dismiss"
      ? await requireModerationActor(ctx)
      : decision === "warn"
        ? await requireModerationCapability(ctx, "warn")
        : decision === "ban-temporary" && (days ?? 0) <= 30
          ? await requireModerationCapability(ctx, "suspend")
          : await requireModerationCapability(ctx, "ban");
    const report = await ctx.db.get(reportId);
    if (!report || report.status !== "open") throw new Error("This report is no longer open.");
    const reason = rawReason.trim();
    if (reason.length < 10 || reason.length > 300) throw new Error("Add a review note of 10–300 characters.");

    const target = await ctx.db.get(report.targetId);
    const now = Date.now();
    const actorLabel = accountLabel(actor);
    if (target && target._id === actor._id) throw new Error("You cannot enforce a decision against your own account.");
    const targetIsStaff = Boolean(target && (target.role !== "user" || target.staffAccess || target.department?.trim() || target.position?.trim()));
    if (decision === "warn" && targetIsStaff && !isCompanyAdminAccount(actor)) {
      throw new Error("Only an administrator can issue a warning to a staff account.");
    }

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

    if (!target) throw new Error("The reported account no longer exists.");
    if (target._id === actor._id) throw new Error("You cannot enforce a decision against your own account.");
    if (isCompanyAdminAccount(target)) throw new Error("Administrator accounts cannot be banned from the moderation queue.");
    if ((target.role !== "user" || target.staffAccess || target.department?.trim() || target.position?.trim()) && !isCompanyAdminAccount(actor)) {
      throw new Error("Only an administrator can ban a staff account.");
    }
    if (isBanActive(target)) throw new Error("This account is already serving a ban.");

    let expiresAt: number | undefined;
    if (decision === "ban-temporary") {
      const length = Math.floor(days ?? 0);
      if (!Number.isFinite(length) || length < 1 || length > 90) throw new Error("Temporary restrictions last between 1 and 90 days.");
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
    const requestedDays = Math.floor(days ?? 0);
    const actor = type === "permanent" || (type === "temporary" && requestedDays > 30)
      ? await requireModerationCapability(ctx, "ban")
      : await requireAnyModerationCapability(ctx, ["suspend", "ban"]);
    const target = await findUserByUsername(ctx, username);
    if (!target) throw new Error("That player could not be found.");
    if (target._id === actor._id) throw new Error("You cannot ban your own account.");
    if (isCompanyAdminAccount(target)) throw new Error("Administrator accounts cannot be banned here.");
    if ((target.role !== "user" || target.staffAccess || target.department?.trim() || target.position?.trim()) && !isCompanyAdminAccount(actor)) {
      throw new Error("Only an administrator can ban a staff account.");
    }
    if (isBanActive(target)) throw new Error("This account is already serving a ban.");
    const reason = rawReason.trim();
    if (reason.length < 10 || reason.length > 300) throw new Error("Add a reason of 10–300 characters.");
    let expiresAt: number | undefined;
    if (type === "temporary") {
      if (!Number.isFinite(requestedDays) || requestedDays < 1 || requestedDays > 90) throw new Error("Temporary restrictions last between 1 and 90 days.");
      expiresAt = Date.now() + requestedDays * 24 * 60 * 60 * 1000;
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
    const target = await ctx.db.get(userId);
    if (!target || !isBanActive(target)) throw new Error("That account is not currently banned.");
    const actor = (target.banType ?? "permanent") === "permanent"
      ? await requireModerationCapability(ctx, "ban")
      : await requireAnyModerationCapability(ctx, ["suspend", "ban"]);
    if ((target.role !== "user" || target.staffAccess || target.department?.trim() || target.position?.trim()) && !isCompanyAdminAccount(actor)) {
      throw new Error("Only an administrator can lift a restriction on a staff account.");
    }
    const reason = rawReason.trim();
    if (reason.length < 10 || reason.length > 300) throw new Error("Add a reason of 10–300 characters.");
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
