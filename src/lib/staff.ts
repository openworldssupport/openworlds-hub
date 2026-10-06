/** What the public website shows for a team member: "Staff" or "Dev". */
export type PublicBadge = "staff" | "dev";

import { careerRoles } from "./careers";

/**
 * Company departments suggested in the admin panel (invite + team assignment).
 * The first five match the department names used on the careers page. Any other
 * department name can still be typed by hand.
 */
export const DEPARTMENTS = [
  "Engineering",
  "Design & Creative",
  "Community & Communications",
  "Marketing & Partnerships",
  "Business Strategy",
  "Support",
  "Operations",
  "Leadership",
] as const;

/**
 * Positions suggested in the admin panel: every role the careers page lists,
 * kept in careers-page order. Any other position can still be typed by hand.
 */
export const POSITIONS: string[] = [...new Set(careerRoles.map((role) => role.title))];

/**
 * Departments/positions that read as engineering rather than general staff.
 * Used to derive the public badge when an admin has not picked one explicitly.
 */
const DEV_PATTERN =
  /(dev|develop|engineer|program|software|technical|technology|infra|security|data|frontend|backend|full[ -]?stack|devops|\bit\b|qa)/i;

/** Derives the public badge ("dev" | "staff") from a department/position. */
export function deriveBadge(
  department?: string | null,
  position?: string | null,
): PublicBadge {
  const text = `${department ?? ""} ${position ?? ""}`;
  return DEV_PATTERN.test(text) ? "dev" : "staff";
}

/** Human label for a badge. */
export function badgeLabel(badge: PublicBadge): string {
  return badge === "dev" ? "Dev" : "Staff";
}

type MaybeStaff = {
  department?: string | null;
  position?: string | null;
  role?: string | null;
};

/**
 * Staff = a site admin, or someone the admin panel has given a
 * department/position. Mirrors the Convex-side check in `src/convex/staff.ts`.
 */
export function isStaffUser(user: MaybeStaff | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return Boolean(user.department?.trim() || user.position?.trim());
}

/** The badge a user would show, honouring an explicit admin choice first. */
export function badgeForUser(
  user: MaybeStaff & { publicBadge?: PublicBadge | null } | null | undefined,
): PublicBadge | null {
  if (!user || !isStaffUser(user)) return null;
  return user.publicBadge ?? deriveBadge(user.department, user.position);
}
