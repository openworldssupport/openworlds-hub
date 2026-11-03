import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, type MutationCtx, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireSiteAvailable } from "./siteStatus";
import { requireStaffUnlock } from "./staffUnlock";
import { accountLabel, recordAudit } from "./bans";
import type { Id } from "./_generated/dataModel";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;
const BLOCK_MS = 24 * 60 * 60 * 1000;
const SIGHTENGINE_URL = "https://api.sightengine.com/1.0/check.json";

type SafetyResult = { flagged: boolean; reason: string; detail: string };

/** The signed-in uploader, or null when signed out or banned. */
export const uploaderState = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!user || user.isSiteBanned) return null;
    return {
      userId: user._id,
      imageUploadBlockedUntil: user.imageUploadBlockedUntil ?? 0,
      role: user.role ?? null,
    };
  },
});

export const uploadMetadata = internalQuery({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const metadata = await ctx.db.system.get("_storage", storageId);
    return metadata ? { contentType: metadata.contentType ?? null, size: metadata.size } : null;
  },
});

function score(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * Automatic image safety check. Uses Sightengine (nudity, offensive, gore).
 * Fails closed: if the provider is not configured or unreachable, the image is
 * refused rather than published unchecked.
 */
async function checkImage(blob: Blob, apiUser: string, apiSecret: string): Promise<SafetyResult> {
  const form = new FormData();
  form.append("media", blob, "profile-image");
  form.append("models", "nudity-2.1,offensive,gore-2.0");
  form.append("api_user", apiUser);
  form.append("api_secret", apiSecret);
  const response = await fetch(SIGHTENGINE_URL, { method: "POST", body: form });
  if (!response.ok) throw new Error(`Image check failed with status ${response.status}.`);
  const result = await response.json() as {
    nudity?: Record<string, unknown>;
    offensive?: Record<string, unknown>;
    gore?: Record<string, unknown>;
  };
  const sexual = Math.max(
    score(result.nudity?.sexual_activity),
    score(result.nudity?.sexual_display),
    score(result.nudity?.erotica),
  );
  const offensive = score(result.offensive?.prob);
  const gore = score(result.gore?.prob);
  const detail = `sexual=${sexual.toFixed(2)} offensive=${offensive.toFixed(2)} gore=${gore.toFixed(2)}`;
  if (sexual >= 0.5) return { flagged: true, reason: "Sexual or nude content", detail };
  if (offensive >= 0.6) return { flagged: true, reason: "Offensive or extremist content", detail };
  if (gore >= 0.6) return { flagged: true, reason: "Graphic violent content", detail };
  return { flagged: false, reason: "No violations found", detail };
}

/** Deletes an upload that was rejected before it could be attached. */
export const discardUpload = internalMutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await ctx.storage.delete(storageId);
    const asset = await ctx.db.query("playerMedia").withIndex("by_storage_id", (q) => q.eq("storageId", storageId)).unique();
    if (asset) await ctx.db.delete(asset._id);
  },
});

