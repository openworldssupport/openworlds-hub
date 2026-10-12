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
      return await ctx.db.insert("users", userData);
    },
  },
});