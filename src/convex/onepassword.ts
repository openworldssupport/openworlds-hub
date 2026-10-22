"use node";

import sdk from "@1password/sdk";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Resolve a 1Password secret reference for use by trusted Convex functions.
 * This is intentionally internal: service-account credentials and resolved
 * secrets must never be returned directly to browser clients.
 */
export const resolveSecret = internalAction({
  args: { secretReference: v.string() },
  handler: async (_ctx, { secretReference }) => {
    const token = process.env.OP_SERVICE_ACCOUNT_TOKEN;
    if (!token) {
      throw new Error("OP_SERVICE_ACCOUNT_TOKEN is not configured on this Convex deployment.");
    }

    const reference = secretReference.trim();
    try {
      sdk.Secrets.validateSecretReference(reference);
    } catch {
      throw new Error("Invalid 1Password secret reference. Expected an op:// reference.");
    }

    try {
      const client = await sdk.createClient({
        auth: token,
        integrationName: "OpenWorlds Convex",
        integrationVersion: "1.0.0",
      });
      return await client.secrets.resolve(reference);
    } catch {
      // Do not forward SDK exceptions; they may contain request details.
      throw new Error("Could not resolve the 1Password secret. Check the token and vault access.");
    }
  },
});
