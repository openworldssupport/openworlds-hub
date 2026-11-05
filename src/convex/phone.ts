"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { getTwilioConfig, twilioConfigStatus } from "./twilioConfig";

const TWILIO_VERIFY_API = "https://verify.twilio.com/v2/Services";

/** Configuration state for the settings UI. Never returns secret values. */
export const providerStatus = internalAction({
  args: {},
  handler: async () => twilioConfigStatus(),
});

async function twilioFailure(response: Response, fallback: string) {
  let code: number | undefined;
  try {
    const body = await response.json() as { code?: number };
    code = typeof body.code === "number" ? body.code : undefined;
  } catch {
    // Twilio did not return JSON; fall back to the status text.
  }

  switch (code) {
    case 20003:
      return new Error("Twilio rejected the credentials. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN, or the API key and secret.");
    case 20404:
      return new Error("Twilio could not find the Verify service. Check that TWILIO_VERIFY_SERVICE_SID is the VA… service SID from Twilio Verify.");
    case 20429:
      return new Error("Twilio is rate-limiting requests. Wait a minute and try again.");
    case 21211:
    case 60200:
      return new Error("Twilio rejected the phone number. Use international format, for example +4512345678.");
    case 21608:
      return new Error("Twilio is still in trial mode, so it can only text numbers verified in the Twilio Console. Verify this number there or upgrade the Twilio account.");
    case 21610:
      return new Error("That number has opted out of Twilio messages. Text START to the Twilio sender number, then try again.");
    case 21612:
      return new Error("Twilio cannot route text messages to that number. Check the number and try another one.");
    case 21614:
      return new Error("That number is not a mobile number that can receive text messages.");
    case 60203:
      return new Error("Too many verification attempts for that number. Wait a few minutes and request a new code.");
    default:
      return new Error(
        code
          ? `${fallback} Twilio error ${code}. Check the Twilio Console logs for details.`
          : `${fallback} Twilio returned HTTP ${response.status}.`,
      );
  }
}

/**
 * Sends a one-time SMS through Twilio Verify. Verify handles delivery,
 * expiration, and per-number rate limits; we only store the challenge state.
 */
export const sendCode = internalAction({
  args: { phoneNumber: v.string() },
  handler: async (_ctx, { phoneNumber }) => {
    const config = getTwilioConfig();
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
      throw await twilioFailure(response, "The SMS provider could not send the verification code.");
    }
    return { sent: true as const };
  },
});

/** Checks a code without storing the code or the Twilio response in our database. */
export const checkCode = internalAction({
  args: { phoneNumber: v.string(), code: v.string() },
  handler: async (_ctx, { phoneNumber, code }) => {
    const config = getTwilioConfig();
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
    // Twilio returns 404 when the code is wrong or the verification expired.
    if (response.status === 404) return { approved: false as const };
    if (!response.ok) {
      throw await twilioFailure(response, "The SMS provider could not verify that code.");
    }
    const result = await response.json() as { status?: string };
    return { approved: result.status === "approved" };
  },
});
