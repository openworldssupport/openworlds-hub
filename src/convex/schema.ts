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
    }).index("email", ["email"]), // index for the email. do not remove or modify

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
      voluntaryConsent: v.boolean(),
      status: v.string(),
      submittedAt: v.number(),
    })
      .index("by_submitted_at", ["submittedAt"])
      .index("by_role_slug", ["roleSlug"])
      .index("by_role_email_submitted_at", ["roleSlug", "email", "submittedAt"]),

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
  },
  {
    // Enforce the schema on every write so unknown/typo'd fields cannot be
    // persisted. This is a security and data-integrity safeguard.
    schemaValidation: true,
  },
);

export default schema;
