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

      // Company org data, assigned from the admin panel. A user with a
      // department and/or position is treated as staff and can use /staff.
      department: v.optional(v.string()),
      position: v.optional(v.string()),
      // What the public website shows for this person: "Staff" or "Dev".
      // When unset, the badge is derived from department/position.
      publicBadge: v.optional(v.union(v.literal("staff"), v.literal("dev"))),
      // Granted after a verified OTP for an invited, approved, or assigned staff account.
      staffAccess: v.optional(v.boolean()),
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
    }).index("email", ["email"]), // index for the email. do not remove or modify

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

    careerRoleAvailability: defineTable({
      roleSlug: v.string(),
      isOpen: v.boolean(),
      updatedAt: v.number(),
    }).index("by_role_slug", ["roleSlug"]),

    careerApplications: defineTable({
      roleSlug: v.string(),
      roleTitle: v.string(),
      fullName: v.string(),
      email: v.string(),
      experience: v.string(),
      motivation: v.string(),
      roleApproach: v.string(),
      collaboration: v.string(),
      availability: v.string(),
      portfolio: v.string(),
      strategyScenario: v.optional(v.string()),
      successMeasures: v.optional(v.string()),
      decisionMaking: v.optional(v.string()),
      stakeholderCommunication: v.optional(v.string()),
      toolsAndStrengths: v.optional(v.string()),
      weeklyHours: v.optional(v.string()),
      timeZone: v.optional(v.string()),
      availabilityStart: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      voluntaryConsent: v.boolean(),
      status: v.string(),
      submittedAt: v.number(),
    })
      .index("by_submitted_at", ["submittedAt"])
      .index("by_role_slug", ["roleSlug"])
      .index("by_role_email_submitted_at", ["roleSlug", "email", "submittedAt"])
      .index("by_email", ["email"])
      .index("by_email_status", ["email", "status"]),

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
