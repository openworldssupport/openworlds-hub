import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  careerPositionAliases,
  careerRoles,
  normalizeCareerPosition,
  type CareerRole,
} from "../lib/careers";

type Ctx = QueryCtx | MutationCtx;

type PositionSnapshot = {
  users: Doc<"users">[];
  overrides: Doc<"careerRoleAvailability">[];
};

/** The career listing that owns a free-text staff position, if there is one. */
export function careerRoleForPosition(position: string | null | undefined) {
  const normalized = normalizeCareerPosition(position ?? "");
  if (!normalized) return null;
  return careerRoles.find((role) => careerPositionAliases(role).includes(normalized)) ?? null;
}

/** Load the staff and availability data once for all role checks in a request. */
export async function loadPositionSnapshot(ctx: Ctx): Promise<PositionSnapshot> {
  const [users, overrides] = await Promise.all([
    ctx.db.query("users").take(5000),
    ctx.db.query("careerRoleAvailability").take(500),
  ]);
  return { users, overrides };
}

/** Active staff currently holding a position, optionally excluding one account. */
export function assignedStaffCount(
  snapshot: PositionSnapshot,
  role: CareerRole,
  excludeUserId?: Id<"users">,
) {
  const aliases = new Set(careerPositionAliases(role));
  return snapshot.users.filter((user) =>
    user._id !== excludeUserId &&
    user.emailVerificationTime !== undefined &&
    !user.isSiteBanned &&
    Boolean(user.position) &&
    aliases.has(normalizeCareerPosition(user.position!)),
  ).length;
}

/** Public application availability, based on active staff and the role limit. */
export function roleAvailabilityFromSnapshot(
  snapshot: PositionSnapshot,
  role: CareerRole,
  excludeUserId?: Id<"users">,
) {
  const override = snapshot.overrides.find((item) => item.roleSlug === role.slug);
  const assignedCount = assignedStaffCount(snapshot, role, excludeUserId);
  const full = assignedCount >= role.capacity;
  const manuallyClosed = override?.isOpen === false;
  return {
    slug: role.slug,
    title: role.title,
    department: role.department,
    isOpen: role.status !== "Filled" && !full && !manuallyClosed,
    assignedCount,
    capacity: role.capacity,
    full,
    manuallyClosed,
  };
}

/** Single-role availability for assignment checks. */
export async function roleAvailabilityState(
  ctx: Ctx,
  role: CareerRole,
  excludeUserId?: Id<"users">,
) {
  return roleAvailabilityFromSnapshot(await loadPositionSnapshot(ctx), role, excludeUserId);
}

/**
 * Blocks a staff assignment when the position has reached its limit. Custom
 * positions that are not part of the public careers list remain unrestricted.
 */
export async function assertPositionCapacity(
  ctx: Ctx,
  position: string,
  excludeUserId?: Id<"users">,
) {
  const role = careerRoleForPosition(position);
  if (!role) return null;
  const state = await roleAvailabilityState(ctx, role, excludeUserId);
  if (role.status === "Filled") {
    throw new Error(`${role.title} is marked as filled. Choose another position before assigning someone.`);
  }
  if (state.full) {
    throw new Error(
      `${role.title} is full (${state.assignedCount}/${state.capacity}). Choose another position or increase the position limit before assigning someone.`,
    );
  }
  return state;
}
