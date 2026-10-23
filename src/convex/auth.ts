// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { emailOtp } from "./auth/emailOtp";
import { SUPPORT_EMAIL } from "./admin";


const PLAYER_LOGIN_DOMAIN = "players.openworlds.invalid";

function normalizePlayerLogin(value: unknown): { accountId: string; login: string } {
  const input = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (/^[a-z0-9][a-z0-9._-]{2,23}$/.test(input)) {
    return { accountId: `${input}@${PLAYER_LOGIN_DOMAIN}`, login: input };
  }
  if (input.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
    return { accountId: input, login: input };
  }
  throw new Error("Enter a username (3–24 letters, numbers, dots, hyphens or underscores) or an email address.");
}

export const playerRecoveryStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!user || user.role !== "user" || user.isSiteBanned) throw new Error("Player account required.");
    return {
      recoveryEmail: user.recoveryEmail ?? null,
      pendingEmail: user.pendingRecoveryEmail ?? null,
      isVerified: Boolean(user.recoveryEmail && user.recoveryEmailVerifiedAt),
    };
  },
});

const playerPassword = Password({
  id: "player-password",
  profile: (params) => {
    const { accountId, login } = normalizePlayerLogin(params.email);
    const name = typeof params.name === "string" ? params.name.trim() : "";
    if (params.flow === "signUp" && (name.length < 2 || name.length > 32)) {
      throw new Error("Player name must be 2–32 characters.");
    }
    const recoveryEmail = typeof params.recoveryEmail === "string" && params.recoveryEmail.trim()
      ? params.recoveryEmail.trim().toLowerCase()
      : undefined;
    if (recoveryEmail && (recoveryEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail))) {
      throw new Error("Enter a valid optional recovery email address.");
    }
    return { email: accountId, playerLogin: login, ...(recoveryEmail ? { pendingRecoveryEmail: recoveryEmail } : {}), ...(name ? { name } : {}) };
  },
  validatePasswordRequirements(password) {
    if (password.length < 12 || password.length > 128) {
      throw new Error("Use a password between 12 and 128 characters.");
    }
  },
});

// Passwords are hashed by Convex Auth's Scrypt-backed Password provider.
// Player accounts intentionally use a separate provider from staff email OTP.

