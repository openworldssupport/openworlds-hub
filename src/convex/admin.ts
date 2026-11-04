import { getAuthUserId } from "@convex-dev/auth/server";
import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requirePermissionVerification, requireRosterVerification } from "./adminRoster";
import { accountLabel, recordAudit } from "./bans";
import { canonicalDepartmentName, isChiefExecutivePosition, isEmailAddress } from "../lib/staff";
import { hashValue } from "./secondFactor";
import { assertPositionCapacity } from "./staffPositions";

/** The careers inbox for direct, email-only enquiries. */
export const CAREERS_EMAIL = "careers@openworlds.dk";

/** The verified support address that is allowed to administer the site. */
export const SUPPORT_EMAIL = "contact@openworlds.dk";

const STAFF_CONVERSION_TTL_MS = 24 * 60 * 60 * 1000;
const STAFF_CONVERSION_MAX_ATTEMPTS = 10;

function makeStaffConversionCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function normalizeStaffConversionCode(code: string) {
  return code.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

async function hashStaffConversionCode(userId: Id<"users">, code: string) {
  return await hashValue(`${userId}:${normalizeStaffConversionCode(code)}`);
}

/** The bootstrap owner account is the only account allowed to mint administrators. */
export function isOwnerAdmin(user: { email?: string | null } | null | undefined): boolean {
  return user?.email?.trim().toLowerCase() === SUPPORT_EMAIL;
}

/** Verified company administrator (the support mailbox is the bootstrap admin). */
export async function isAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  return await isCompanyAdmin(ctx);
}

/** Throws unless caller is a verified company administrator. */
export async function requireAdmin(ctx: MutationCtx): Promise<void> {
  if (!(await isCompanyAdmin(ctx))) throw new Error("Not authorized.");
}

/** Only admin-role accounts can manage company invitations and roles. */
export async function requireCompanyAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const bootstrapAdmin = user?.email?.trim().toLowerCase() === SUPPORT_EMAIL;
  if (!user || user.emailVerificationTime === undefined || user.isSiteBanned || (user.role !== "admin" && !bootstrapAdmin)) {
    throw new Error("Not authorized.");
  }
}

/**
 * The single guard for changing an account's role, department, position, or
 * moderation capability grants. Requires a verified, unbanned administrator
 * and a live authenticator unlock for this browser session.
 */
export async function requireRoleAdministrator(ctx: MutationCtx): Promise<Doc<"users">> {
  await requireCompanyAdmin(ctx);
  await requirePermissionVerification(ctx);
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  if (!user) throw new Error("Not authorized.");
  return user;
}

/**
 * Role changes that create or alter an administrator are reserved for the
 * bootstrap owner. Regular administrators can still manage non-admin staff,
 * which prevents a single admin from minting allies with full site access.
 */
export async function requireOwnerAdministrator(ctx: MutationCtx): Promise<Doc<"users">> {
  const user = await requireRoleAdministrator(ctx);
  if (!isOwnerAdmin(user)) {
    throw new Error("Only the owner administrator can grant or change administrator access.");
  }
  return user;
}

async function isCompanyAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  const bootstrapAdmin = user?.email?.trim().toLowerCase() === SUPPORT_EMAIL;
  return Boolean(user && user.emailVerificationTime !== undefined && !user.isSiteBanned && (user.role === "admin" || bootstrapAdmin));
}

/**
 * Allowlisted check used by the OTP delivery action. It returns no account
 * details; only the bootstrap admin, an invited address, or assigned staff passes.
 */
export const isCompanyEmailAllowed = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();
    if (normalized === SUPPORT_EMAIL) return true;
    const invitation = await ctx.db
      .query("companyAccess")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    if (invitation) return true;
    const assignedStaff = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalized))
      .first();
    return Boolean(assignedStaff?.role === "admin" || (assignedStaff?.emailVerificationTime !== undefined && (assignedStaff.staffAccess || assignedStaff.department?.trim() || assignedStaff.position?.trim())));
  },
});

/** Admin-only company account roster. */
export const listCompanyAccess = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isCompanyAdmin(ctx))) return null;
    await requireRosterVerification(ctx);
    const accounts = await ctx.db.query("companyAccess").withIndex("by_email").take(1000);
    return await Promise.all(accounts.map(async ({ _id, email, department, position, publicBadge, accessLevel, memberStatus }) => {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .first();
      const isActive = Boolean(
        user &&
        user.emailVerificationTime !== undefined &&
        !user.isSiteBanned &&
        (user.role === "admin" || user.role === "member" || user.staffAccess || user.department?.trim() || user.position?.trim()),
      );
      return {
        _id,
        department: canonicalDepartmentName(department) || null,
        position,
        publicBadge,
        accessLevel,
        memberStatus: memberStatus ?? null,
        email,
        username: user?.playerLogin ?? null,
        isActive,
      };
    }));
  },
});

