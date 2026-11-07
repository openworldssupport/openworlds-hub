import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { EMAIL_LOGO_PNG_BASE64 } from "./emailLogo";

const http = httpRouter();

auth.addHttpRoutes(http);

/** Keep the download button on the site's own domain. The launcher binary is
 *  stored as a release asset, so this route redirects to the file itself
 *  rather than sending visitors to the release page. */
const WINDOWS_LAUNCHER_URL =
  "https://github.com/openworldssupport/openworlds-hub/releases/download/v2026.11.06.2038/OpenWorldsLauncher.exe";

http.route({
  path: "/downloads/windows",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 302,
      headers: {
        location: WINDOWS_LAUNCHER_URL,
        "cache-control": "public, max-age=300",
      },
    });
  }),
});

/** Email clients need a public PNG, and this stays available before the
 *  marketing site deploy. The filename is versioned to avoid stale caches. */
http.route({
  path: "/logo-email-person.png",
  method: "GET",
  handler: httpAction(async () => {
    const binary = atob(EMAIL_LOGO_PNG_BASE64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Response(bytes, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=31536000, immutable",
        "access-control-allow-origin": "*",
      },
    });
  }),
});

async function secretMatches(provided: string, expected: string): Promise<boolean> {
  if (!provided || !expected) return false;
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(source: Record<string, unknown> | null, keys: string[]): string | null {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function addressOf(value: unknown): string | null {
  if (typeof value === "string") {
    const match = value.match(/[^\s<>",;]+@[^\s<>",;]+/);
    return match ? match[0].toLowerCase() : null;
  }
  const record = asRecord(value);
  const nested = pickString(record, ["email", "address", "value"]);
  return nested ? addressOf(nested) : null;
}

function addressesOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(addressesOf);
  const single = addressOf(value);
  return single ? [single] : [];
}

function timestampOf(source: Record<string, unknown> | null): number | null {
  const raw = pickString(source, ["timestamp", "createdAt", "date", "sentAt"]);
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Any address that belongs to OpenWorlds rather than a player. */
function isOurAddress(email: string): boolean {
  const support = (process.env.SUPPORT_EMAIL ?? "contact@openworlds.dk").toLowerCase();
  if (email === support) return true;
  const local = email.split("@")[0] ?? "";
  return ["support", "contact", "careers", "hello", "admin", "noreply", "no-reply"].includes(local);
}

const TICKET_REFERENCE = /(?:^|[^0-9A-Z])([0-9A-F]{16})(?![0-9A-Z])/;

/**
 * Support inbox hook. Point the AgentMail webhook (or any provider that can
 * post events) at POST /support/reply with the `x-openworlds-secret` header.
 *
 * - `message.sent` events identify the ticket by the recipient address, which
 *   is how a reply written in the support inbox is recognised.
 * - Anything carrying a ticket reference is matched by that reference, which
 *   covers forwarded or relayed replies.
 *
 * The ticket then shows "responded" for the player without anyone clicking a
 * status button.
 */
http.route({
  path: "/support/reply",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.SUPPORT_WEBHOOK_SECRET;
    if (!secret) {
      return json({ error: "Webhook not configured. Set SUPPORT_WEBHOOK_SECRET." }, 503);
    }

    const provided =
      request.headers.get("x-openworlds-secret") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
      "";
    if (!(await secretMatches(provided, secret))) return json({ error: "Unauthorized." }, 401);

    const payload = await request.json().catch(() => null);
    const body = asRecord(payload);
    if (!body) return json({ error: "Expected a JSON body." }, 400);

    const kind = (pickString(body, ["eventType", "type", "event"]) ?? "").toLowerCase();
    const message = asRecord(body.message) ?? asRecord(body.send) ?? body;
    const subject = pickString(message, ["subject"]) ?? "";
    const text = pickString(message, ["text", "extractedText", "preview", "body", "html"]) ?? "";
    const at = timestampOf(message) ?? Date.now();

    const reference =
      pickString(body, ["reference"]) ??
      `${subject}\n${text}`.toUpperCase().match(TICKET_REFERENCE)?.[1];

    if (kind.includes("sent")) {
      const recipients = [
        ...addressesOf(message.to),
        ...addressesOf(message.recipients),
        ...addressesOf(message.cc),
      ];
      for (const email of recipients) {
        if (isOurAddress(email)) continue;
        const result = await ctx.runMutation(internal.supportTickets.recordTeamReply, {
          matchBy: "email",
          email,
          at,
        });
        if (result.updated) {
          return json({ ok: true, matched: "recipient", reference: result.reference }, 200);
        }
      }
    }

    if (reference) {
      const result = await ctx.runMutation(internal.supportTickets.recordTeamReply, {
        matchBy: "reference",
        reference,
        at,
      });
      if (result.updated) {
        return json({ ok: true, matched: "reference", reference: result.reference }, 200);
      }
    }

    // Nothing to change: acknowledge so the provider stops retrying.
    return json({ ok: true, matched: null }, 202);
  }),
});

/**
 * Edge/firewall export of active IP/CIDR blocks.
 *
 * The Convex runtime does not expose a website visitor's IP to mutations, so
 * IP bans are enforced by the hosting edge or game server. Configure
 * NETWORK_BLOCKLIST_SECRET and poll this endpoint with the same value in
 * `x-openworlds-secret`; it returns only active network blocks.
 */
http.route({
  path: "/moderation/network-bans",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.NETWORK_BLOCKLIST_SECRET;
    if (!secret) return json({ error: "Network blocklist export is not configured. Set NETWORK_BLOCKLIST_SECRET." }, 503);
    const provided = request.headers.get("x-openworlds-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (!(await secretMatches(provided, secret))) return json({ error: "Unauthorized." }, 401);
    const blocks = await ctx.runQuery(internal.moderation.activeNetworkBlocks, {});
    return json({ generatedAt: Date.now(), blocks }, 200);
  }),
});

export default http;
