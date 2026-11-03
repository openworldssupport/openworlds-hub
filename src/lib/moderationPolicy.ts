export type ModerationSeverity = "low" | "medium" | "high" | "critical";

/**
 * Reports are scored by category, but a category alone never authorises an
 * automatic restriction. Every automatic decision also requires independent
 * corroboration and evidence links.
 */
export const REPORT_CATEGORY_SEVERITY: Record<string, ModerationSeverity> = {
  harassment: "medium",
  "hate-speech": "high",
  scam: "high",
  cheating: "high",
  "inappropriate-content": "high",
  "profile-picture": "high",
  "display-name": "medium",
  "terms-violation": "medium",
  other: "low",
};

export function severityForCategory(category: string): ModerationSeverity {
  return REPORT_CATEGORY_SEVERITY[category] ?? "low";
}

export function severityRank(severity: ModerationSeverity) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity];
}