/** Invite or update a company email. This is not exposed as public sign-up. */
export const inviteCompanyAccount = mutation({
  args: {
    email: v.string(),
    department: v.string(),
    position: v.string(),
    publicBadge: v.union(v.literal("staff"), v.literal("dev")),
    accessLevel: v.union(v.literal("staff"), v.literal("admin")),
    memberStatus: v.optional(v.union(v.literal("none"), v.literal("volunteer-thank-you"))),
  },
  handler: async (ctx, args) => {
    const actor = await requireRoleAdministrator(ctx);
    const email = args.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid company email address.");
    }
    if (email === SUPPORT_EMAIL) {
      throw new Error("The bootstrap admin is managed separately and cannot be changed here.");
    }
    const existingUser = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email)).first();
    if (existingUser?.isSiteBanned) throw new Error("This account is restricted. Review the restriction before changing company access.");
    // The CEO is a single hidden appointment with full operational authority,
    // so it always carries admin access and only the owner can grant it.
    const accessLevel = isChiefExecutivePosition(args.position) ? "admin" : args.accessLevel;
    if ((existingUser?.role === "admin" || accessLevel === "admin") && !isOwnerAdmin(actor)) {
      throw new Error("Only the owner administrator can grant or change administrator access.");
    }
    if (existingUser?.role === "admin" && accessLevel !== "admin") throw new Error("Existing admin accounts must be changed from the account directory.");
    const department = canonicalDepartmentName(args.department);
    const position = args.position.trim();
    if (!department || department.length > 80) throw new Error("Department must be 1–80 characters.");
    if (!position || position.length > 100) throw new Error("Position must be 1–100 characters.");
    await assertPositionCapacity(ctx, position, existingUser?._id);

    const existing = await ctx.db
      .query("companyAccess")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing?.accessLevel === "admin" && !isOwnerAdmin(actor)) {
      throw new Error("Only the owner administrator can change an administrator invitation.");
    }
    const values: {
      email: string;
      department: string;
      position: string;
      publicBadge: "staff" | "dev";
      accessLevel: "staff" | "admin";
      memberStatus?: "volunteer-thank-you";
      invitedAt: number;
      invitedBy: NonNullable<Awaited<ReturnType<typeof getAuthUserId>>>;
    } = {
      email,
      department,
      position,
      publicBadge: args.publicBadge,
      accessLevel,
      ...(args.memberStatus === "volunteer-thank-you" ? { memberStatus: "volunteer-thank-you" as const } : {}),
      invitedAt: Date.now(),
      invitedBy: actor._id,
    };
    if (existing) await ctx.db.replace(existing._id, values);
    else await ctx.db.insert("companyAccess", values);

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (user && user.emailVerificationTime !== undefined) {
      await ctx.db.patch(user._id, {
        department,
        position,
        publicBadge: args.publicBadge,
        role: accessLevel === "admin" ? "admin" : "member",
        staffAccess: true,
        memberStatus: args.memberStatus === "volunteer-thank-you" ? "volunteer-thank-you" : undefined,
        securityViolationCount: 0,
        emailVerificationTime: Date.now(),
      });
    }
    if (actor) {
      await recordAudit(ctx, {
        actorId: actor._id,
        actorLabel: accountLabel(actor),
        action: "permissions-updated",
        targetId: user?._id,
        targetLabel: user ? accountLabel(user) : "Company account invitation",
        reason: `Company invitation set to ${accessLevel} · ${department} / ${position}.`,
      });
    }
    return { ok: true };
  },
});

