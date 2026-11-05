"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const TWILIO_VERIFY_API = "https://verify.twilio.com/v2/Services";

function twilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const apiKey = process.env.TWILIO_API_KEY?.trim();
  const apiSecret = process.env.TWILIO_API_SECRET?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
  if (!accountSid || !verifyServiceSid) {
    throw new Error(
      "Phone verification is not configured yet. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN (or TWILIO_API_KEY + TWILIO_API_SECRET), and TWILIO_VERIFY_SERVICE_SID.",
    );
  }
  if (apiKey && apiSecret) {
    return { username: apiKey, password: apiSecret, verifyServiceSid };
  }
  if (authToken) {
    return { username: accountSid, password: authToken, verifyServiceSid };
  }
  throw new Error(
    "Phone verification is not configured yet. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN (or TWILIO_API_KEY + TWILIO_API_SECRET), and TWILIO_VERIFY_SERVICE_SID.",
  );
}

/**
 * Sends a one-time SMS through Twilio Verify. Verify handles delivery,
 * expiration, and per-number rate limits; we only store the challenge state.
 */
export const sendCode = internalAction({
  args: { phoneNumber: v.string() },
  handler: async (_ctx, { phoneNumber }) => {
    const config = twilioConfig();
    const response = await fetch(
      `${TWILIO_VERIFY_API}/${encodeURIComponent(config.verifyServiceSid)}/Verifications`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phoneNumber, Channel: "sms" }),
      },
    );
    if (!response.ok) {
      throw new Error("The SMS provider could not send the verification code. Check the Twilio configuration and try again.");
    }
    return { sent: true as const };
  },
});

/** Checks a code without storing the code or the Twilio response in our database. */
export const checkCode = internalAction({
  args: { phoneNumber: v.string(), code: v.string() },
  handler: async (_ctx, { phoneNumber, code }) => {
    const config = twilioConfig();
    const response = await fetch(
      `${TWILIO_VERIFY_API}/${encodeURIComponent(config.verifyServiceSid)}/VerificationCheck`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phoneNumber, Code: code }),
      },
    );
    if (response.status === 404) return { approved: false as const };
    if (!response.ok) {
      throw new Error("The SMS provider could not verify that code. Try again shortly.");
    }
    const result = await response.json() as { status?: string };
    return { approved: result.status === "approved" };
  },
});
