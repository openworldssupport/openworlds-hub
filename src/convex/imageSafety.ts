import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireModerationActor } from "./moderationAccess";
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
 * If the provider is not configured, the upload is saved without screening so
 * profile photos still work; provider failures still fail closed. Set
 * IMAGE_MODERATION_STRICT=true to also refuse uploads without credentials.
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

/**
 * Claims a newly uploaded object for the signed-in uploader before any safety
 * check runs. This makes later cleanup ownership-checked instead of trusting a
 * raw storage ID supplied by the browser.
 */
export const uploadPurpose = internalQuery({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return Boolean(await ctx.db.query("announcementAssets")
      .withIndex("by_storage_id", (q) => q.eq("storageId", storageId))
      .unique());
  },
});

export const claimUpload = internalMutation({
  args: { userId: v.id("users"), storageId: v.id("_storage") },
  handler: async (ctx, { userId, storageId }) => {
    const existing = await ctx.db.query("playerMedia")
      .withIndex("by_storage_id", (q) => q.eq("storageId", storageId))
      .unique();
    if (existing) {
      if (existing.ownerId !== userId || existing.kind !== "profile") {
        throw new Error("This upload belongs to another account or purpose.");
      }
      return { claimed: false as const };
    }
    await ctx.db.insert("playerMedia", { storageId, ownerId: userId, kind: "profile", createdAt: Date.now() });
    return { claimed: true as const };
  },
});

/** Deletes an upload that was rejected before it could be attached. */
export const discardUpload = internalMutation({
  args: { userId: v.id("users"), storageId: v.id("_storage") },
  handler: async (ctx, { userId, storageId }) => {
    const asset = await ctx.db.query("playerMedia").withIndex("by_storage_id", (q) => q.eq("storageId", storageId)).unique();
    // Never delete an object merely because a client supplied its storage ID.
    // Only the uploader's own claimed object can be discarded here, and never
    // the photo that is currently active on the account.
    if (!asset || asset.ownerId !== userId || asset.kind !== "profile") return { discarded: false as const };
    const user = await ctx.db.get(userId);
    if (user?.profileImageStorageId === storageId) return { discarded: false as const };
    // Never let an uploader erase the only copy of an image-safety case while
    // reviewers may still need it as evidence.
    const cases = await ctx.db.query("mediaModeration")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    if (cases.some((item) => item.storageId === storageId)) return { discarded: false as const };
    await ctx.storage.delete(storageId);
    await ctx.db.delete(asset._id);
    return { discarded: true as const };
  },
});

async function attachProfileImage(ctx: MutationCtx, userId: Id<"users">, storageId: Id<"_storage">) {
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
}

/** Stores a profile image that passed the safety check. */
export const applyProfileImage = internalMutation({
  args: { userId: v.id("users"), storageId: v.id("_storage") },
  handler: async (ctx, { userId, storageId }) => await attachProfileImage(ctx, userId, storageId),
});

