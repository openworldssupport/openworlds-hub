/**
 * Public-content language filter.
 *
 * This is deliberately shared by the browser and Convex so the same rule runs
 * while a person types and again on the server. The server check is the one
 * that matters: client-side validation is only there to give a faster message.
 *
 * The filter normalizes common substitutions (leetspeak, accents, separators)
 * before matching whole words. Short words are matched as whole tokens only, so
 * "class" does not become "ass" and "Scunthorpe" does not become a slur.
 */

const PUBLIC_BLOCKED = [
  /\barse(?:hole|holes)?\b/,
  /\bass\b/,
  /\basshole(?:s)?\b/,
  /\bbastard(?:s)?\b/,
  /\bbitch(?:es|y|ing)?\b/,
  /\bbollocks\b/,
  /\bbullshit\b/,
  /\bcock(?:sucker|suckers|s)?\b/,
  /\bcum(?:ming|s)?\b/,
  /\bcunt(?:s)?\b/,
  /\bdick(?:head|heads)?\b/,
  /\bfuck(?:ed|er|ers|ing|in|s)?\b/,
  /\bmotherfuck(?:er|ers|ing)?\b/,
  /\bpiss(?:ed|ing)?\b/,
  /\bporn\b/,
  /\bprick(?:s)?\b/,
  /\bpussy\b/,
  /\bshit(?:ty|s|ting|head|heads)?\b/,
  /\bslut(?:s|ty)?\b/,
  /\btits?\b/,
  /\btwat(?:s)?\b/,
  /\bwhore(?:s|dom)?\b/,
  /\bdamn(?:ed|it)?\b/,
  /\bhell\b/,
  /\bcrap(?:py|s)?\b/,
  // Slurs and explicit hate terms are always blocked in public content.
  /\bnigg(?:er|ers|a|as)\b/,
  /\bfaggot(?:s)?\b/,
  /\bretard(?:ed|s)?\b/,
  /\btranny(?:s)?\b/,
  /\bchink(?:s)?\b/,
  /\bspic(?:s)?\b/,
  /\bkike(?:s)?\b/,
  /\bwetback(?:s)?\b/,
  /\braghead(?:s)?\b/,
  /\bcoon(?:s)?\b/,
  /\bnazi(?:s)?\b/,
];

/**
 * Longer stems are also blocked when they are embedded in a username or a
 * single long word (`fuckface`, `shithead42`). Tokens in the allow list keep
 * ordinary words such as "shitake" and "Scunthorpe" usable.
 */
const EMBEDDED_STEMS = [
  "asshole",
  "bastard",
  "bitch",
  "bullshit",
  "cunt",
  "dickhead",
  "faggot",
  "fuck",
  "motherfuck",
  "nigga",
  "nigger",
  "retard",
  "shit",
  "slut",
  "tranny",
  "whore",
];

const EMBEDDED_ALLOW = new Set([
  "assassin",
  "cassette",
  "classic",
  "cocktail",
  "dickens",
  "peacock",
  "retardant",
  "scunthorpe",
  "shitake",
]);

const HOMOGLYPHS: Record<string, string> = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x",
  "і": "i", "ј": "j", "ѕ": "s", "ԁ": "d", "ɡ": "g", "ӏ": "l",
};

export const BLOCKED_LANGUAGE_MESSAGE =
  "That text contains language that is not allowed in public OpenWorlds spaces. Please rewrite it without profanity or slurs.";

/** Normalize text before matching so simple substitutions cannot bypass it. */
export function normalizePublicText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[аеорсухіјѕԁɡӏ]/g, (character) => HOMOGLYPHS[character] ?? character)
    .toLowerCase()
    .replace(/f[\*4]ck/g, "fuck")
    .replace(/sh[\*1]t/g, "shit")
    .replace(/b[\*1]tch/g, "bitch")
    .replace(/c[\*u]nt/g, "cunt")
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/9/g, "g")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasBlockedToken(token: string): boolean {
  if (!token || EMBEDDED_ALLOW.has(token)) return false;
  return EMBEDDED_STEMS.some((stem) => token.includes(stem));
}

/** Catches "f u c k" and other letter-by-letter attempts. */
function hasBlockedSpacedRun(tokens: string[]): boolean {
  let run = "";
  for (const token of tokens) {
    if (token.length === 1) {
      run += token;
      if (EMBEDDED_STEMS.some((stem) => run.includes(stem))) return true;
    } else {
      run = "";
    }
  }
  return false;
}

/** True when public text contains a blocked word, slur, or an evasive variant. */
export function containsBlockedLanguage(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  const normalized = normalizePublicText(value);
  if (!normalized) return false;
  if (PUBLIC_BLOCKED.some((pattern) => pattern.test(normalized))) return true;
  const tokens = normalized.split(/\s+/);
  return tokens.some(hasBlockedToken) || hasBlockedSpacedRun(tokens);
}

/** Trim and validate text that will be shown to other people. */
export function assertCleanPublicText(value: string, fieldLabel = "This text"): string {
  const clean = value.trim();
  if (containsBlockedLanguage(clean)) {
    throw new Error(`${fieldLabel} contains language that is not allowed in public OpenWorlds spaces. Please rewrite it without profanity or slurs.`);
  }
  return clean;
}