/** Admin-only: revoke a company invitation and remove any matching user role. */
export const revokeCompanyAccount = mutation({
  args: { accountId: v.id("companyAccess") },
  handler: async (ctx, { accountId }) => {
    const actor = await requireRoleAdministrator(ctx);
    const invitation = await ctx.db.get(accountId);
    if (!invitation) return { ok: true };
    if (invitation.accessLevel === "admin" && !isOwnerAdmin(actor)) {
      throw new Error("Only the owner administrator can revoke an administrator invitation.");
    }
    const normalized = invitation.email.trim().toLowerCase();
    if (normalized === SUPPORT_EMAIL) throw new Error("The bootstrap admin cannot be revoked here.");
    const existingUser = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", normalized)).first();
    if (existingUser?.role === "admin") throw new Error("Admin accounts cannot be revoked through staff invitations.");
    await ctx.db.delete(accountId);
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalized))
      .first();
    if (user) {
      await ctx.db.patch(user._id, {
        emailVerificationTime: undefined,
        role: "user",
        department: undefined,
        position: undefined,
        publicBadge: undefined,
        staffAccess: undefined,
        memberStatus: undefined,
      });
    }
    if (actor) {
      await recordAudit(ctx, {
        actorId: actor._id,
        actorLabel: accountLabel(actor),
        action: "permissions-updated",
        targetId: user?._id,
        targetLabel: user ? accountLabel(user) : "Company account invitation",
        reason: "Company access revoked by an administrator.",
      });
    }
    return { ok: true };
  },
});

/** Admin-only lookup for a normal player account that should become staff. */
export const searchPlayerAccountsForCompany = query({
  args: { search: v.string() },
  handler: async (ctx, { search }) => {
    await requireRosterVerification(ctx);
    const term = search.trim().slice(0, 80);
    if (term.length < 2) return [];
    const normalizedTerm = term.toLowerCase();
    const usernameTerm = normalizedTerm.replace(/^@/, "");
    const [byUsername, byName, byEmail] = await Promise.all([
      ctx.db.query("users")
        .withSearchIndex("search_players_by_username", (q) => q.search("playerLogin", usernameTerm).eq("role", "user"))
        .take(25),
      ctx.db.query("users")
        .withSearchIndex("search_players_by_name", (q) => q.search("name", term).eq("role", "user"))
        .take(25),
      normalizedTerm.includes("@")
        ? ctx.db.query("users").withIndex("email", (q) => q.eq("email", normalizedTerm)).first()
        : Promise.resolve(null),
    ]);
    const unique = new Map(
      [...byUsername, ...byName, ...(byEmail ? [byEmail] : [])]
        .filter((user) => user.role === "user" && !user.isAnonymous && !user.isSiteBanned)
        .map((user) => [user._id, user]),
    );
    return [...unique.values()]
      .map((user) => {
        const username = user.playerLogin?.trim() ?? null;
        const displayName = isEmailAddress(user.name) ? null : user.name?.trim() || null;
        const accountEmail = user.email?.trim().toLowerCase() ?? "";
        const realAccountEmail = accountEmail && !accountEmail.endsWith("@players.openworlds.invalid") ? accountEmail : null;
        const verifiedRecoveryEmail = user.recoveryEmailVerifiedAt !== undefined ? user.recoveryEmail?.trim().toLowerCase() ?? null : null;
        const exact = username?.toLowerCase() === usernameTerm || displayName?.toLowerCase() === normalizedTerm;
        return {
          userId: user._id,
          username,
          displayName,
          suggestedEmail: verifiedRecoveryEmail ?? realAccountEmail,
          exact,
        };
      })
      .sort((a, b) => Number(b.exact) - Number(a.exact) || (a.username ?? a.displayName ?? "").localeCompare(b.username ?? b.displayName ?? ""))
      .slice(0, 20)
      .map(({ exact: _exact, ...player }) => player);
  },
});

/**
 * Request an in-place player-to-staff conversion. Nothing changes on the
 * account until the signed-in player confirms the one-time code shown to the
 * administrator. The user id never changes, so profile fields, friendships,
 * messages, and saved game data stay attached after confirmation.
 */
