import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { isOwnerAdmin } from "./admin";
import { requirePermissionVerification } from "./adminRoster";
import { accountLabel } from "./bans";
import { isEmailAddress, maskEmail } from "../lib/staff";

const MAX_RECORDS = 500;
const MAX_MESSAGES = 500;

const requestTypeValidator = v.union(
  v.literal("law-enforcement"),
  v.literal("legal"),
);

/**
 * Full-record access is a legal-disclosure path only: the owner account, with
 * a live authenticator unlock, and a valid law-enforcement or legal request.
 */
async function requireOwnerInvestigator(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  const actor = userId ? await ctx.db.get(userId) : null;
  if (!isOwnerAdmin(actor)) {
    throw new Error("Only the owner account can open a legal-disclosure file.");
  }
  await requirePermissionVerification(ctx);
  return actor!;
}

function redactAccount(user: Doc<"users">) {
  const account: Record<string, unknown> = { ...user };
  // Never export authentication secrets or recovery-code hashes, even to the
  // owner. Investigators need account facts, not credentials.
  delete account.twoFactorSecret;
  delete account.twoFactorPendingSecret;
  delete account.twoFactorRecoveryCodeHashes;
  return account;
}

/** Owner-only: find any account, including staff and admins, without exposing raw email. */
export const searchAccounts = query({
  args: { search: v.string() },
  handler: async (ctx, { search }) => {
    await requireOwnerInvestigator(ctx);
    const term = search.trim().slice(0, 80);
    if (term.length < 2) return [];

    const normalized = term.toLowerCase();
    const usernameTerm = normalized.replace(/^@/, "");
    const directId = ctx.db.normalizeId("users", term);
    const [byId, byUsername, byName, byNickname, byEmail, byRecoveryEmail] = await Promise.all([
      directId ? ctx.db.get(directId) : Promise.resolve(null),
      ctx.db.query("users").withSearchIndex("search_players_by_username", (q) => q.search("playerLogin", usernameTerm)).take(25),
      ctx.db.query("users").withSearchIndex("search_players_by_name", (q) => q.search("name", term)).take(25),
      ctx.db.query("users").withSearchIndex("search_public_nicknames", (q) => q.search("nickname", term)).take(25),
      normalized.includes("@")
        ? ctx.db.query("users").withIndex("email", (q) => q.eq("email", normalized)).first()
        : Promise.resolve(null),
      normalized.includes("@")
        ? ctx.db.query("users").withIndex("by_recovery_email", (q) => q.eq("recoveryEmail", normalized)).first()
        : Promise.resolve(null),
    ]);

    const unique = new Map(
      [byId, byUsername, byName, byNickname, byEmail, byRecoveryEmail]
        .flat()
        .filter((user): user is Doc<"users"> => Boolean(user))
        .map((user) => [user._id, user]),
    );

    return [...unique.values()]
      .map((user) => ({
        userId: user._id,
        username: user.playerLogin?.trim() ?? null,
        displayName: [user.nickname, user.name].find((value) => value?.trim() && !isEmailAddress(value))?.trim() ?? null,
        email: maskEmail(user.email),
        role: user.role ?? null,
        department: user.department ?? null,
        position: user.position ?? null,
        isBanned: user.isSiteBanned === true,
      }))
      .sort((a, b) => {
        const aExact = a.username?.toLowerCase() === usernameTerm || a.displayName?.toLowerCase() === normalized;
        const bExact = b.username?.toLowerCase() === usernameTerm || b.displayName?.toLowerCase() === normalized;
        return Number(bExact) - Number(aExact) || (a.username ?? a.displayName ?? "").localeCompare(b.username ?? b.displayName ?? "");
      })
      .slice(0, 25);
  },
});

/** Owner-only: recent dossier openings, including legal-request details. */
export const listRecentInvestigationAccess = query({
  args: {},
  handler: async (ctx) => {
    await requireOwnerInvestigator(ctx);
    const rows = await ctx.db
      .query("investigationAccessLog")
      .withIndex("by_created")
      .order("desc")
      .take(50);
    return await Promise.all(rows.map(async (row) => {
      const target = await ctx.db.get(row.targetId);
      return {
        _id: row._id,
        targetId: row.targetId,
        targetLabel: target ? accountLabel(target) : "Deleted account",
        targetEmail: target ? maskEmail(target.email) : null,
        requestType: row.requestType ?? "internal-safety" as const,
        reason: row.reason,
        legalAuthority: row.legalAuthority ?? null,
        legalReference: row.legalReference ?? null,
        jurisdiction: row.jurisdiction ?? null,
        legalBasis: row.legalBasis ?? null,
        createdAt: row.createdAt,
      };
    }));
  },
});

