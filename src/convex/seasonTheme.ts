import { query } from "./_generated/server";

export type SeasonKey = "winter" | "spring" | "summer" | "autumn";

export type SeasonTheme = {
  key: SeasonKey;
  /** Short line shown in the site's seasonal bar. */
  greeting: string;
  /** Single decorative glyph for the bar; kept simple so it renders everywhere. */
  glyph: string;
  /** Accent used for links, codes and quote rules. */
  accent: string;
  /** Very light tint behind code blocks and quoted messages. */
  wash: string;
  barBackground: string;
  barInk: string;
};

/** The red/green/gold rule is the brand mark, so it stays out of the rotation. */
export const SEASON_THEMES: Record<SeasonKey, SeasonTheme> = {
  winter: {
    key: "winter",
    greeting: "Winter at OpenWorlds",
    glyph: "❄",
    accent: "#1c5d7a",
    wash: "#f4f8fa",
    barBackground: "#123f52",
    barInk: "#e8f1f5",
  },
  spring: {
    key: "spring",
    greeting: "Spring at OpenWorlds",
    glyph: "✿",
    accent: "#2c7a4b",
    wash: "#f5f9f4",
    barBackground: "#14583c",
    barInk: "#eaf3dc",
  },
  summer: {
    key: "summer",
    greeting: "Summer at OpenWorlds",
    glyph: "☀",
    accent: "#176b45",
    wash: "#f6f8f4",
    barBackground: "#0f4630",
    barInk: "#f4efd8",
  },
  autumn: {
    key: "autumn",
    greeting: "Autumn at OpenWorlds",
    glyph: "✦",
    accent: "#8a4a24",
    wash: "#faf5ee",
    barBackground: "#4a2b1a",
    barInk: "#f6e6cf",
  },
};

export function seasonForMonth(month: number): SeasonKey {
  if (month === 11 || month <= 1) return "winter";
  if (month <= 4) return "spring";
  if (month <= 7) return "summer";
  return "autumn";
}

/** Called by the site and by every outgoing email so both stay in step. */
export function currentSeasonTheme(now: Date = new Date()): SeasonTheme {
  return SEASON_THEMES[seasonForMonth(now.getUTCMonth())];
}

export const get = query({
  args: {},
  handler: () => currentSeasonTheme(),
});