export const convertPlayerToCompany = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    department: v.string(),
    position: v.string(),
    publicBadge: v.union(v.literal("staff"), v.literal("dev")),
    accessLevel: v.optional(v.union(v.literal("staff"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    const actor = await requireRoleAdministrator(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("Account not found.");
    if (target.role !== "user") throw new Error("This account is already a staff account. Manage it from the staff directory.");
    if (target.isSiteBanned) throw new Error("This account is restricted and cannot be converted.");

    const email = args.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid company email address.");
    if (email.endsWith("@players.openworlds.invalid")) throw new Error("Enter the person's real company email, not their player login address.");
    if (email === SUPPORT_EMAIL) throw new Error("The bootstrap admin is managed separately and cannot be assigned here.");

    const emailOwner = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email)).first();
    if (emailOwner && emailOwner._id !== target._id) throw new Error("That email is already used by another account.");

    const department = canonicalDepartmentName(args.department);
    const position = args.position.trim();
    if (!department || department.length > 80) throw new Error("Department must be 1-80 characters.");
    if (!position || position.length > 100) throw new Error("Position must be 1-100 characters.");
    await assertPositionCapacity(ctx, position, target._id);
    const accessLevel = isChiefExecutivePosition(position) ? "admin" : args.accessLevel ?? "staff";
    if (accessLevel === "admin" && !isOwnerAdmin(actor)) {
      throw new Error("Only the owner administrator can grant administrator access.");
    }

    const existingInvitation = await ctx.db
      .query("companyAccess")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existingInvitation) throw new Error("That email already has a staff invitation. Revoke it before converting this player.");

    const pendingForEmail = await ctx.db
      .query("staffConversions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (pendingForEmail && pendingForEmail.userId !== target._id) {
      throw new Error("That email is already reserved by another pending staff conversion.");
    }

    const confirmationCode = makeStaffConversionCode();
    const now = Date.now();
    const values = {
      userId: target._id,
      email,
      department,
      position,
      publicBadge: args.publicBadge,
      accessLevel,
      codeHash: await hashStaffConversionCode(target._id, confirmationCode),
      invitedBy: actor._id,
      createdAt: now,
      expiresAt: now + STAFF_CONVERSION_TTL_MS,
      attempts: 0,
    };
    const existingPending = await ctx.db
      .query("staffConversions")
      .withIndex("by_user", (q) => q.eq("userId", target._id))
      .first();
    if (existingPending) await ctx.db.replace(existingPending._id, values);
    else await ctx.db.insert("staffConversions", values);

    await recordAudit(ctx, {
      actorId: actor._id,
      actorLabel: accountLabel(actor),
      action: "permissions-updated",
      targetId: target._id,
      targetLabel: accountLabel(target),
      reason: `Player account conversion requested · ${department} / ${position}; waiting for account-holder confirmation.`,
    });

    return { ok: true, email, department, position, confirmationCode, expiresAt: values.expiresAt };
  },
});

/** The signed-in account holder's pending conversion, without the secret code. */
export const myPendingStaffConversion = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const pending = await ctx.db
      .query("staffConversions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!pending) return null;
    return {
      email: pending.email,
      department: canonicalDepartmentName(pending.department) || pending.department,
      position: pending.position,
      createdAt: pending.createdAt,
      expiresAt: pending.expiresAt,
      expired: pending.expiresAt <= Date.now(),
    };
  },
});

/** Admin-only list of conversions waiting for the account holder's code. */
export const listPendingStaffConversions = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isCompanyAdmin(ctx))) return null;
    await requireRosterVerification(ctx);
    const pending = await ctx.db.query("staffConversions").withIndex("by_user").take(100);
    return await Promise.all(pending.map(async (conversion) => {
      const target = await ctx.db.get(conversion.userId);
      return {
        userId: conversion.userId,
        email: conversion.email,
        username: target?.playerLogin ?? null,
        displayName: target && !isEmailAddress(target.name) ? target.name?.trim() || null : null,
        department: canonicalDepartmentName(conversion.department) || conversion.department,
        position: conversion.position,
        accessLevel: conversion.accessLevel,
        createdAt: conversion.createdAt,
        expiresAt: conversion.expiresAt,
        expired: conversion.expiresAt <= Date.now(),
      };
    })).then((rows) => rows.sort((a, b) => b.createdAt - a.createdAt));
  },
});

/** Admin-only: replace a lost or expired confirmation code with a new one. */
export const regenerateStaffConversionCode = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const actor = await requireRoleAdministrator(ctx);
    const pending = await ctx.db
      .query("staffConversions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!pending) throw new Error("That staff conversion is no longer pending.");
    if (pending.accessLevel === "admin" && !isOwnerAdmin(actor)) {
      throw new Error("Only the owner administrator can reissue an administrator conversion.");
    }
    const target = await ctx.db.get(userId);
    if (!target || target.role !== "user" || target.isSiteBanned) {
      throw new Error("That account is no longer eligible for staff conversion.");
    }
    await assertPositionCapacity(ctx, pending.position, userId);
    const code = makeStaffConversionCode();
    const now = Date.now();
    const expiresAt = now + STAFF_CONVERSION_TTL_MS;
    await ctx.db.patch(pending._id, {
      codeHash: await hashStaffConversionCode(userId, code),
      createdAt: now,
      expiresAt,
      attempts: 0,
    });
    await recordAudit(ctx, {
      actorId: actor._id,
      actorLabel: accountLabel(actor),
      action: "permissions-updated",
      targetId: userId,
      targetLabel: accountLabel(target),
      reason: "Staff conversion confirmation code reissued.",
    });
    return { ok: true, email: pending.email, confirmationCode: code, expiresAt };
  },
});

