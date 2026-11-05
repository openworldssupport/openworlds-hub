export type TwilioConfig = {
  username: string;
  password: string;
  verifyServiceSid: string;
};

export type TwilioConfigStatus = {
  configured: boolean;
  missing: string[];
};

/**
 * Reports configuration without exposing secret values. Used by the settings
 * UI so a missing deployment key is obvious before an SMS is attempted.
 */
export function twilioConfigStatus(): TwilioConfigStatus {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const apiKey = process.env.TWILIO_API_KEY?.trim();
  const apiSecret = process.env.TWILIO_API_SECRET?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
  const missing: string[] = [];

  if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
  if (!verifyServiceSid) missing.push("TWILIO_VERIFY_SERVICE_SID");
  else if (!verifyServiceSid.startsWith("VA")) {
    missing.push("TWILIO_VERIFY_SERVICE_SID must start with VA");
  }
  if (!authToken && !(apiKey && apiSecret)) {
    missing.push("TWILIO_AUTH_TOKEN (or TWILIO_API_KEY + TWILIO_API_SECRET)");
  }

  return { configured: missing.length === 0, missing };
}

export function getTwilioConfig(): TwilioConfig {
  const status = twilioConfigStatus();
  if (!status.configured) {
    throw new Error(
      `Phone verification is not configured yet. Missing: ${status.missing.join(", ")}. Add these in the project's Keys/API keys tab.`,
    );
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const apiKey = process.env.TWILIO_API_KEY?.trim();
  const apiSecret = process.env.TWILIO_API_SECRET?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!.trim();

  if (apiKey && apiSecret) {
    return { username: apiKey, password: apiSecret, verifyServiceSid };
  }
  return { username: accountSid, password: authToken!, verifyServiceSid };
}
