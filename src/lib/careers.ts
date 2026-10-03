export type RoleStatus = "Open" | "Limited" | "Waitlist";

export interface CareerRole {
  slug: string;
  title: string;
  department: string;
  status: RoleStatus;
}

export interface CareerBranch {
  slug: string;
  title: string;
  summary: string;
  roles: CareerRole[];
}

export const careerBranches: CareerBranch[] = [
  {
    slug: "executive",
    title: "Executive Leadership",
    summary: "Strategic governance, senior operational guidance, and long-term platform direction.",
    roles: [
      { slug: "executive-advisory-board", title: "Executive Strategic & Advisory Board", department: "Executive Leadership", status: "Open" },
      { slug: "chief-technical-officer", title: "Chief Technical Officer (CTO)", department: "Executive Leadership", status: "Open" },
      { slug: "chief-operating-officer", title: "Chief Operating Officer (COO)", department: "Executive Leadership", status: "Open" },
      { slug: "chief-financial-officer", title: "Chief Financial Officer (CFO)", department: "Executive Leadership", status: "Open" },
      { slug: "chief-marketing-officer", title: "Chief Marketing Officer (CMO)", department: "Executive Leadership", status: "Open" },
    ],
  },
  {
    slug: "engineering",
    title: "Engineering & Software Development",
    summary: "Core systems, web infrastructure, platform services, and technical excellence.",
    roles: [
      { slug: "backend-platform-engineer", title: "Backend Platform Engineer", department: "Engineering", status: "Open" },
      { slug: "frontend-platform-engineer", title: "Frontend Platform Engineer", department: "Engineering", status: "Open" },
    ],
  },
  {
    slug: "design",
    title: "Game Design & Systems Architecture",
    summary: "Gameplay design, platform systems thinking, progression, and experience design.",
    roles: [{ slug: "systems-designer", title: "Systems Designer", department: "Game Design", status: "Limited" }],
  },
  {
    slug: "creative",
    title: "Creative Content & Art Production",
    summary: "Visual identity, assets, environments, UI art, and creative production.",
    roles: [{ slug: "concept-artist", title: "Concept Artist", department: "Creative", status: "Limited" }],
  },
  {
    slug: "community-ops",
    title: "Community Operations & Player Engagement",
    summary: "Community health, contributor support, communication, and engagement strategy.",
    roles: [{ slug: "community-operations-coordinator", title: "Community Operations Coordinator", department: "Community Operations", status: "Open" }],
  },
  {
    slug: "safety",
    title: "Trust & Safety / Moderation",
    summary: "Player safety, moderation standards, escalation handling, and healthy community culture.",
    roles: [{ slug: "trust-safety-analyst", title: "Trust & Safety Analyst", department: "Safety", status: "Limited" }],
  },
  {
    slug: "data",
    title: "Data Science, Analytics & Research",
    summary: "Platform insight, contributor research, user behavior analysis, and metrics.",
    roles: [{ slug: "product-data-analyst", title: "Product Data Analyst", department: "Data", status: "Open" }],
  },
  {
    slug: "ai",
    title: "Artificial Intelligence & Procedural Systems",
    summary: "Intelligent systems research, automation experimentation, and procedural content.",
    roles: [{ slug: "procedural-systems-developer", title: "Procedural Systems Developer", department: "AI", status: "Waitlist" }],
  },
  {
    slug: "operations",
    title: "Operations & Internal Systems",
    summary: "Internal documentation, contributor workflows, systems organization, and tooling.",
    roles: [{ slug: "documentation-workflow-specialist", title: "Documentation & Workflow Specialist", department: "Operations", status: "Open" }],
  },
  {
    slug: "marketing",
    title: "Marketing & Growth",
    summary: "Positioning, content growth, platform storytelling, and audience expansion.",
    roles: [{ slug: "growth-content-strategist", title: "Growth Content Strategist", department: "Marketing", status: "Limited" }],
  },
  {
    slug: "business",
    title: "Business Development & Strategy",
    summary: "Partnership thinking, platform positioning, business opportunity analysis, and deals.",
    roles: [{ slug: "business-strategy-associate", title: "Business Strategy Associate", department: "Business", status: "Open" }],
  },
];

export const careerRoles = careerBranches.flatMap((branch) =>
  branch.roles.map((role) => ({ ...role, branch })),
);
