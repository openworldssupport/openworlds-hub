import type { MutationCtx } from "./_generated/server";

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function decodeBase32(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of secret.replace(/=+$/, "").toUpperCase()) {
    const value = alphabet.indexOf(char);
    if (value < 0) throw new Error("Invalid authenticator secret.");
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  return bytes;
}

export async function hashValue(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function matchingTotpCounter(secret: string, code: string, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return null;
  const key = await crypto.subtle.importKey("raw", decodeBase32(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const current = Math.floor(now / 30_000);
  for (const counter of [current - 1, current, current + 1]) {
    const message = new Uint8Array(8);
    let value = BigInt(counter);
    for (let i = 7; i >= 0; i--) { message[i] = Number(value & 255n); value >>= 8n; }
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, message));
    const offset = signature[signature.length - 1]! & 15;
    const binary = ((signature[offset]! & 127) << 24) | ((signature[offset + 1]! & 255) << 16) | ((signature[offset + 2]! & 255) << 8) | (signature[offset + 3]! & 255);
    if (String(binary % 1_000_000).padStart(6, "0") === code) return counter;
  }
  return null;
}

/**
 * Consumes one authenticator code or saved recovery code for a user, with
 * replay protection and a shared attempt throttle.
 */
export async function consumeSecondFactor(ctx: MutationCtx, user: any, code: string) {
  const now = Date.now();
  const windowAt = user.twoFactorAttemptWindowAt ?? 0;
  const count = windowAt > now - ATTEMPT_WINDOW_MS ? user.twoFactorAttemptCount ?? 0 : 0;
  if (count >= MAX_ATTEMPTS) return { ok: false as const, message: "Too many incorrect codes. Wait 10 minutes and try again." };
  const normalized = code.trim().toUpperCase();
  const counter = user.twoFactorSecret ? await matchingTotpCounter(user.twoFactorSecret, normalized, now) : null;
  if (counter !== null && counter > (user.twoFactorLastCounter ?? -1)) {
    await ctx.db.patch(user._id, { twoFactorLastCounter: counter, twoFactorAttemptCount: 0, twoFactorAttemptWindowAt: undefined });
    return { ok: true as const, usedRecoveryCode: false as const };
  }
  const recoveryHashes: string[] = user.twoFactorRecoveryCodeHashes ?? [];
  const recoveryHash = await hashValue(normalized);
  const recoveryIndex = recoveryHashes.indexOf(recoveryHash);
  if (recoveryIndex >= 0) {
    await ctx.db.patch(user._id, { twoFactorRecoveryCodeHashes: recoveryHashes.filter((_, index) => index !== recoveryIndex), twoFactorAttemptCount: 0, twoFactorAttemptWindowAt: undefined });
    return { ok: true as const, usedRecoveryCode: true as const };
  }
  await ctx.db.patch(user._id, { twoFactorAttemptWindowAt: count === 0 ? now : windowAt, twoFactorAttemptCount: count + 1 });
  return { ok: false as const, message: count + 1 >= MAX_ATTEMPTS ? "Too many incorrect codes. Wait 10 minutes and try again." : "That verification code is incorrect." };
}
