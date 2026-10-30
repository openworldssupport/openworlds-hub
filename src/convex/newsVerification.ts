"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const SUPPORT_BOT_FROM = "OpenWorlds Support Bot <support@openworlds.dk>";

export const sendCode = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    await ctx.runQuery(internal.siteStatus.requireAuthAccess, { userId });
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const code = String(bytes[0]! % 1_000_000).padStart(6, "0");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
    const codeHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const recipient = await ctx.runMutation(internal.security.createNewsPostingCode, { userId, codeHash });
    try {
      await ctx.runAction(internal.newsVerification.deliverCode, { email: recipient.email, code });
    } catch (error) {
      await ctx.runMutation(internal.security.clearNewsCode, { userId });
      throw error;
    }
    return { ok: true };
  },
});

export const deliverCode = internalAction({
  args: { email: v.string(), code: v.string() },
  handler: async (_ctx, { email, code }) => {
    const recipient = "support@openworlds.dk";
    const text = `Your OpenWorlds news-posting code is ${code}. It expires in 10 minutes. Do not share it.\n\nIf you did not request this code, you can ignore this email.`;
    const html = `<p>Your OpenWorlds news-posting code is <strong>${code}</strong>. It expires in 10 minutes. Do not share it.</p><p>If you did not request this code, you can ignore this email.</p>`;
    const vlyKey = process.env.VLY_INTEGRATION_KEY;
    if (vlyKey) {
      const response = await fetch("https://integrations.vly.ai/v1/email/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${vlyKey}`, "Content-Type": "application/json", "X-Vly-Version": "0.1.0" },
        body: JSON.stringify({ to: [recipient], from: SUPPORT_BOT_FROM, subject: "OpenWorlds news verification code", text, html, replyTo: email }),
      });
      if (!response.ok) throw new Error("Could not send the verification code.");
      return { sent: true };
    }
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: SUPPORT_BOT_FROM, to: [recipient], reply_to: email, subject: "OpenWorlds news verification code", text, html }),
      });
      if (!response.ok) throw new Error("Could not send the verification code.");
      return { sent: true };
    }
    throw new Error("Email delivery is not configured.");
  },
});