/**
 * Company accounts remain invitation-only; player accounts are self-service
 * and use a distinct password provider and user record.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [emailOtp, () => ({ ...playerPassword, id: "player-password" })],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile, type, provider }) {
      const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
      if (provider.type === "credentials") {
        if (provider.id !== "player-password") throw new Error("This credentials provider is not available.");
        const linkedUser = existingUserId ? await ctx.db.get(existingUserId) : null;
        const emailUser = existingUserId
          ? linkedUser
          : await ctx.db.query("users").filter((q) => q.eq(q.field("email"), email)).first();
        if (emailUser && emailUser.role !== "user") {
          throw new Error("This email is already used by a company account. Use a different email for your player account.");
        }
        if (!existingUserId && emailUser) {
          throw new Error("This email is already registered. Sign in instead of creating another account.");
        }
        if (existingUserId && (!linkedUser || linkedUser.role !== "user")) {
          throw new Error("This login is not a player account.");
        }
        if (!existingUserId) {
          const normalizedEmail = email.trim().toLowerCase();
          const playerLogin = typeof profile.playerLogin === "string" ? profile.playerLogin : undefined;
          if (playerLogin) {
            const existingLogin = await ctx.db.query("users").filter((q) => q.eq(q.field("playerLogin"), playerLogin)).first();
            if (existingLogin) throw new Error("That player name is already in use.");
          }
          if (normalizedEmail === SUPPORT_EMAIL) {
            throw new Error("Company account emails cannot be used for player sign up.");
          }
          const invitation = await ctx.db.query("companyAccess").filter((q) => q.eq(q.field("email"), normalizedEmail)).first();
          const acceptedApplication = await ctx.db.query("careerApplications").filter((q) => q.and(q.eq(q.field("email"), normalizedEmail), q.eq(q.field("status"), "accepted"))).first();
          if (invitation || acceptedApplication) {
            throw new Error("Company account emails cannot be used for player sign up.");
          }
        }
        const existingPlayer = linkedUser;
        const name = typeof profile.name === "string" ? profile.name.trim() : undefined;
        if (existingPlayer) {
          await ctx.db.patch(existingPlayer._id, {
            role: "user",
            ...(name ? { name } : {}),
            ...(typeof profile.playerLogin === "string" ? { playerLogin: profile.playerLogin } : {}),
          });
          return existingPlayer._id;
        }
        return await ctx.db.insert("users", {
          email,
          ...(name ? { name } : {}),
          ...(typeof profile.playerLogin === "string" ? { playerLogin: profile.playerLogin } : {}),
          ...(typeof profile.pendingRecoveryEmail === "string" ? { pendingRecoveryEmail: profile.pendingRecoveryEmail } : {}),
          role: "user",
        });
      }
      if (provider.type !== "email" || provider.id !== "email-otp") throw new Error("This sign-in method is not available.");

      if (!email) throw new Error("A company email address is required.");

      const isBootstrapAdmin = email === SUPPORT_EMAIL;
      const invitation = await ctx.db
        .query("companyAccess")
        .filter((q) => q.eq(q.field("email"), email))
        .first();
      const approvedApplication = await ctx.db
        .query("careerApplications")
        .filter((q) => q.and(q.eq(q.field("email"), email), q.eq(q.field("status"), "accepted")))
        .first();
      const existingUser = existingUserId ? await ctx.db.get(existingUserId) : null;
      const userByEmail = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), email))
        .first();
      const assignedUser = existingUser ?? userByEmail;
      if (assignedUser?.role === "user") {
        throw new Error("This email is already used by a player account. Use a different email for company access.");
      }
      const assignedStaff = Boolean(
        assignedUser?.emailVerificationTime !== undefined &&
        (assignedUser.staffAccess || assignedUser.department?.trim() || assignedUser.position?.trim()),
      );
      const mayAccessStaff = Boolean(isBootstrapAdmin || invitation || approvedApplication || assignedStaff);
      if (!mayAccessStaff) {
        throw new Error("Staff sign-in is available only to invited or approved staff accounts.");
      }

      // Convex Auth upserts an email user before it sends the code. Do not grant
      // staff/admin role or publish a badge until the user proves mailbox access.
      const verified = type === "verification" && profile.emailVerified === true;
      // Privileges always follow the current invite, never a stale user role.
      const isAdmin = isBootstrapAdmin || invitation?.accessLevel === "admin";
      const department = invitation?.department ?? assignedUser?.department ?? (approvedApplication ? "Company" : undefined);
      const position = invitation?.position ?? assignedUser?.position ?? (approvedApplication ? "Approved staff" : undefined);
      const publicBadge = invitation?.publicBadge ?? assignedUser?.publicBadge ?? (approvedApplication ? "staff" as const : undefined);
      const userData = verified
        ? {
            email,
            emailVerificationTime: Date.now(),
            role: isAdmin ? "admin" as const : "member" as const,
            ...(!isBootstrapAdmin
              ? {
                  department: department || undefined,
                  position: position || undefined,
                  publicBadge,
                  staffAccess: Boolean(department?.trim() || position?.trim() || invitation || approvedApplication || assignedUser?.staffAccess),
                  memberStatus: invitation?.memberStatus ?? assignedUser?.memberStatus,
                }
              : { staffAccess: true }),
          }
        : { email };

      if (existingUserId) {
        await ctx.db.patch(existingUserId, userData);
        return existingUserId;
      }
      if (userByEmail) {
        await ctx.db.patch(userByEmail._id, userData);
        return userByEmail._id;
      }
      return await ctx.db.insert("users", userData);
    },
  },
});