/** Removes a flagged image, pauses uploads, records the case, and alerts staff. */
export const recordBlockedImage = internalMutation({
  args: { userId: v.id("users"), storageId: v.id("_storage"), reason: v.string(), detail: v.string() },
  handler: async (ctx, { userId, storageId, reason, detail }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
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
      storageId,
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
      throw new Error("Sign in to update your profile photo.");
    }
    if (uploader.imageUploadBlockedUntil > Date.now()) {
      throw new Error("Profile photo uploads are paused on this account while the contact team reviews a safety flag. You can still use an existing photo.");
    }
    const announcementAsset = await ctx.runQuery(internal.imageSafety.uploadPurpose, { storageId });
    if (announcementAsset) throw new Error("This upload belongs to an announcement.");
    await ctx.runMutation(internal.imageSafety.claimUpload, { userId: uploader.userId, storageId });
    const metadata = await ctx.runQuery(internal.imageSafety.uploadMetadata, { storageId });
    if (!metadata || !ALLOWED_TYPES.includes(metadata.contentType ?? "") || metadata.size > MAX_BYTES) {
      await ctx.runMutation(internal.imageSafety.discardUpload, { userId: uploader.userId, storageId });
      throw new Error("Choose a JPG, PNG, WebP, or GIF image up to 5 MB.");
    }
    const apiUser = process.env.SIGHTENGINE_API_USER?.trim();
    const apiSecret = process.env.SIGHTENGINE_API_SECRET?.trim();
    if (!apiUser || !apiSecret) {
      if (process.env.IMAGE_MODERATION_STRICT === "true") {
        await ctx.runMutation(internal.imageSafety.discardUpload, { userId: uploader.userId, storageId });
        throw new Error("Profile photo uploads are paused while the automatic image safety check is unavailable. Please email contact@openworlds.dk if this continues.");
      }
      console.warn("[image-safety] Sightengine is not configured; saving the profile photo without automatic screening.");
      const fallback: { url: string | null } = await ctx.runMutation(internal.imageSafety.applyProfileImage, { userId: uploader.userId, storageId });
      return { url: fallback.url, screened: false };
    }
    const blob = await ctx.storage.get(storageId);
    if (!blob) {
      await ctx.runMutation(internal.imageSafety.discardUpload, { userId: uploader.userId, storageId });
      throw new Error("That upload could not be read. Please try again.");
    }
    let result: SafetyResult;
    try {
      result = await checkImage(blob, apiUser, apiSecret);
    } catch {
      await ctx.runMutation(internal.imageSafety.discardUpload, { userId: uploader.userId, storageId });
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
    const applied: { url: string | null } = await ctx.runMutation(internal.imageSafety.applyProfileImage, { userId: uploader.userId, storageId });
    return { url: applied.url, screened: true };
  },
});

/**
 * Contact team decision on a flagged image. "allow" restores the quarantined
 * image as the profile photo and lifts the upload pause; "keep-blocked"
 * deletes it and leaves the automatic pause in place.
 */
export const resolveMediaCase = mutation({
  args: {
    caseId: v.id("mediaModeration"),
    decision: v.union(v.literal("allow"), v.literal("keep-blocked")),
    note: v.string(),
  },
  handler: async (ctx, { caseId, decision, note: rawNote }) => {
    const actor = await requireModerationActor(ctx);
    const record = await ctx.db.get(caseId);
    if (!record || record.status !== "open") throw new Error("This image-safety case is already closed.");
    const note = rawNote.trim();
    if (note.length < 5 || note.length > 300) throw new Error("Add a review note of 5–300 characters.");
    const now = Date.now();

    if (decision === "allow") {
      if (!record.storageId) throw new Error("The quarantined image is no longer available to restore.");
      const metadata = await ctx.db.system.get("_storage", record.storageId);
      if (!metadata) throw new Error("The quarantined image is no longer available to restore.");
      await attachProfileImage(ctx, record.userId, record.storageId);
      await ctx.db.patch(record.userId, { imageUploadBlockedUntil: undefined });
    } else if (record.storageId) {
      await ctx.storage.delete(record.storageId);
      const asset = await ctx.db.query("playerMedia").withIndex("by_storage_id", (q) => q.eq("storageId", record.storageId!)).unique();
      if (asset) await ctx.db.delete(asset._id);
    }

    await ctx.db.patch(caseId, {
      status: "reviewed",
      decision: decision === "allow" ? "allowed" : "blocked",
      note,
      reviewedAt: now,
      reviewedBy: actor._id,
    });
    await recordAudit(ctx, {
      actorId: actor._id,
      actorLabel: accountLabel(actor),
      action: "image-reviewed",
      targetId: record.userId,
      targetLabel: record.displayName,
      reason: `${decision === "allow" ? "Image restored" : "Image kept blocked"}: ${note}`,
    });
    return { ok: true as const };
  },
});
