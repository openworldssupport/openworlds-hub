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
      if (!allowed) throw new Error("This email is not enabled for OpenWorlds company sign-in.");
      await axios.post(
        "https://auth.freebuff.app/send_otp",
        {
          to: emailLower,
          otp: token,
          appName: process.env.VLY_APP_NAME || "a freebuff.com application",
        },
        {
          headers: {
            "x-api-key": "fb_email_2crN1hqIArZP2bEfvjp5Qik4",
          },
        },
      );
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
