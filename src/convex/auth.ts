// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { emailOtp } from "./auth/emailOtp";
import { SUPPORT_EMAIL } from "./admin";

const playerPassword = Password({
  id: "player-password",
  profile: (params) => {
    const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
    const [localPart, domainPart, ...extraParts] = email.split("@");
    if (!localPart || !domainPart || extraParts.length > 0 || !domainPart.includes(".") || email.length > 254) {
      throw new Error("Enter a valid email address.");
    }
    const name = typeof params.name === "string" ? params.name.trim() : "";
    if (params.flow === "signUp" && (name.length < 2 || name.length > 32)) {
      throw new Error("Player name must be 2–32 characters.");
    }
    return { email, ...(name ? { name } : {}) };
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
          await ctx.db.patch(existingPlayer._id, { role: "user", ...(name ? { name } : {}) });
          return existingPlayer._id;
        }
        return await ctx.db.insert("users", {
          email,
          ...(name ? { name } : {}),
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