/** Stores a profile image that passed the safety check. */
export const applyProfileImage = internalMutation({
  args: { userId: v.id("users"), storageId: v.id("_storage") },
  handler: async (ctx, { userId, storageId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Account not found.");
    const existing = await ctx.db.query("playerMedia").withIndex("by_storage_id", (q) => q.eq("storageId", storageId)).unique();
    if (existing && (existing.ownerId !== userId || existing.kind !== "profile")) {
      throw new Error("This upload belongs to another account or purpose.");
    }
    if (!existing) {
      await ctx.db.insert("playerMedia", { storageId, ownerId: userId, kind: "profile", createdAt: Date.now() });
    }
    if (user.profileImageStorageId && user.profileImageStorageId !== storageId) {
      const previous = await ctx.db.query("playerMedia")
        .withIndex("by_storage_id", (q) => q.eq("storageId", user.profileImageStorageId!))
        .unique();
      if (previous?.ownerId === userId && previous.kind === "profile") {
        await ctx.storage.delete(user.profileImageStorageId);
        await ctx.db.delete(previous._id);
      }
    }
    await ctx.db.patch(userId, { profileImageStorageId: storageId });
    return { url: await ctx.storage.getUrl(storageId) };
  },
});

/** Removes a flagged image, pauses uploads, records the case, and alerts staff. */
export const recordBlockedImage = internalMutation({
  args: { userId: v.id("users"), storageId: v.id("_storage"), reason: v.string(), detail: v.string() },
  handler: async (ctx, { userId, storageId, reason, detail }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    await ctx.storage.delete(storageId);
    const now = Date.now();
    const windowOpen = user.imageViolationWindowAt && now - user.imageViolationWindowAt < 30 * 24 * 60 * 60 * 1000;
    const count = windowOpen ? (user.imageViolationCount ?? 0) + 1 : 1;
    const blockedUntil = now + BLOCK_MS;
    await ctx.db.patch(userId, {
      imageUploadBlockedUntil: blockedUntil,
      imageViolationCount: count,
      imageViolationWindowAt: windowOpen ? user.imageViolationWindowAt : now,
    });
    const caseId = await ctx.db.insert("mediaModeration", {
      userId,
      username: user.playerLogin ?? undefined,
      displayName: accountLabel(user),
      reason,
      detail,
      action: "blocked",
      status: "open",
      createdAt: now,
    });
    await recordAudit(ctx, {
      actorLabel: "Automatic image safety",
      action: "image-blocked",
      targetId: userId,
      targetLabel: accountLabel(user),
      reason: `${reason} (${detail})`,
    });
    await ctx.scheduler.runAfter(0, internal.supportEmail.sendImageSafetyAlert, {
      userName: accountLabel(user),
      username: user.playerLogin ?? null,
      reason,
      detail,
      blockedUntil,
      repeatCount: count,
    });
    return { caseId, blockedUntil };
  },
});

/** Replaces the old profile-image finalize step: validate, scan, then attach. */
export const finalizeProfileImage = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await ctx.runQuery(internal.siteStatus.requireAuthAccess, {});
    const uploader = await ctx.runQuery(internal.imageSafety.uploaderState, {});
    if (!uploader) {
      await ctx.runMutation(internal.imageSafety.discardUpload, { storageId });
      throw new Error("Sign in to update your profile photo.");
    }
    if (uploader.imageUploadBlockedUntil > Date.now()) {
      await ctx.runMutation(internal.imageSafety.discardUpload, { storageId });
      throw new Error("Profile photo uploads are paused on this account while the contact team reviews a safety flag. You can still use an existing photo.");
    }
    const metadata = await ctx.runQuery(internal.imageSafety.uploadMetadata, { storageId });
    if (!metadata || !ALLOWED_TYPES.includes(metadata.contentType ?? "") || metadata.size > MAX_BYTES) {
      await ctx.runMutation(internal.imageSafety.discardUpload, { storageId });
      throw new Error("Choose a JPG, PNG, WebP, or GIF image up to 5 MB.");
    }
    const apiUser = process.env.SIGHTENGINE_API_USER?.trim();
    const apiSecret = process.env.SIGHTENGINE_API_SECRET?.trim();
    if (!apiUser || !apiSecret) {
      await ctx.runMutation(internal.imageSafety.discardUpload, { storageId });
      throw new Error("Profile photo uploads are paused while the automatic image safety check is unavailable. Please email contact@openworlds.dk if this continues.");
    }
    const blob = await ctx.storage.get(storageId);
    if (!blob) throw new Error("That upload could not be read. Please try again.");
    let result: SafetyResult;
    try {
      result = await checkImage(blob, apiUser, apiSecret);
    } catch {
      await ctx.runMutation(internal.imageSafety.discardUpload, { storageId });
      throw new Error("The image safety check could not be completed, so the photo was not saved. Please try again shortly.");
    }
    if (result.flagged) {
      await ctx.runMutation(internal.imageSafety.recordBlockedImage, {
        userId: uploader.userId,
        storageId,
        reason: result.reason,
        detail: result.detail,
      });
      throw new Error("This image can’t be used because it breaks our content rules. It was removed and the contact team has been notified.");
    }
    await ctx.runMutation(internal.imageSafety.applyProfileImage, { userId: uploader.userId, storageId });
    return { url: await ctx.storage.getUrl(storageId) };
  },
});

async function requireModerationActor(ctx: QueryCtx | MutationCtx) {
  await requireSiteAvailable(ctx);
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const admin = Boolean(user && (user.role === "admin" || user.email?.trim().toLowerCase() === "contact@openworlds.dk"));
  const staff = Boolean(user && user.emailVerificationTime !== undefined && !user.isSiteBanned &&
    (admin || user.staffAccess || user.department?.trim() || user.position?.trim()));
  if (!user || !staff) throw new Error("Verified staff or administrator access is required.");
  await requireStaffUnlock(ctx);
  return user;
}

/** Contact team closes an automatic image-safety case after reviewing it. */
export const reviewMediaCase = mutation({
  args: { caseId: v.id("mediaModeration"), note: v.string() },
  handler: async (ctx, { caseId, note: rawNote }) => {
    const actor = await requireModerationActor(ctx);
    const record = await ctx.db.get(caseId);
    if (!record || record.status !== "open") throw new Error("This image-safety case is already closed.");
    const note = rawNote.trim();
    if (note.length < 5 || note.length > 300) throw new Error("Add a review note of 5–300 characters.");
    await ctx.db.patch(caseId, { status: "reviewed", note, reviewedAt: Date.now(), reviewedBy: actor._id });
    await recordAudit(ctx, {
      actorId: actor._id,
      actorLabel: accountLabel(actor),
      action: "image-reviewed",
      targetId: record.userId,
      targetLabel: record.displayName,
      reason: note,
    });
    return { ok: true as const };
  },
});
