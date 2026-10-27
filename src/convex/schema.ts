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

      // Company org data, assigned from the admin panel. A user with a
      // department and/or position is treated as staff and can use /staff.
      department: v.optional(v.string()),
      position: v.optional(v.string()),
      // What the public website shows for this person: "Staff" or "Dev".
      // When unset, the badge is derived from department/position.
      publicBadge: v.optional(v.union(v.literal("staff"), v.literal("dev"))),
      // Granted after a verified OTP for an invited or assigned staff account.
      staffAccess: v.optional(v.boolean()),
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
      securityViolationCount: v.optional(v.number()),
      lastSecurityViolationAt: v.optional(v.number()),
      newsPostingVerifiedUntil: v.optional(v.number()),
      newsPostingCodeWindowAt: v.optional(v.number()),
      newsPostingCodeRequestCount: v.optional(v.number()),
      newsPostingCodeRequestedAt: v.optional(v.number()),
    })
      .index("email", ["email"]) // index for the email. do not remove or modify
      .index("by_official_creator", ["isOfficialCreator"])
      .index("by_player_login", ["playerLogin"])
      .index("by_recovery_email", ["recoveryEmail"])
      .searchIndex("search_player_profiles", {
        searchField: "playerLogin",
        filterFields: ["role", "profileDiscoverable"],
      })
      .searchIndex("search_player_display_names", {
        searchField: "name",
        filterFields: ["role", "profileDiscoverable"],
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
    }).index("by_token_hash", ["tokenHash"]).index("by_user_created", ["userId", "createdAt"]),

    staffOtpLoginAttempts: defineTable({
      email: v.string(),
      windowAt: v.number(),
      attempts: v.number(),
    }).index("by_email", ["email"]),

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
