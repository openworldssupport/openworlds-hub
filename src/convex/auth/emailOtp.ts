import { Email } from "@convex-dev/auth/providers/Email";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest({ identifier: email, token }, ...context: [ActionCtx?]) {
    try {
      const ctx = context[0];
      if (!ctx) throw new Error("Missing auth context for company account check.");
      const emailLower = email.trim().toLowerCase();
      const allowed = await ctx.runQuery(internal.admin.isCompanyEmailAllowed, { email: emailLower });
      if (!allowed) throw new Error("Could not send a sign-in code. If this account is eligible, try again shortly.");
      await ctx.runAction(internal.supportEmail.sendCompanySignInCode, { email: emailLower, code: token });
    } catch (error) {
      throw freebuffEmailOtpError(error);
    }
  },
});

// Do not expose provider details or sign-in tokens in authentication errors.
function freebuffEmailOtpError(_error: unknown): Error {
  return new Error("Could not send a sign-in code. Please try again later.");
}
