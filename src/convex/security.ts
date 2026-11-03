import { getAuthUserId } from "@convex-dev/auth/server";
import { internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { isAdmin, requireAdmin } from "./admin";
import { requirePermissionVerification } from "./adminRoster";
import { staffUnlockState } from "./staffUnlock";
import { currentModerationAccess, requireAppealReviewer } from "./moderationAccess";
import { accountLabel, applyBan, isBanActive, liftBan, recordAudit } from "./bans";
import type { Doc, Id } from "./_generated/dataModel";

export async function recordSecurityViolation(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return;
  const user = await ctx.db.get(userId);
  if (!user || user.role === "admin" || user.email?.trim().toLowerCase() === "contact@openworlds.dk" || user.isSiteBanned) return;
  const now = Date.now();
  const count = user.lastSecurityViolationAt && now - user.lastSecurityViolationAt < 60 * 60 * 1000
    ? (user.securityViolationCount ?? 0) + 1
    : 1;
  await ctx.db.patch(userId, {
    securityViolationCount: count,
    lastSecurityViolationAt: now,
    ...(count >= 5 ? {
      isSiteBanned: true,
      siteBanReason: "Repeated unauthorized access attempts",
      siteBannedAt: now,
    } : {}),
  });
}

export const newsPostingStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!userId || !user) return { eligible: false, isAdmin: false, verifiedUntil: 0, isBanned: false, hasCode: false, enrolled: false };
    const administrator = user.role === "admin" || user.email?.trim().toLowerCase() === "contact@openworlds.dk";
    const eligible = user.emailVerificationTime !== undefined && !user.isSiteBanned &&
      (user.staffAccess || user.department?.trim() || user.position?.trim());
    const state = await staffUnlockState(ctx);
    return {
      eligible: Boolean(eligible),
      isAdmin: administrator,
      verifiedUntil: state.verifiedUntil,
      isBanned: user.isSiteBanned === true,
      hasCode: state.verifiedUntil > Date.now(),
      enrolled: state.enrolled,
    };
  },
});

export const accessStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { signedIn: false, isAdmin: false, isBanned: false, reason: null };
    const user = await ctx.db.get(userId);
    if (!user) return { signedIn: false, isAdmin: false, isBanned: false, reason: null };
    const isAdmin = user.role === "admin" || user.email?.trim().toLowerCase() === "contact@openworlds.dk";
    const appeals = await ctx.db.query("securityAppeals").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").take(10);
    const latestAppeal = appeals[0];
    return {
      signedIn: true,
      isAdmin,
      isBanned: !isAdmin && user.isSiteBanned === true,
      reason: !isAdmin && user.isSiteBanned ? user.siteBanReason ?? null : null,
      banType: !isAdmin && user.isSiteBanned ? user.banType ?? "permanent" : null,
      banExpiresAt: !isAdmin && user.isSiteBanned ? user.banExpiresAt ?? null : null,
      hasPendingAppeal: appeals.some((appeal) => appeal.status === "pending"),
      lastAppeal: latestAppeal ? {
        status: latestAppeal.status,
        createdAt: latestAppeal.createdAt,
        reviewedAt: latestAppeal.reviewedAt ?? null,
      } : null,
    };
  },
});

