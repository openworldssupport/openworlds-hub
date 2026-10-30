// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth, createAccount, retrieveAccount } from "@convex-dev/auth/server";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { Scrypt } from "lucia";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { emailOtp } from "./auth/emailOtp";
import { SUPPORT_EMAIL } from "./admin";
import { internal } from "./_generated/api";
import { requireSiteAvailableForUser } from "./siteStatus";

const PLAYER_LOGIN_DOMAIN = "players.openworlds.invalid";

const passwordCrypto = {
  async hashSecret(secret: string) {
    return await new Scrypt().hash(secret);
  },
  async verifySecret(secret: string, hashed: string) {
    return await new Scrypt().verify(hashed, secret);
  },
};

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

export const playerPassword = ConvexCredentials({
  id: "player-password",
  crypto: passwordCrypto,
  authorize: async (credentials, ctx) => {
    const { accountId, login } = normalizePlayerLogin(credentials.email);
    const flow = credentials.flow;
    const password = typeof credentials.password === "string" ? credentials.password : "";
    if (!password || password.length > 128) throw new Error("Enter a valid password.");

    if (flow === "signUp") {
      if (password.length < 12) throw new Error("Use a password between 12 and 128 characters.");
      const name = typeof credentials.name === "string" ? credentials.name.trim() : "";
      if (name.length < 2 || name.length > 32) throw new Error("Player name must be 2–32 characters.");
      const recoveryEmail = typeof credentials.recoveryEmail === "string"
        ? credentials.recoveryEmail.trim().toLowerCase()
        : "";
      const usernameEmail = typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
      if (!recoveryEmail || recoveryEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail) || recoveryEmail === usernameEmail) {
        throw new Error("Enter a valid recovery email address that is different from your username sign-in address.");
      }
      const created = await createAccount(ctx, {
        provider: "player-password",
        account: { id: accountId, secret: password },
        profile: {
          email: accountId,
          playerLogin: login,
          name,
          role: "user",
          profileDiscoverable: true,
          pendingRecoveryEmail: recoveryEmail,
        },
      });
      return { userId: created.user._id };
    }

    if (flow !== "signIn" && flow !== "twoFactorSignIn") throw new Error("This sign-in flow is not available.");
    const account = await retrieveAccount(ctx, { provider: "player-password", account: { id: accountId, secret: password } }).catch(() => null);
    if (!account || account.user.role !== "user" || account.user.isSiteBanned) {
      throw new Error("Username/email or password is incorrect.");
    }
    const recoveryEmailVerified = Boolean(account.user.recoveryEmail && account.user.recoveryEmailVerifiedAt !== undefined);
    if (flow === "twoFactorSignIn") {
      if (!account.user.twoFactorEnabled || typeof credentials.twoFactorToken !== "string") throw new Error("Two-step verification is not enabled.");
      const consumed = await ctx.runMutation(internal.accountSecurity.consumeVerifiedChallenge, {
        userId: account.user._id,
        tokenHash: await ctx.runAction(internal.accountSecurity.hashToken, { token: credentials.twoFactorToken }),
      });
      if (!consumed) throw new Error("Two-step sign-in expired. Sign in again.");
    } else if (account.user.twoFactorEnabled) {
      throw new Error("Two-step verification is required. Sign in again and enter an authenticator code.");
    }
    return { userId: account.user._id, recoveryEmailVerified };
  },
});

