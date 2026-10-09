import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";
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
      await axios.post(
        freebuffEmailOtpUrl(),
        {
          to: emailLower,
          otp: token,
        },
        {
          headers: {
            ...freebuffEmailOtpHeaders(),
          },
        },
      );
    } catch (error) {
      throw freebuffEmailOtpError(error);
    }
  },
});

// Sign-in codes are sent by the Freebuff integrations gateway, which knows
// this project by its own key: VLY_INTEGRATION_KEY, a Convex environment
// variable set when the project was created. The email's wording is fixed by
// the gateway.
function freebuffEmailOtpUrl(): string {
  const base =
    process.env.VLY_INTEGRATION_BASE_URL || "https://integrations.vly.ai";
  return `${base.replace(/\/+$/, "")}/v1/email/otp`;
}

function freebuffEmailOtpHeaders(): Record<string, string> {
  const key = process.env.VLY_INTEGRATION_KEY;
  if (!key) {
    throw new Error(
      "VLY_INTEGRATION_KEY is not set on this Convex deployment, so email sign-in cannot send codes.",
    );
  }
  return { Authorization: `Bearer ${key}` };
}

// Never stringify the whole request error: it carries the request headers.
function freebuffEmailOtpError(error: unknown): Error {
  const response = (
    error as { response?: { status?: number; data?: { error?: unknown } } }
  )?.response;
  if (response) {
    return new Error("Could not send a sign-in code. Please try again later.");
  }
  return new Error("Could not send the sign-in code. Please try again later.");
}