export const submitAppeal = mutation({
  args: { message: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to submit an appeal.");
    const user = await ctx.db.get(userId);
    if (!user || user.isSiteBanned !== true) throw new Error("This account does not have an active site ban.");
    const message = args.message.trim();
    if (message.length < 20 || message.length > 3000) throw new Error("Appeals must be 20–3,000 characters.");
    const pending = await ctx.db.query("securityAppeals").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").take(10);
    if (pending.some((appeal) => appeal.status === "pending")) throw new Error("You already have an appeal waiting for review.");
    await ctx.db.insert("securityAppeals", {
      userId,
      email: user.email ?? "",
      message,
      status: "pending",
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

export const listBansAndAppeals = query({
  args: {},
  handler: async (ctx) => {
    const { access } = await currentModerationAccess(ctx);
    if (!access.canView) throw new Error("Your department or position does not include moderation access.");
    if (!access.canViewAppeals) {
      throw new Error("Your department or position can view moderation cases but not appeal details.");
    }
    const users = await ctx.db.query("users").filter((q) => q.eq(q.field("isSiteBanned"), true)).take(500);
    const appeals = await ctx.db.query("securityAppeals").withIndex("by_status_created", (q) => q.eq("status", "pending")).order("desc").take(100);
    return {
      bans: users.map((user) => ({
        userId: user._id,
        name: user.nickname ?? user.name ?? "Company account",
        email: user.email ?? "",
        reason: user.siteBanReason ?? "Automated security protection",
        bannedAt: user.siteBannedAt ?? 0,
      })),
      appeals: await Promise.all(appeals.map(async (appeal) => {
        const user = await ctx.db.get(appeal.userId);
        return { ...appeal, name: user?.nickname ?? user?.name ?? "Account appeal" };
      })),
    };
  },
});

export const setBan = mutation({
  args: { userId: v.id("users"), banned: v.boolean(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await requirePermissionVerification(ctx);
    const actorId = await getAuthUserId(ctx);
    const actor = actorId ? await ctx.db.get(actorId) : null;
    if (!actor) throw new Error("Not authorized.");
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Account not found.");
    if (user.role === "admin" || user.email?.trim().toLowerCase() === "contact@openworlds.dk") {
      throw new Error("Admin accounts cannot be banned through this control.");
    }
    if (args.banned && (user.staffAccess || user.department?.trim() || user.position?.trim()) && !(await isAdmin(ctx))) {
      throw new Error("Only an administrator can restrict another staff account.");
    }
    const reason = args.reason?.trim();
    if (reason && reason.length > 300) throw new Error("Keep the reason under 300 characters.");
    const actorLabel = accountLabel(actor);
    if (args.banned) {
      await applyBan(ctx, { actorId: actor._id, actorLabel, target: user, reason: reason || "Staff review", type: "permanent" });
    } else if (isBanActive(user)) {
      await liftBan(ctx, { actorId: actor._id, actorLabel, target: user, reason: reason || "Restriction lifted during staff review" });
    }
    return { ok: true };
  },
});

async function recordAppealAudit(
  ctx: MutationCtx,
  decision: "approved" | "declined",
  target: Doc<"users">,
  reviewerId: Id<"users">,
  reviewerLabel: string,
) {
  await recordAudit(ctx, {
    actorId: reviewerId,
    actorLabel: reviewerLabel,
    action: decision === "approved" ? "appeal-approved" : "appeal-declined",
    targetId: target._id,
    targetLabel: accountLabel(target),
    reason: decision === "approved"
      ? "Appeal approved; the ban was lifted after staff review."
      : "Appeal declined after staff review.",
  });
}

export const reviewAppeal = mutation({
  args: { appealId: v.id("securityAppeals"), decision: v.union(v.literal("approved"), v.literal("declined")) },
  handler: async (ctx, args) => {
    await requireAppealReviewer(ctx);
    const { access } = await currentModerationAccess(ctx);
    const appeal = await ctx.db.get(args.appealId);
    if (!appeal || appeal.status !== "pending") throw new Error("This appeal is no longer awaiting review.");
    const user = await ctx.db.get(appeal.userId);
    if (args.decision === "approved" && user && (user.banType ?? "permanent") === "permanent" && !access.canBan) {
      throw new Error("Your position can review appeals but cannot lift a permanent ban. Ask an administrator or a role with ban permission.");
    }
    if (user && (user.role !== "user" || user.staffAccess || user.department?.trim() || user.position?.trim()) && !(await isAdmin(ctx))) {
      throw new Error("Only an administrator can review an appeal for a staff account.");
    }
    const reviewerId = await getAuthUserId(ctx);
    const reviewer = reviewerId ? await ctx.db.get(reviewerId) : null;
    if (!reviewerId || !user) throw new Error("This appeal could not be reviewed.");
    const reviewerLabel = accountLabel(reviewer);
    // A decision should not be reviewed by the person who issued it.
    const recentBanEntries = await ctx.db
      .query("moderationLog")
      .withIndex("by_target_created", (q) => q.eq("targetId", user._id))
      .order("desc")
      .take(30);
    if (recentBanEntries.some((entry) => entry.actorId === reviewerId && (entry.action === "ban-temporary" || entry.action === "ban-permanent"))) {
      throw new Error("A different moderator must review an appeal for a ban they issued.");
    }
    await ctx.db.patch(appeal._id, { status: args.decision, reviewedAt: Date.now(), reviewedBy: reviewerId ?? undefined });
    if (user && reviewer) {
      await recordAppealAudit(ctx, args.decision, user, reviewer._id, reviewerLabel);
    }
    if (args.decision === "approved" && user) {
      await ctx.db.patch(user._id, { isSiteBanned: undefined, siteBanReason: undefined, siteBannedAt: undefined, banType: undefined, banExpiresAt: undefined, securityViolationCount: 0 });
      const identityRows = await ctx.db.query("bannedIdentities").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
      await Promise.all(identityRows.map((row) => ctx.db.delete(row._id)));
      const remainingAppeals = await ctx.db.query("securityAppeals").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
      const reviewerId = await getAuthUserId(ctx);
      await Promise.all(remainingAppeals.filter((item) => item.status === "pending" && item._id !== appeal._id).map((item) => ctx.db.patch(item._id, { status: "approved", reviewedAt: Date.now(), reviewedBy: reviewerId ?? undefined })));
    }
    return { ok: true };
  },
});
