// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { emailOtp } from "./auth/emailOtp";
import { SUPPORT_EMAIL } from "./admin";

/**
 * Company accounts are invitation-only. The support mailbox is the initial
 * administrator; all other company accounts require an admin invitation.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  // No anonymous provider: public visitors cannot create auth accounts.
  providers: [emailOtp],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile, type }) {
      const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
      if (!email) throw new Error("A company email address is required.");

      const isBootstrapAdmin = email === SUPPORT_EMAIL;
      const invitation = await ctx.db
        .query("companyAccess")
        .filter((q) => q.eq(q.field("email"), email))
        .first();
      if (!isBootstrapAdmin && !invitation) {
        throw new Error("This email is not invited to an OpenWorlds company account.");
      }

      // Convex Auth upserts an email user before it sends the code. Do not grant
      // staff/admin role or publish a badge until the user proves mailbox access.
      const verified = type === "verification" && profile.emailVerified === true;
      // Privileges always follow the current invite, never a stale user role.
      const isAdmin = isBootstrapAdmin || invitation?.accessLevel === "admin";
      const userData = verified
        ? {
            email,
            emailVerificationTime: Date.now(),
            role: isAdmin ? "admin" as const : "member" as const,
            ...(!isBootstrapAdmin
              ? {
                  department: invitation.department,
                  position: invitation.position,
                  publicBadge: invitation.publicBadge,
                }
              : {}),
          }
        : { email };

      if (existingUserId) {
        await ctx.db.patch(existingUserId, userData);
        return existingUserId;
      }
      return await ctx.db.insert("users", userData);
    },
  },
});