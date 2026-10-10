import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  ACTIVE_AGREEMENT_REVISION,
  ACTIVE_PRIVACY_VERSION,
  ACTIVE_TERMS_VERSION,
} from "../lib/legalVersions";

export { ACTIVE_PRIVACY_VERSION, ACTIVE_TERMS_VERSION };

export const status = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        accepted: false,
        privacyVersion: ACTIVE_PRIVACY_VERSION,
        termsVersion: ACTIVE_TERMS_VERSION,
        acceptedAt: null,
      };
    }

    const acceptance = await ctx.db
      .query("legalAcceptances")
      .withIndex("by_user_versions_revision", (q) =>
        q
          .eq("userId", userId)
          .eq("privacyVersion", ACTIVE_PRIVACY_VERSION)
          .eq("termsVersion", ACTIVE_TERMS_VERSION)
          .eq("agreementRevision", ACTIVE_AGREEMENT_REVISION),
      )
      .first();

    const accepted = acceptance !== null;

    return {
      accepted,
      privacyVersion: ACTIVE_PRIVACY_VERSION,
      termsVersion: ACTIVE_TERMS_VERSION,
      agreementRevision: ACTIVE_AGREEMENT_REVISION,
      acceptedAt: accepted ? acceptance.acceptedAt : null,
    };
  },
});

export const acceptCurrent = mutation({
  args: {
    privacyVersion: v.string(),
    termsVersion: v.string(),
    agreementRevision: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to accept the current policies.");
    if (
      args.privacyVersion !== ACTIVE_PRIVACY_VERSION ||
      args.termsVersion !== ACTIVE_TERMS_VERSION ||
      args.agreementRevision !== ACTIVE_AGREEMENT_REVISION
    ) {
      throw new Error("The policies changed. Reload this page and review the current versions.");
    }

    const existingAcceptance = await ctx.db
      .query("legalAcceptances")
      .withIndex("by_user_versions_revision", (q) =>
        q
          .eq("userId", userId)
          .eq("privacyVersion", ACTIVE_PRIVACY_VERSION)
          .eq("termsVersion", ACTIVE_TERMS_VERSION)
          .eq("agreementRevision", ACTIVE_AGREEMENT_REVISION),
      )
      .first();
    if (existingAcceptance) return { acceptedAt: existingAcceptance.acceptedAt };

    const acceptedAt = Date.now();
    await ctx.db.insert("legalAcceptances", {
      userId,
      privacyVersion: ACTIVE_PRIVACY_VERSION,
      termsVersion: ACTIVE_TERMS_VERSION,
      agreementRevision: ACTIVE_AGREEMENT_REVISION,
      acceptedAt,
    });
    return { acceptedAt };
  },
});
