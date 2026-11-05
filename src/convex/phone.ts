"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { getSmsConfig, smsConfigStatus, type SmsConfig } from "./smsConfig";

const VONAGE_VERIFY_API = "https://api.nexmo.com/v2/verify";

type VonageErrorBody = {
  type?: string;
  title?: string;
  detail?: string;
  error_code?: string;
};

/** Configuration state for the settings UI. Never returns secret values. */
export const providerStatus = internalAction({
  args: {},
  handler: async () => smsConfigStatus(),
});

function authorization(config: SmsConfig) {
  return `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`;
}

async function readResponse(response: Response) {
  try {
    return await response.json() as Record<string, unknown>;
  } catch {
    return null;
  }
}

function errorKey(body: Record<string, unknown> | null) {
  const raw = [body?.type, body?.title, body?.detail, body?.error_code]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  if (raw.includes("whitelist") || raw.includes("white-list") || raw.includes("trial") || raw.includes("test number")) return "trial";
  if (raw.includes("invalid-code") || raw.includes("invalid code") || raw.includes("no-events") || raw.includes("does not match")) return "invalid-code";
  if (raw.includes("expired") || raw.includes("request-not-found") || raw.includes("not found")) return "expired";
  if (raw.includes("concurrent") || raw.includes("in flight") || raw.includes("in-flight")) return "concurrent";
  if (raw.includes("rate") || raw.includes("too many")) return "rate-limit";
  if (raw.includes("credit") || raw.includes("balance") || raw.includes("payment")) return "no-credit";
  if (raw.includes("number") || raw.includes("msisdn") || raw.includes("destination")) return "bad-number";
  if (raw.includes("auth") || raw.includes("credential") || raw.includes("api key") || raw.includes("signature")) return "auth";
  return null;
}

function vonageFailure(response: Response, body: Record<string, unknown> | null, fallback: string) {
  const key = errorKey(body);
  const detail = typeof body?.detail === "string" ? body.detail.trim() : "";

  switch (key) {
    case "auth":
      return new Error("Vonage rejected the credentials. Check VONAGE_API_KEY and VONAGE_API_SECRET in the Keys/API keys tab.");
    case "trial":
      return new Error("Your Vonage account is in trial mode. Add this number under Test numbers in the Vonage dashboard, or upgrade the account.");
    case "no-credit":
      return new Error("The Vonage account has no trial credit left. Add credit in the Vonage dashboard, then try again.");
    case "rate-limit":
      return new Error("Vonage is rate-limiting requests. Wait a minute and try again.");
    case "concurrent":
      return new Error("A code was already requested for that number. Wait for it to expire or finish that verification before requesting another.");
    case "bad-number":
      return new Error("Vonage could not send to that number. Use a mobile number in international format, for example +4512345678.");
    default:
      break;
  }

  if (response.status === 401 || response.status === 403) {
    return new Error("Vonage rejected the request. Check the API key and secret, and that Verify is enabled on the account.");
  }
  if (response.status === 429) {
    return new Error("Vonage is rate-limiting requests. Wait a minute and try again.");
  }
  return new Error(detail ? `${fallback} ${detail}` : `${fallback} Vonage returned HTTP ${response.status}.`);
}

/**
 * Sends a one-time SMS through Vonage Verify. Verify handles delivery,
 * expiration, and per-number rate limits; we only store the request ID.
 */
export const sendCode = internalAction({
  args: { phoneNumber: v.string() },
  handler: async (_ctx, { phoneNumber }) => {
    const config = getSmsConfig();
    const response = await fetch(VONAGE_VERIFY_API, {
      method: "POST",
      headers: {
        Authorization: authorization(config),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        brand: config.brand,
        workflow: [{ channel: "sms", to: phoneNumber.replace(/^\+/, "") }],
        code_length: 6,
        locale: "en-us",
      }),
    });
    const body = await readResponse(response);
    if (!response.ok) {
      throw vonageFailure(response, body, "The SMS provider could not send the verification code.");
    }
    const requestId = typeof body?.request_id === "string" ? body.request_id : "";
    if (!requestId) throw new Error("Vonage did not return a verification request ID.");
    return { requestId };
  },
});

/** Checks a code without storing the code or the Vonage response in our database. */
export const checkCode = internalAction({
  args: { requestId: v.string(), code: v.string() },
  handler: async (_ctx, { requestId, code }) => {
    const config = getSmsConfig();
    const response = await fetch(`${VONAGE_VERIFY_API}/${encodeURIComponent(requestId)}`, {
      method: "POST",
      headers: {
        Authorization: authorization(config),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ code }),
    });
    const body = await readResponse(response);
    if (!response.ok) {
      const key = errorKey(body);
      // A wrong or expired code is a normal failed attempt, not a provider outage.
      if (key === "invalid-code" || key === "expired" || response.status === 400 || response.status === 404 || response.status === 410) {
        return { approved: false as const };
      }
      throw vonageFailure(response, body, "The SMS provider could not verify that code.");
    }
    return { approved: body?.status === "completed" };
  },
});
