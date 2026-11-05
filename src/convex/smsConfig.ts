export type SmsConfig = {
  apiKey: string;
  apiSecret: string;
  brand: string;
};

export type SmsConfigStatus = {
  configured: boolean;
  missing: string[];
};

const DEFAULT_BRAND = "OpenWorlds";

/**
 * Reports configuration without exposing secret values. Used by the settings
 * UI so a missing deployment key is obvious before an SMS is attempted.
 */
export function smsConfigStatus(): SmsConfigStatus {
  const apiKey = process.env.VONAGE_API_KEY?.trim();
  const apiSecret = process.env.VONAGE_API_SECRET?.trim();
  const missing: string[] = [];

  if (!apiKey) missing.push("VONAGE_API_KEY");
  if (!apiSecret) missing.push("VONAGE_API_SECRET");

  return { configured: missing.length === 0, missing };
}

export function getSmsConfig(): SmsConfig {
  const status = smsConfigStatus();
  if (!status.configured) {
    throw new Error(
      `Phone verification is not configured yet. Missing: ${status.missing.join(", ")}. Add these in the project's Keys/API keys tab.`,
    );
  }

  return {
    apiKey: process.env.VONAGE_API_KEY!.trim(),
    apiSecret: process.env.VONAGE_API_SECRET!.trim(),
    brand: (process.env.VONAGE_BRAND?.trim() || process.env.VLY_APP_NAME?.trim() || DEFAULT_BRAND).slice(0, 18),
  };
}
