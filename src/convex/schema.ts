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
  },
  {
    // Enforce the schema on every write so unknown/typo'd fields cannot be
    // persisted. This is a security and data-integrity safeguard.
    schemaValidation: true,
  },
);

export default schema;
