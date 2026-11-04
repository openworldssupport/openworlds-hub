/** What the public website shows for a team member: "Staff" or "Dev". */
export type PublicBadge = "staff" | "dev";

import {
  CEO_ROLE,
  careerBranches,
  careerPositionAliases,
  normalizeCareerPosition,
  staffRoles,
} from "./careers";

/**
 * Department names that mean the same team should share one roster, role
 * defaults, and permission key. Legacy assignments used "Leadership" before
 * the careers page standardized on "Executive Leadership".
 */
const DEPARTMENT_ALIASES: Record<string, string> = {
  leadership: "Executive Leadership",
};

/** The position title that designates a department's head. */
export const DEPARTMENT_HEAD_TITLE = "Head of Department";

/** True when a position is the designated head of a department. */
export function isDepartmentHeadPosition(position?: string | null): boolean {
  return /^(head of department|department head)\b/i.test(position?.trim() ?? "");
}

/**
 * The CEO is a hidden, owner-appointed position. These aliases must resolve to
 * the same single seat so capacity and authority cannot be bypassed by typing
 * a different spelling.
 */
export function isChiefExecutivePosition(position?: string | null): boolean {
  const normalized = normalizeCareerPosition(position ?? "");
  return Boolean(normalized) && careerPositionAliases(CEO_ROLE).includes(normalized);
}

/** Normalize a department name without changing its public spelling. */
export function canonicalDepartmentName(value?: string | null): string {
  const department = (value ?? "").trim().replace(/\s+/g, " ");
  if (!department) return "";
  return DEPARTMENT_ALIASES[department.toLowerCase()] ?? department;
}

/**
 * Company departments suggested in the admin panel (invite + team assignment).
 * Derived from the careers page so every department stays listed and assignable
 * before and after release, including departments with no current openings.
 * Any other department name can still be typed by hand.
 */
export const DEPARTMENTS: string[] = [
  ...new Set([
    ...careerBranches.map((branch) => canonicalDepartmentName(branch.title)),
    "Trust & Safety / Moderation",
  ]),
];

/**
 * Positions suggested in the admin panel: every role the careers page lists,
 * kept in careers-page order. Any other position can still be typed by hand.
 */
export const POSITIONS: string[] = [
  DEPARTMENT_HEAD_TITLE,
  ...new Set(staffRoles.map((role) => role.title)),
];

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

/** Return true for an email-shaped value that should never be used as a display name. */
export function isEmailAddress(value?: string | null): boolean {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Preferred public display name for a staff member: nickname first, then the
 * stored name, then a fallback. Emails are never used as display names.
 */
export function displayNameFor(
  user: {
    nickname?: string | null;
    name?: string | null;
  } | null | undefined,
): string {
  const displayName = [user?.nickname, user?.name].find(
    (candidate) => typeof candidate === "string" && candidate.trim() && !isEmailAddress(candidate),
  );
  return displayName?.trim() || "OpenWorlds team";
}

/** Initials for a display name (nickname or name), for avatar circles. */
export function displayInitials(user: {
  nickname?: string | null;
  name?: string | null;
} | null | undefined): string {
  const label = displayNameFor(user);
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("") || "?";
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