/**
 * Company accounts remain invitation-only; player accounts use a separate
 * password provider and existing company accounts continue with emailed OTP.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [emailOtp, playerPassword],
  callbacks: {
    async beforeSessionCreation(ctx, { userId }) {
      await requireSiteAvailableForUser(ctx, userId);
    },
    async createOrUpdateUser(ctx, { existingUserId, profile, type, provider }) {
      const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
      const accountUserId = existingUserId ?? (email
        ? (await ctx.db.query("users").filter((q) => q.eq(q.field("email"), email)).first())?._id
        : undefined);
      await requireSiteAvailableForUser(ctx, accountUserId);
      if (provider.type === "credentials") {
        if (provider.id !== "player-password") throw new Error("This credentials provider is not available.");
        const linkedUser = existingUserId ? await ctx.db.get(existingUserId) : null;
        const emailUser = existingUserId
          ? linkedUser
          : await ctx.db.query("users").filter((q) => q.eq(q.field("email"), email)).first();
        if (emailUser && emailUser.role !== "user") {
          throw new Error("This email is already used by a company account. Use a different email for your player account.");
        }
        if (!existingUserId && emailUser) throw new Error("This email is already registered. Sign in instead of creating another account.");
        if (existingUserId && (!linkedUser || linkedUser.role !== "user")) throw new Error("This login is not a player account.");

        if (!existingUserId) {
          const normalizedEmail = email.trim().toLowerCase();
          const playerLogin = typeof profile.playerLogin === "string" ? profile.playerLogin : undefined;
          if (playerLogin) {
            const existingLogin = await ctx.db.query("users").filter((q) => q.eq(q.field("playerLogin"), playerLogin)).first();
            if (existingLogin) throw new Error("That player name is already in use.");
          }
          if (normalizedEmail === SUPPORT_EMAIL) throw new Error("Company account emails cannot be used for player sign up.");
          const invitation = await ctx.db.query("companyAccess").filter((q) => q.eq(q.field("email"), normalizedEmail)).first();
          if (invitation) throw new Error("Company account emails cannot be used for player sign up.");
        }

        const existingPlayer = linkedUser;
        const name = typeof profile.name === "string" ? profile.name.trim() : undefined;
        if (existingPlayer) {
          await ctx.db.patch(existingPlayer._id, {
            role: "user",
            ...(name ? { name } : {}),
            ...(typeof profile.playerLogin === "string" ? { playerLogin: profile.playerLogin } : {}),
            profileDiscoverable: true,
          });
          const savedProfile = await ctx.db.query("playerGameData").filter((q) => q.eq(q.field("userId"), existingPlayer._id)).first();
          if (!savedProfile) {
            const now = Date.now();
            await ctx.db.insert("playerGameData", {
              userId: existingPlayer._id,
              displayName: name ?? existingPlayer.name ?? "Player",
              state: { version: 1, data: {} },
              createdAt: now,
              updatedAt: now,
            });
          }
          return existingPlayer._id;
        }
        const userId = await ctx.db.insert("users", {
          email,
          ...(name ? { name } : {}),
          ...(typeof profile.playerLogin === "string" ? { playerLogin: profile.playerLogin } : {}),
          ...(typeof profile.pendingRecoveryEmail === "string" ? { pendingRecoveryEmail: profile.pendingRecoveryEmail } : {}),
          profileDiscoverable: true,
          role: "user",
        });
        const now = Date.now();
        await ctx.db.insert("playerGameData", {
          userId,
          displayName: name ?? "Player",
          state: { version: 1, data: {} },
          createdAt: now,
          updatedAt: now,
        });
        return userId;
      }

      if (provider.type !== "email" || provider.id !== "email-otp") throw new Error("This sign-in method is not available.");
      if (!email) throw new Error("A company email address is required.");
      const isBootstrapAdmin = email === SUPPORT_EMAIL;
      const invitation = await ctx.db.query("companyAccess").filter((q) => q.eq(q.field("email"), email)).first();
      const existingUser = existingUserId ? await ctx.db.get(existingUserId) : null;
      const userByEmail = await ctx.db.query("users").filter((q) => q.eq(q.field("email"), email)).first();
      const assignedUser = existingUser ?? userByEmail;
      if (assignedUser?.role === "user" && !invitation) throw new Error("This email is already used by a player account. Use a different email for company access.");
      const assignedAdmin = assignedUser?.role === "admin";
      const assignedStaff = Boolean(assignedUser?.emailVerificationTime !== undefined && (assignedUser.staffAccess || assignedUser.department?.trim() || assignedUser.position?.trim()));
      if (!isBootstrapAdmin && !invitation && !assignedAdmin && !assignedStaff) throw new Error("Staff sign-in is available only to invited or approved staff accounts.");

      const verified = type === "verification" && profile.emailVerified === true;
      if (verified && assignedUser?.twoFactorEnabled) {
        const twoFactorApprovedUntil = typeof assignedUser.twoFactorLoginVerifiedUntil === "number" ? assignedUser.twoFactorLoginVerifiedUntil : 0;
        if (twoFactorApprovedUntil < Date.now()) throw new Error("Two-step verification is required. Use your authenticator app to finish signing in.");
        await ctx.db.patch(assignedUser._id, { twoFactorLoginVerifiedUntil: undefined });
      }

      const isAdmin = isBootstrapAdmin || (invitation ? invitation.accessLevel === "admin" : assignedUser?.role === "admin");
      const department = invitation?.department ?? assignedUser?.department;
      const position = invitation?.position ?? assignedUser?.position;
      const publicBadge = invitation?.publicBadge ?? assignedUser?.publicBadge;
      const userData = verified
        ? {
            email,
            emailVerificationTime: Date.now(),
            role: isBootstrapAdmin ? "admin" as const : isAdmin ? "admin" as const : "member" as const,
            ...(!isBootstrapAdmin ? {
              department: department || undefined,
              position: position || undefined,
              publicBadge,
              staffAccess: Boolean(department?.trim() || position?.trim() || invitation || assignedUser?.staffAccess),
              memberStatus: invitation?.memberStatus ?? assignedUser?.memberStatus,
            } : { staffAccess: true }),
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
