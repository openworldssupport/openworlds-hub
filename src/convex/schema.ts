import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove
      role: v.optional(roleValidator), // role of the user. do not remove
      playerLogin: v.optional(v.string()),
      isOfficialCreator: v.optional(v.boolean()),
      profileDiscoverable: v.optional(v.boolean()),
      publicBio: v.optional(v.string()),
      profileFriendsVisible: v.optional(v.boolean()),
      // When false, new friend requests are refused. Existing connections and
      // requests already sent are unaffected.
      friendRequestsEnabled: v.optional(v.boolean()),
      profileImageStorageId: v.optional(v.id("_storage")),
      pendingRecoveryEmail: v.optional(v.string()),
      recoveryEmail: v.optional(v.string()),
      recoveryEmailVerifiedAt: v.optional(v.number()),
      recoveryCodeWindowAt: v.optional(v.number()),
      recoveryCodeRequestCount: v.optional(v.number()),
      twoFactorEnabled: v.optional(v.boolean()),
      twoFactorSecret: v.optional(v.string()),
      twoFactorPendingSecret: v.optional(v.string()),
      twoFactorVerifiedSessionId: v.optional(v.string()),
      twoFactorLoginVerifiedUntil: v.optional(v.number()),
      twoFactorAttemptWindowAt: v.optional(v.number()),
      twoFactorAttemptCount: v.optional(v.number()),
      twoFactorLastCounter: v.optional(v.number()),
      twoFactorRecoveryCodeHashes: v.optional(v.array(v.string())),

      // Optional verified phone number used as an SMS backup second factor.
      // The full number is only returned to the account owner and in an
      // owner-only investigation export; staff/admin lists stay masked.
      phoneNumber: v.optional(v.string()),
      phoneVerifiedAt: v.optional(v.number()),
      pendingPhoneNumber: v.optional(v.string()),
      phoneCodeLastSentAt: v.optional(v.number()),
      phoneCodeWindowAt: v.optional(v.number()),
      phoneCodeSendCount: v.optional(v.number()),
      phoneVerifyAttemptWindowAt: v.optional(v.number()),
      phoneVerifyAttemptCount: v.optional(v.number()),

      // Company org data, assigned from the admin panel. A user with a
      // department and/or position is treated as staff and can use /staff.
      department: v.optional(v.string()),
      position: v.optional(v.string()),
      // What the public website shows for this person: "Staff" or "Dev".
      // When unset, the badge is derived from department/position.
      publicBadge: v.optional(v.union(v.literal("staff"), v.literal("dev"))),
      // Granted after a verified OTP for an invited or assigned staff account.
      staffAccess: v.optional(v.boolean()),
      // Set just before a staff sign-in code is requested for delivery to the
      // verified recovery email instead of the company mailbox.
      staffOtpRecoveryRequestAt: v.optional(v.number()),
      // Delivery throttle so a staff email cannot be used as an OTP spam target.
      staffOtpLastSentAt: v.optional(v.number()),
      staffOtpSendWindowAt: v.optional(v.number()),
      staffOtpSendCount: v.optional(v.number()),
      // Versioned server-side acknowledgement for staff welcome notices.
      staffWelcomeVersion: v.optional(v.number()),
      // Staff-chosen public name used across /staff and public team pages.
      // Preferred over name; emails are never shown as display names.
      nickname: v.optional(v.string()),
      // Optional recognition status displayed to company admins.
      memberStatus: v.optional(v.literal("volunteer-thank-you")),
      // Site-wide moderation controls and short-lived news verification.
      isSiteBanned: v.optional(v.boolean()),
      siteBanReason: v.optional(v.string()),
      siteBannedAt: v.optional(v.number()),
      // Moderation bans are temporary or permanent. Temporary bans store an
      // expiry and are lifted automatically; permanent bans also block new
      // account creation with the same email or username (bannedIdentities).
      banType: v.optional(v.union(v.literal("temporary"), v.literal("permanent"))),
      banExpiresAt: v.optional(v.number()),
      securityViolationCount: v.optional(v.number()),
      // Presence: refreshed by the website and by the game client.
      lastWebsiteSeenAt: v.optional(v.number()),
      lastGameSeenAt: v.optional(v.number()),
      gameActivity: v.optional(v.string()),
      // Automatic image-safety takedowns can pause new profile photos.
      imageUploadBlockedUntil: v.optional(v.number()),
      imageViolationCount: v.optional(v.number()),
      imageViolationWindowAt: v.optional(v.number()),
      lastSecurityViolationAt: v.optional(v.number()),
      newsPostingVerifiedUntil: v.optional(v.number()),
      newsPostingCodeWindowAt: v.optional(v.number()),
      newsPostingCodeRequestCount: v.optional(v.number()),
      newsPostingCodeRequestedAt: v.optional(v.number()),
    })
      .index("email", ["email"]) // index for the email. do not remove or modify
      .index("by_official_creator", ["isOfficialCreator"])
      .index("by_site_banned", ["isSiteBanned"])
      .index("by_staff_access", ["staffAccess"])
      .index("by_department", ["department"])
      .index("by_player_login", ["playerLogin"])
      .index("by_recovery_email", ["recoveryEmail"])
      .index("by_phone", ["phoneNumber"])
      .searchIndex("search_player_profiles", {
        searchField: "playerLogin",
        filterFields: ["role", "profileDiscoverable"],
      })
      .searchIndex("search_player_display_names", {
        searchField: "name",
        filterFields: ["role", "profileDiscoverable"],
      })
      .searchIndex("search_public_nicknames", {
        searchField: "nickname",
        filterFields: [],
      })
      .searchIndex("search_players_by_username", {
        searchField: "playerLogin",
        filterFields: ["role"],
      })
      .searchIndex("search_players_by_name", {
        searchField: "name",
        filterFields: ["role"],
      }),

    // Emails explicitly approved for private company OTP sign-in.
    companyAccess: defineTable({
      email: v.string(),
      department: v.string(),
      position: v.string(),
      publicBadge: v.union(v.literal("staff"), v.literal("dev")),
      accessLevel: v.union(v.literal("admin"), v.literal("staff")),
      memberStatus: v.optional(v.literal("volunteer-thank-you")),
      invitedAt: v.number(),
      invitedBy: v.id("users"),
    }).index("by_email", ["email"]),

    // Two-party staff conversion: an administrator requests the change and the
    // signed-in account holder confirms it with a one-time code.
    staffConversions: defineTable({
      userId: v.id("users"),
      email: v.string(),
      department: v.string(),
      position: v.string(),
      publicBadge: v.union(v.literal("staff"), v.literal("dev")),
      accessLevel: v.union(v.literal("admin"), v.literal("staff")),
      codeHash: v.string(),
      invitedBy: v.id("users"),
      createdAt: v.number(),
      expiresAt: v.number(),
      attempts: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_email", ["email"]),

    securityAppeals: defineTable({
      userId: v.id("users"),
      email: v.string(),
      message: v.string(),
      status: v.union(v.literal("pending"), v.literal("approved"), v.literal("declined")),
      createdAt: v.number(),
      reviewedAt: v.optional(v.number()),
      reviewedBy: v.optional(v.id("users")),
    })
      .index("by_user", ["userId"])
      .index("by_status_created", ["status", "createdAt"]),

    // Player reports reviewed by the contact team (staff and admins).
    playerReports: defineTable({
      reporterId: v.id("users"),
      reporterLabel: v.string(),
      targetId: v.id("users"),
      targetLabel: v.string(),
      targetUsername: v.optional(v.string()),
      // Public profile key, including account-<id> for accounts without a username.
      targetProfileKey: v.optional(v.string()),
      category: v.union(
        v.literal("harassment"),
        v.literal("hate-speech"),
        v.literal("scam"),
        v.literal("cheating"),
        v.literal("inappropriate-content"),
        v.literal("display-name"),
        v.literal("profile-picture"),
        v.literal("terms-violation"),
        v.literal("other"),
      ),
      message: v.string(),
      // Reporter-supplied HTTPS evidence. The site does not fetch or verify the
      // contents; staff review the links before acting.
      evidenceLinks: v.optional(v.array(v.string())),
      status: v.union(v.literal("open"), v.literal("closed")),
      resolution: v.optional(v.union(v.literal("no-action"), v.literal("warned"), v.literal("banned"))),
      resolutionNote: v.optional(v.string()),
      resolvedAt: v.optional(v.number()),
      resolvedBy: v.optional(v.id("users")),
      createdAt: v.number(),
    })
      .index("by_status_created", ["status", "createdAt"])
      .index("by_target", ["targetId"])
      .index("by_reporter_created", ["reporterId", "createdAt"]),

    // Emails and usernames tied to a ban. Used to stop banned accounts from
    // signing up again. Rows are removed when the ban is lifted.
    bannedIdentities: defineTable({
      userId: v.id("users"),
      email: v.optional(v.string()),
      username: v.optional(v.string()),
      reason: v.string(),
      expiresAt: v.optional(v.number()),
      createdAt: v.number(),
      // Omitted when the block was created by the automated review system.
      createdBy: v.optional(v.id("users")),
    })
      .index("by_email", ["email"])
      .index("by_username", ["username"])
      .index("by_user", ["userId"]),

    // Warnings shown to the account and retained for escalation decisions.
    moderationWarnings: defineTable({
      targetId: v.id("users"),
      targetLabel: v.string(),
      actorId: v.optional(v.id("users")),
      actorLabel: v.string(),
      source: v.union(v.literal("automated"), v.literal("staff")),
      severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
      reason: v.string(),
      reportIds: v.array(v.id("playerReports")),
      evidenceLinks: v.array(v.string()),
      createdAt: v.number(),
      acknowledgedAt: v.optional(v.number()),
    })
      .index("by_target_created", ["targetId", "createdAt"])
      .index("by_created", ["createdAt"]),

    // The evidence packet and decision produced when reports are scored. These
    // records are kept even when no automatic action is taken, so staff can
    // audit why the system did or did not act.
    moderationAssessments: defineTable({
      targetId: v.id("users"),
      targetLabel: v.string(),
      targetUsername: v.optional(v.string()),
      triggerReportId: v.id("playerReports"),
      reportIds: v.array(v.id("playerReports")),
      category: v.string(),
      severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
      evidenceScore: v.number(),
      independentReporters: v.number(),
      verifiedReporters: v.number(),
      evidenceLinks: v.number(),
      evidenceDomains: v.number(),
      status: v.union(v.literal("automatically-warned"), v.literal("automatically-banned"), v.literal("needs-review"), v.literal("insufficient-evidence")),
      reasons: v.array(v.string()),
      actionTaken: v.union(v.literal("none"), v.literal("warning"), v.literal("temporary-ban")),
      actionExpiresAt: v.optional(v.number()),
      reviewedAt: v.optional(v.number()),
      reviewedBy: v.optional(v.id("users")),
      reviewNote: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_created", ["createdAt"])
      .index("by_target_created", ["targetId", "createdAt"])
      .index("by_status_created", ["status", "createdAt"]),

    // Admin-managed capability grants for moderation. A row overrides the
    // built-in defaults for that exact department + position. Administrators
    // always retain every capability and do not need a row.
    moderationRolePermissions: defineTable({
      department: v.string(),
      position: v.string(),
      departmentKey: v.string(),
      positionKey: v.string(),
      capabilities: v.array(v.union(
        v.literal("view"),
        v.literal("warn"),
        v.literal("suspend"),
        v.literal("ban"),
        v.literal("ip-ban"),
        v.literal("review-appeals"),
        v.literal("view-audit"),
      )),
      updatedAt: v.number(),
      updatedBy: v.id("users"),
    })
      .index("by_keys", ["departmentKey", "positionKey"])
      .index("by_department", ["departmentKey"]),

    // Network blocks are kept separately from account bans because they apply
    // to an IP/CIDR at the edge or game server. They are never applied
    // automatically to a signed-in account by the website runtime.
    networkBans: defineTable({
      network: v.string(),
      reason: v.string(),
      createdBy: v.id("users"),
      createdByLabel: v.string(),
      createdAt: v.number(),
      expiresAt: v.optional(v.number()),
      liftedAt: v.optional(v.number()),
      liftedBy: v.optional(v.id("users")),
      liftedByLabel: v.optional(v.string()),
      liftReason: v.optional(v.string()),
    })
      .index("by_created", ["createdAt"])
      .index("by_network", ["network"]),

    // Append-only record of every moderation decision, so staff and admins
    // can be held accountable for what they did and why.
    // Automatic image-safety decisions, shown to the contact team.
    mediaModeration: defineTable({
      userId: v.id("users"),
      username: v.optional(v.string()),
      displayName: v.string(),
      // Kept in quarantine so the contact team can review and restore it.
      storageId: v.optional(v.id("_storage")),
      reason: v.string(),
      detail: v.string(),
      action: v.literal("blocked"),
      status: v.union(v.literal("open"), v.literal("reviewed")),
      decision: v.optional(v.union(v.literal("allowed"), v.literal("blocked"))),
      createdAt: v.number(),
      reviewedAt: v.optional(v.number()),
      reviewedBy: v.optional(v.id("users")),
      note: v.optional(v.string()),
    })
      .index("by_status_created", ["status", "createdAt"])
      .index("by_user_created", ["userId", "createdAt"]),

    moderationLog: defineTable({
      // Optional so automatic safety actions can be recorded without a person.
      actorId: v.optional(v.id("users")),
      actorLabel: v.string(),
      action: v.union(
        v.literal("ban-temporary"),
        v.literal("ban-permanent"),
        v.literal("unban"),
        v.literal("report-dismissed"),
        v.literal("report-warned"),
        v.literal("report-banned"),
        v.literal("automatic-warning"),
        v.literal("automatic-ban"),
        v.literal("account-warned"),
        v.literal("account-suspended"),
        v.literal("account-banned"),
        v.literal("ip-ban-added"),
        v.literal("ip-ban-lifted"),
        v.literal("permissions-updated"),
        v.literal("appeal-approved"),
        v.literal("appeal-declined"),
        v.literal("image-blocked"),
        v.literal("image-reviewed"),
      ),
      targetId: v.optional(v.id("users")),
      targetLabel: v.string(),
      reason: v.string(),
      reportId: v.optional(v.id("playerReports")),
      createdAt: v.number(),
    })
      .index("by_created", ["createdAt"])
      .index("by_target_created", ["targetId", "createdAt"]),

    // Legacy: news posting now uses the session unlock in staffUnlocks.
    newsPostingCodes: defineTable({
      userId: v.id("users"),
      codeHash: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
      attempts: v.number(),
    }).index("by_user_created", ["userId", "createdAt"]),

    playerRecoveryCodes: defineTable({
      userId: v.id("users"),
      email: v.string(),
      codeHash: v.string(),
      purpose: v.union(v.literal("verify-email"), v.literal("reset-password")),
      createdAt: v.number(),
      expiresAt: v.number(),
      attempts: v.number(),
    }).index("by_user_created", ["userId", "createdAt"]),

    twoFactorLoginChallenges: defineTable({
      userId: v.id("users"),
      tokenHash: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
      attempts: v.number(),
      verifiedAt: v.optional(v.number()),
      // SMS backup challenge state. A challenge can use the authenticator or
      // request one text-message code, not an unlimited stream.
      phoneSentAt: v.optional(v.number()),
      phoneAttempts: v.optional(v.number()),
    }).index("by_token_hash", ["tokenHash"]).index("by_user_created", ["userId", "createdAt"]),

    staffOtpLoginAttempts: defineTable({
      email: v.string(),
      windowAt: v.number(),
      attempts: v.number(),
    }).index("by_email", ["email"]),

    // One record per signed-in auth session, with the browser/device that
    // created it. Account & security shows these and can end them remotely.
    accountDevices: defineTable({
      userId: v.id("users"),
      sessionId: v.string(),
      deviceId: v.string(),
      label: v.string(),
      browser: v.string(),
      platform: v.string(),
      deviceType: v.union(v.literal("desktop"), v.literal("phone"), v.literal("tablet")),
      createdAt: v.number(),
      lastSeenAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_session", ["sessionId"])
      .index("by_user_device", ["userId", "deviceId"]),

    // Owner-only legal-disclosure access. A full dossier may be opened only for
    // a valid law-enforcement or legal request, never for internal review. Each
    // opening records the actor, target, reason, authority, reference,
    // jurisdiction, and timestamp. `internal-safety` is retained only so legacy
    // rows remain readable and is no longer accepted by the mutation.
    investigationAccessLog: defineTable({
      actorId: v.id("users"),
      targetId: v.id("users"),
      reason: v.string(),
      requestType: v.optional(v.union(
        v.literal("internal-safety"),
        v.literal("law-enforcement"),
        v.literal("legal"),
      )),
      legalAuthority: v.optional(v.string()),
      legalReference: v.optional(v.string()),
      jurisdiction: v.optional(v.string()),
      legalBasis: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_created", ["createdAt"])
      .index("by_target_created", ["targetId", "createdAt"])
      .index("by_actor_created", ["actorId", "createdAt"]),

    // One short-lived elevation per signed-in session. Created by
    // staffUnlock.unlock after the member confirms a code from their own
    // authenticator app; every sensitive staff action checks it.
    staffUnlocks: defineTable({
      userId: v.id("users"),
      sessionId: v.string(),
      verifiedUntil: v.number(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]).index("by_session", ["sessionId"]),

    // Legacy emailed-code records. No longer written or read.
    adminRosterVerifications: defineTable({
      userId: v.id("users"),
      codeHash: v.optional(v.string()),
      codeExpiresAt: v.optional(v.number()),
      codeAttempts: v.optional(v.number()),
      requestWindowAt: v.optional(v.number()),
      requestCount: v.optional(v.number()),
      verifiedUntil: v.optional(v.number()),
      permissionCodeHash: v.optional(v.string()),
      permissionCodeExpiresAt: v.optional(v.number()),
      permissionCodeAttempts: v.optional(v.number()),
      permissionVerifiedUntil: v.optional(v.number()),
      creatorCodeHash: v.optional(v.string()),
      creatorCodeExpiresAt: v.optional(v.number()),
      creatorCodeAttempts: v.optional(v.number()),
      creatorVerifiedUntil: v.optional(v.number()),
    }).index("by_user", ["userId"]),

    siteStatusSettings: defineTable({
      key: v.literal("main"),
      // Keep the legacy value readable for existing records; the control now exposes a single unavailable mode.
      status: v.union(v.literal("available"), v.literal("under-construction"), v.literal("unavailable")),
      pendingStatus: v.optional(v.union(v.literal("available"), v.literal("under-construction"), v.literal("unavailable"))),
      updatedAt: v.number(),
      codeHash: v.optional(v.string()),
      codeRequestedBy: v.optional(v.id("users")),
      codeExpiresAt: v.optional(v.number()),
      codeAttempts: v.optional(v.number()),
      codeWindowAt: v.optional(v.number()),
      codeRequestCount: v.optional(v.number()),
    }).index("by_key", ["key"]),

    // Private game profile and progress. Every read/write is scoped to the
    // authenticated player by gameData.ts; clients never supply a userId.
    playerGameData: defineTable({
      userId: v.id("users"),
      displayName: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      state: v.object({
        version: v.number(),
        data: v.any(),
      }),
    }).index("by_user", ["userId"]),

    // Public world listings are created explicitly by authenticated players.
    publishedWorlds: defineTable({
      ownerId: v.id("users"),
      title: v.string(),
      description: v.string(),
      imageStorageIds: v.optional(v.array(v.id("_storage"))),
      createdAt: v.number(),
    })
      .index("by_owner", ["ownerId"])
      .searchIndex("search_published_worlds", {
        searchField: "title",
        filterFields: [],
      }),

    // Player-uploaded public profile/world images. Ownership is recorded by the
    // server before an asset can be attached to a public record.
    playerMedia: defineTable({
      storageId: v.id("_storage"),
      ownerId: v.id("users"),
      kind: v.union(v.literal("profile"), v.literal("world")),
      worldId: v.optional(v.id("publishedWorlds")),
      createdAt: v.number(),
    })
      .index("by_storage_id", ["storageId"])
      .index("by_owner_kind", ["ownerId", "kind"]),

    friendRequests: defineTable({
      senderId: v.id("users"),
      receiverId: v.id("users"),
      status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_sender", ["senderId"])
      .index("by_receiver", ["receiverId"]),

    playerMessages: defineTable({
      participantA: v.id("users"),
      participantB: v.id("users"),
      senderId: v.id("users"),
      receiverId: v.id("users"),
      body: v.string(),
      createdAt: v.number(),
    })
      .index("by_pair_created", ["participantA", "participantB", "createdAt"])
      .index("by_sender_created", ["senderId", "createdAt"]),

    legalAcceptances: defineTable({
      userId: v.id("users"),
      privacyVersion: v.string(),
      termsVersion: v.string(),
      agreementRevision: v.optional(v.string()),
      acceptedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_and_versions", ["userId", "privacyVersion", "termsVersion"])
      .index("by_user_versions_revision", ["userId", "privacyVersion", "termsVersion", "agreementRevision"]),

    // Admin-approved creators are stored separately from emailed applications.
    // The contact email is private and is never returned by public queries.
    officialCreators: defineTable({
      email: v.string(),
      username: v.string(),
      displayName: v.string(),
      socialPlatform: v.optional(v.string()),
      socialUrl: v.optional(v.string()),
      linkedUserId: v.optional(v.id("users")),
      createdAt: v.number(),
      updatedAt: v.number(),
      createdBy: v.id("users"),
    })
      .index("by_email", ["email"])
      .index("by_username", ["username"])
      .index("by_linked_user", ["linkedUserId"]),

    careerRoleAvailability: defineTable({
      roleSlug: v.string(),
      isOpen: v.boolean(),
      updatedAt: v.number(),
    }).index("by_role_slug", ["roleSlug"]),

    // Short-lived, hashed-email throttling only; application content is never stored here.
    careerEnquiryLimits: defineTable({
      emailHash: v.string(),
      lastSubmittedAt: v.number(),
    }).index("by_email_hash", ["emailHash"]),

    adminNotificationRecipients: defineTable({
      email: v.string(),
      kind: v.union(v.literal("careers"), v.literal("support"), v.literal("both")),
      createdAt: v.number(),
    })
      .index("by_email", ["email"])
      .index("by_channel_kind", ["kind"]),

    supportTickets: defineTable({
      reference: v.optional(v.string()),
      name: v.optional(v.string()),
      email: v.string(),
      username: v.optional(v.string()),
      reason: v.string(),
      subject: v.optional(v.string()),
      message: v.string(),
      status: v.string(),
      submittedAt: v.number(),
      respondedAt: v.optional(v.number()),
      closedAt: v.optional(v.number()),
    })
      .index("by_submitted_at", ["submittedAt"])
      .index("by_reference", ["reference"])
      .index("by_email_submitted_at", ["email", "submittedAt"]),

    // Internal message board for the staff/company portal at /staff.
    staffMessages: defineTable({
      authorId: v.id("users"),
      authorName: v.string(),
      department: v.optional(v.string()),
      position: v.optional(v.string()),
      badge: v.optional(v.union(v.literal("staff"), v.literal("dev"))),
      body: v.string(),
      createdAt: v.number(),
    }).index("by_created_at", ["createdAt"]),

    // Department-scoped internal updates for the staff department hub.
    departmentPosts: defineTable({
      department: v.string(),
      departmentKey: v.string(),
      authorId: v.id("users"),
      authorName: v.string(),
      authorPosition: v.optional(v.string()),
      authorBadge: v.optional(v.union(v.literal("staff"), v.literal("dev"))),
      body: v.string(),
      createdAt: v.number(),
    })
      .index("by_department_created", ["departmentKey", "createdAt"])
      .index("by_created", ["createdAt"]),

    // Cross-department staff comms. Visible to every verified staff member,
    // regardless of which department they belong to.
    staffGeneralPosts: defineTable({
      authorId: v.id("users"),
      authorName: v.string(),
      authorDepartment: v.optional(v.string()),
      authorPosition: v.optional(v.string()),
      authorBadge: v.optional(v.union(v.literal("staff"), v.literal("dev"))),
      body: v.string(),
      createdAt: v.number(),
    }).index("by_created", ["createdAt"]),

    // Upcoming and past department meetings shown in the staff department hub.
    departmentMeetings: defineTable({
      department: v.string(),
      departmentKey: v.string(),
      title: v.string(),
      agenda: v.optional(v.string()),
      startsAt: v.number(),
      durationMinutes: v.number(),
      location: v.optional(v.string()),
      createdBy: v.id("users"),
      createdByName: v.string(),
      createdAt: v.number(),
      cancelledAt: v.optional(v.number()),
      cancelledBy: v.optional(v.id("users")),
      cancelReason: v.optional(v.string()),
    })
      .index("by_department_starts", ["departmentKey", "startsAt"])
      .index("by_starts", ["startsAt"]),

    // Game announcements are drafted by staff and published to the public News page.
    gameAnnouncements: defineTable({
      authorId: v.id("users"),
      authorName: v.string(),
      department: v.optional(v.string()),
      position: v.optional(v.string()),
      badge: v.optional(v.union(v.literal("staff"), v.literal("dev"))),
      title: v.string(),
      summary: v.string(),
      body: v.string(),
      media: v.optional(v.array(v.object({
        storageId: v.optional(v.id("_storage")),
        mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
        altText: v.optional(v.string()),
      }))),
      category: v.union(
        v.literal("announcement"),
        v.literal("development"),
        v.literal("release"),
        v.literal("event"),
      ),
      status: v.union(v.literal("draft"), v.literal("published")),
      createdAt: v.number(),
      publishedAt: v.optional(v.number()),
    })
      .index("by_created_at", ["createdAt"])
      .index("by_status_published_at", ["status", "publishedAt"]),

    // Uploaded announcement assets are only attachable by their verified uploader.
    announcementAssets: defineTable({
      storageId: v.id("_storage"),
      mediaType: v.union(v.literal("image"), v.literal("video")),
      authorId: v.id("users"),
      createdAt: v.number(),
      announcementId: v.optional(v.id("gameAnnouncements")),
    })
      .index("by_storage_id", ["storageId"])
      .index("by_announcement_id", ["announcementId"]),
  },
  {
    // Enforce the schema on every write so unknown/typo'd fields cannot be
    // persisted. This is a security and data-integrity safeguard.
    schemaValidation: true,
  },
);

export default schema;