/** Admin-only: cancel a conversion before the account holder confirms it. */
export const cancelStaffConversion = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const actor = await requireRoleAdministrator(ctx);
    const pending = await ctx.db
      .query("staffConversions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!pending) return { ok: true };
    const target = await ctx.db.get(userId);
    await ctx.db.delete(pending._id);
    await recordAudit(ctx, {
      actorId: actor._id,
      actorLabel: accountLabel(actor),
      action: "permissions-updated",
      targetId: userId,
      targetLabel: accountLabel(target),
      reason: "Pending staff conversion cancelled by an administrator.",
    });
    return { ok: true };
  },
});

/**
 * Account-holder confirmation. The player must be signed in to the exact
 * account being converted and enter the code the administrator received.
 */
export const confirmStaffConversion = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to the account being converted first.");
    const target = await ctx.db.get(userId);
    if (!target || target.isAnonymous) throw new Error("Sign in to the account being converted first.");
    if (target.role !== "user") throw new Error("This account is already a staff account.");
    if (target.isSiteBanned) throw new Error("A restricted account cannot be converted to staff.");

    const pending = await ctx.db
      .query("staffConversions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!pending) throw new Error("No staff conversion is waiting for this account.");
    if (pending.accessLevel === "admin") {
      const inviter = await ctx.db.get(pending.invitedBy);
      if (!isOwnerAdmin(inviter)) {
        throw new Error("This administrator conversion was not approved by the owner. Ask the owner to restart it.");
      }
    }
    if (pending.expiresAt <= Date.now()) {
      throw new Error("That confirmation code expired. Ask an administrator for a new code.");
    }
    if (pending.attempts >= STAFF_CONVERSION_MAX_ATTEMPTS) {
      throw new Error("Too many incorrect codes. Ask an administrator for a new code.");
    }

    const submittedHash = await hashStaffConversionCode(userId, code);
    if (submittedHash !== pending.codeHash) {
      const attempts = pending.attempts + 1;
      await ctx.db.patch(pending._id, { attempts });
      throw new Error(attempts >= STAFF_CONVERSION_MAX_ATTEMPTS
        ? "Too many incorrect codes. Ask an administrator for a new code."
        : "That confirmation code is incorrect. Check the code with the administrator.");
    }

    const emailOwner = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", pending.email))
      .first();
    if (emailOwner && emailOwner._id !== target._id) {
      throw new Error("That company email is now used by another account. Ask an administrator to restart the conversion.");
    }
    await assertPositionCapacity(ctx, pending.position, target._id);

    const existingInvitation = await ctx.db
      .query("companyAccess")
      .withIndex("by_email", (q) => q.eq("email", pending.email))
      .first();
    const invitationValues = {
      email: pending.email,
      department: pending.department,
      position: pending.position,
      publicBadge: pending.publicBadge,
      accessLevel: pending.accessLevel,
      invitedAt: Date.now(),
      invitedBy: pending.invitedBy,
    };
    if (existingInvitation) await ctx.db.replace(existingInvitation._id, invitationValues);
    else await ctx.db.insert("companyAccess", invitationValues);

    await ctx.db.patch(target._id, {
      email: pending.email,
      emailVerificationTime: target.emailVerificationTime ?? Date.now(),
      role: pending.accessLevel === "admin" ? "admin" : "member",
      department: pending.department,
      position: pending.position,
      publicBadge: pending.publicBadge,
      staffAccess: true,
      staffWelcomeVersion: undefined,
      ...(target.pendingRecoveryEmail?.trim().toLowerCase() === pending.email ? { pendingRecoveryEmail: undefined } : {}),
    });
    await ctx.db.delete(pending._id);

    await recordAudit(ctx, {
      actorId: target._id,
      actorLabel: accountLabel(target),
      action: "permissions-updated",
      targetId: target._id,
      targetLabel: accountLabel(target),
      reason: `Account holder confirmed staff conversion · ${pending.department} / ${pending.position}.`,
    });

    return {
      ok: true,
      email: pending.email,
      department: pending.department,
      position: pending.position,
      accessLevel: pending.accessLevel,
    };
  },
});