/**
 * Owner-only: build one complete legal-disclosure file for an account. This is
 * a mutation so the access is written to investigationAccessLog in the same
 * transaction as the read. The UI must never cache the result.
 */
export const openAccountInvestigation = mutation({
  args: {
    userId: v.id("users"),
    reason: v.string(),
    requestType: requestTypeValidator,
    legalAuthority: v.optional(v.string()),
    legalReference: v.optional(v.string()),
    jurisdiction: v.optional(v.string()),
    legalBasis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireOwnerInvestigator(ctx);
    const reason = args.reason.trim();
    if (reason.length < 10 || reason.length > 500) {
      throw new Error("Describe the investigation reason in 10–500 characters.");
    }

    const legalAuthority = args.legalAuthority?.trim() ?? "";
    const legalReference = args.legalReference?.trim() ?? "";
    const jurisdiction = args.jurisdiction?.trim() ?? "";
    const legalBasis = args.legalBasis?.trim() ?? "";
    // Full account records are a legal-disclosure path only. Internal review
    // must use the normal masked staff/admin tools.
    if (legalAuthority.length < 2 || legalAuthority.length > 160) {
      throw new Error("Record the requesting authority or agency in 2–160 characters.");
    }
    if (legalReference.length < 2 || legalReference.length > 120) {
      throw new Error("Record the case, ticket, or order reference in 2–120 characters.");
    }
    if (jurisdiction.length < 2 || jurisdiction.length > 80) {
      throw new Error("Record the jurisdiction in 2–80 characters.");
    }
    if (legalBasis.length < 3 || legalBasis.length > 300) {
      throw new Error("Record the legal basis under the GDPR and Danish law in 3–300 characters.");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("Account not found.");

    const now = Date.now();
    await ctx.db.insert("investigationAccessLog", {
      actorId: actor._id,
      targetId: target._id,
      reason,
      requestType: args.requestType,
      legalAuthority,
      legalReference,
      jurisdiction,
      legalBasis,
      createdAt: now,
    });

    const email = target.email?.trim().toLowerCase() ?? "";
    const recoveryEmail = target.recoveryEmail?.trim().toLowerCase() ?? "";

    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), target._id))
      .take(50);
    const authSessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", target._id))
      .take(100);
    const companyAccess = email
      ? await ctx.db.query("companyAccess").withIndex("by_email", (q) => q.eq("email", email)).first()
      : null;
    const staffConversions = await ctx.db
      .query("staffConversions")
      .withIndex("by_user", (q) => q.eq("userId", target._id))
      .take(20);
    const appeals = await ctx.db
      .query("securityAppeals")
      .withIndex("by_user", (q) => q.eq("userId", target._id))
      .take(100);
    const reportsAgainst = await ctx.db
      .query("playerReports")
      .withIndex("by_target", (q) => q.eq("targetId", target._id))
      .take(MAX_RECORDS);
    const reportsBy = await ctx.db
      .query("playerReports")
      .withIndex("by_reporter_created", (q) => q.eq("reporterId", target._id))
      .take(MAX_RECORDS);
    const warnings = await ctx.db
      .query("moderationWarnings")
      .withIndex("by_target_created", (q) => q.eq("targetId", target._id))
      .take(MAX_RECORDS);
    const assessments = await ctx.db
      .query("moderationAssessments")
      .withIndex("by_target_created", (q) => q.eq("targetId", target._id))
      .take(MAX_RECORDS);
    const moderationLogByTarget = await ctx.db
      .query("moderationLog")
      .withIndex("by_target_created", (q) => q.eq("targetId", target._id))
      .take(MAX_RECORDS);
    const moderationLogByActor = await ctx.db
      .query("moderationLog")
      .filter((q) => q.eq(q.field("actorId"), target._id))
      .take(200);
    const bannedIdentities = await ctx.db
      .query("bannedIdentities")
      .withIndex("by_user", (q) => q.eq("userId", target._id))
      .take(50);
    const mediaModeration = await ctx.db
      .query("mediaModeration")
      .withIndex("by_user_created", (q) => q.eq("userId", target._id))
      .take(200);
    const devices = await ctx.db
      .query("accountDevices")
      .withIndex("by_user", (q) => q.eq("userId", target._id))
      .take(200);
    const creatorsByLink = await ctx.db
      .query("officialCreators")
      .withIndex("by_linked_user", (q) => q.eq("linkedUserId", target._id))
      .take(20);
    const creatorsByEmail = recoveryEmail
      ? await ctx.db.query("officialCreators").withIndex("by_email", (q) => q.eq("email", recoveryEmail)).take(20)
      : [];
    const worlds = await ctx.db
      .query("publishedWorlds")
      .withIndex("by_owner", (q) => q.eq("ownerId", target._id))
      .take(MAX_RECORDS);
    const gameData = await ctx.db
      .query("playerGameData")
      .withIndex("by_user", (q) => q.eq("userId", target._id))
      .first();
    const legalAcceptances = await ctx.db
      .query("legalAcceptances")
      .withIndex("by_user", (q) => q.eq("userId", target._id))
      .take(50);
    const friendRequestsOut = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender", (q) => q.eq("senderId", target._id))
      .take(MAX_RECORDS);
    const friendRequestsIn = await ctx.db
      .query("friendRequests")
      .withIndex("by_receiver", (q) => q.eq("receiverId", target._id))
      .take(MAX_RECORDS);
    const messages = (await ctx.db
      .query("playerMessages")
      .filter((q) => q.or(q.eq(q.field("senderId"), target._id), q.eq(q.field("receiverId"), target._id)))
      .take(MAX_MESSAGES))
      .sort((a, b) => b.createdAt - a.createdAt);
    const supportTickets = email
      ? await ctx.db.query("supportTickets").withIndex("by_email_submitted_at", (q) => q.eq("email", email)).take(200)
      : [];
    const priorInvestigations = await ctx.db
      .query("investigationAccessLog")
      .withIndex("by_target_created", (q) => q.eq("targetId", target._id))
      .take(100);
    const profileMedia = await ctx.db
      .query("playerMedia")
      .withIndex("by_owner_kind", (q) => q.eq("ownerId", target._id).eq("kind", "profile"))
      .take(200);
    const worldMedia = await ctx.db
      .query("playerMedia")
      .withIndex("by_owner_kind", (q) => q.eq("ownerId", target._id).eq("kind", "world"))
      .take(200);
    const staffMessages = await ctx.db
      .query("staffMessages")
      .filter((q) => q.eq(q.field("authorId"), target._id))
      .take(200);
    const departmentPosts = await ctx.db
      .query("departmentPosts")
      .filter((q) => q.eq(q.field("authorId"), target._id))
      .take(200);
    const staffGeneralPosts = await ctx.db
      .query("staffGeneralPosts")
      .filter((q) => q.eq(q.field("authorId"), target._id))
      .take(200);
    const gameAnnouncements = await ctx.db
      .query("gameAnnouncements")
      .filter((q) => q.eq(q.field("authorId"), target._id))
      .take(200);
    const departmentMeetings = await ctx.db
      .query("departmentMeetings")
      .filter((q) => q.eq(q.field("createdBy"), target._id))
      .take(100);

    return {
      generatedAt: now,
      request: {
        type: args.requestType,
        reason,
        legalAuthority,
        legalReference,
        jurisdiction,
        legalBasis,
      },
      actor: {
        userId: actor._id,
        label: accountLabel(actor),
      },
      limits: {
        perCollection: MAX_RECORDS,
        messages: MAX_MESSAGES,
        note: "Collections are capped to keep the response within Convex limits; the cap is shown here for the record.",
      },
      account: redactAccount(target),
      authAccounts: authAccounts.map(({ secret: _secret, ...account }) => account),
      authSessions,
      companyAccess,
      staffConversions: staffConversions.map(({ codeHash: _codeHash, ...conversion }) => conversion),
      appeals,
      reportsAgainst,
      reportsBy,
      warnings,
      assessments,
      moderationLogByTarget,
      moderationLogByActor,
      bannedIdentities,
      mediaModeration,
      devices,
      creators: [...creatorsByLink, ...creatorsByEmail.filter((record) => !creatorsByLink.some((linked) => linked._id === record._id))],
      worlds,
      gameData,
      legalAcceptances,
      friendRequests: [...friendRequestsOut, ...friendRequestsIn],
      messages,
      supportTickets,
      priorInvestigations,
      media: [...profileMedia, ...worldMedia],
      staffMessages,
      departmentPosts,
      staffGeneralPosts,
      gameAnnouncements,
      departmentMeetings,
    };
  },
});
