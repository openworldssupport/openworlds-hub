export type RoleStatus = "Open" | "Limited" | "Waitlist" | "Filled" | "Pending";

export interface CareerRole {
  slug: string;
  title: string;
  department: string;
  status: RoleStatus;
  summary: string;
  responsibilities: string[];
  qualifications: string[];
}

export interface CareerBranch {
  slug: string;
  title: string;
  summary: string;
  roles: CareerRole[];
}

const role = (
  slug: string,
  title: string,
  department: string,
  summary: string,
  responsibilities: string[],
  qualifications: string[],
  status: RoleStatus = "Open",
): CareerRole => ({ slug, title, department, status, summary, responsibilities, qualifications });

export const careerBranches: CareerBranch[] = [
  {
    slug: "executive",
    title: "Executive Leadership",
    summary: "Strategic governance, senior operational guidance, and long-term platform direction.",
    roles: [
      role("executive-advisory-board", "Executive Strategic & Advisory Board", "Executive Leadership", "Advise leadership on strategy, direction, and the risks worth weighing.", ["Review strategic proposals and give candid, constructive feedback.", "Advise on risks, opportunities, and long-term direction.", "Join periodic advisory reviews with leadership."], ["Experience advising projects, teams, or organizations.", "Willingness to challenge plans constructively.", "Comfortable reviewing written materials before meetings."]),
      role("chief-technical-officer", "Chief Technical Officer (CTO)", "Executive Leadership", "Own the technical direction and long-term health of the platform.", ["Set technical direction and review architecture decisions.", "Keep engineering standards, security, and tooling in good shape.", "Guide and support technical contributors across the project."], ["Experience leading technical work or technical people.", "Sound judgement about trade-offs, risk, and long-term maintenance.", "Can explain technical decisions to non-technical colleagues."]),
      role("chief-operating-officer", "Chief Operating Officer (COO)", "Executive Leadership", "Keep day-to-day work across departments coordinated, supported, and moving.", ["Set and track operating priorities across departments.", "Clear cross-team blockers and keep hand-offs between teams clear.", "Report progress, risks, and open decisions to leadership."], ["Comfortable running several workstreams at once.", "Calm, clear communication when priorities compete.", "Sound judgement about when to escalate a decision."]),
      role("chief-financial-officer", "Chief Financial Officer (CFO)", "Executive Leadership", "Own the project's budgeting, reporting, and financial planning.", ["Build and maintain simple budgets, forecasts, and cost records.", "Track spend, tooling costs, and funding commitments.", "Prepare clear financial summaries for leadership."], ["Comfortable with budgeting and basic accounting.", "Careful, accurate, and clear in writing.", "Can explain financial trade-offs to non-specialists."]),
      role("chief-marketing-officer", "Chief Marketing Officer (CMO)", "Executive Leadership", "Own the project's positioning, messaging, and growth direction.", ["Set marketing direction and messaging across channels.", "Coordinate campaigns with community and content contributors.", "Review what works and adjust plans based on results."], ["Experience with marketing, branding, or audience growth.", "Clear writing and good judgement about tone.", "Comfortable reviewing results and changing course."]),
    ],
  },
  {
    slug: "engineering",
    title: "Engineering & Software Development",
    summary: "Core systems, web infrastructure, platform services, and technical excellence.",
    roles: [
      role("backend-platform-engineer", "Backend Platform Engineer", "Engineering & Software Development", "Build and maintain the services, data models, and APIs behind the platform.", ["Design and maintain backend services and data models.", "Improve the reliability, performance, and observability of the platform.", "Document interfaces and review changes from other contributors."], ["Experience building backend services or APIs.", "Comfortable with databases, schema design, and debugging.", "Values security, reliability, and clear documentation."]),
      role("frontend-platform-engineer", "Frontend Platform Engineer", "Engineering & Software Development", "Build the interfaces people use to explore worlds, manage accounts, and follow the project.", ["Build and refine responsive product interfaces.", "Keep accessibility, performance, and visual consistency in mind.", "Review code thoughtfully and improve existing features."], ["Experience building web applications with JavaScript or TypeScript.", "Familiarity with component-based UI and API-driven apps.", "Values security, usability, and readable code."]),
    ],
  },
  {
    slug: "design",
    title: "Game Design & Systems Architecture",
    summary: "Gameplay design, platform systems thinking, progression, and experience design.",
    roles: [
      role("systems-designer", "Systems Designer", "Game Design & Systems Architecture", "Design the rules, progression, and platform systems that shape how worlds play.", ["Design and document gameplay and platform systems.", "Turn player feedback into concrete balance changes.", "Work with developers to keep systems understandable and maintainable."], ["Strong systems thinking and clear written communication.", "Interest in game balance, progression, and player motivation.", "Experience designing games or interactive systems is welcome."]),
    ],
  },
  {
    slug: "creative",
    title: "Creative Content & Art Production",
    summary: "Visual identity, assets, environments, UI art, and creative production.",
    roles: [
      role("concept-artist", "Concept Artist", "Creative Content & Art Production", "Explore the visual direction of worlds, characters, and props before production.", ["Produce concept artwork that sets a clear visual direction.", "Keep style, scale, and readability consistent across subjects.", "Share work-in-progress and incorporate feedback."], ["A portfolio of concept or illustration work.", "Understanding of composition, color, and shape.", "Comfortable working to a shared style guide."]),
    ],
  },
  {
    slug: "community-ops",
    title: "Community Operations & Player Engagement",
    summary: "Community health, contributor support, communication, and engagement strategy.",
    roles: [
      role("community-operations-coordinator", "Community Operations Coordinator", "Community Operations & Player Engagement", "Help create a thoughtful, welcoming community around OpenWorlds.", ["Support community activities and keep conversations constructive.", "Collect feedback and communicate recurring themes to the team.", "Help prepare clear community updates and event information."], ["Friendly, calm communication and sound judgement.", "Comfortable organizing information and following through.", "Experience supporting online communities is a plus."]),
    ],
  },
  {
    slug: "safety",
    title: "Trust & Safety / Moderation",
    summary: "Player safety, moderation standards, escalation handling, and healthy community culture.",
    roles: [
      role("trust-safety-analyst", "Trust & Safety Analyst", "Trust & Safety / Moderation", "Help keep communities safe by handling reports and shaping clear moderation standards.", ["Review reports and escalations carefully and consistently.", "Document moderation decisions and update guidelines.", "Flag recurring problems to the community team."], ["Sound judgement and calm, fair communication.", "Comfortable applying written rules consistently.", "Able to handle sensitive material professionally."]),
    ],
  },
  {
    slug: "data",
    title: "Data Science, Analytics & Research",
    summary: "Platform insight, contributor research, user behavior analysis, and metrics.",
    roles: [
      role("product-data-analyst", "Product Data Analyst", "Data Science, Analytics & Research", "Turn platform usage into clear insights that guide decisions.", ["Build and maintain simple dashboards and reports.", "Analyze usage patterns and share findings.", "Help define metrics that reflect real goals."], ["Comfortable with spreadsheets or SQL-style analysis.", "Clear, honest reporting of what the data shows.", "Interest in games, products, or online communities."]),
    ],
  },
  {
    slug: "ai",
    title: "AI & Procedural Systems",
    summary: "Intelligent systems research, automation experimentation, and procedural content.",
    roles: [
      role("procedural-systems-developer", "Procedural Systems Developer", "AI & Procedural Systems", "Build systems that generate and adapt content for worlds.", ["Prototype generation algorithms and tools.", "Test output for variety, quality, and performance.", "Document parameters so others can tune results."], ["Programming experience in at least one modern language.", "Interest in procedural generation, simulation, or automation tooling.", "Careful testing habits."]),
    ],
  },
  {
    slug: "operations",
    title: "Operations & Internal Systems",
    summary: "Internal documentation, contributor workflows, systems organization, and tooling.",
    roles: [
      role("documentation-workflow-specialist", "Documentation & Workflow Specialist", "Operations & Internal Systems", "Keep internal documentation, processes, and contributor workflows clear and up to date.", ["Write and maintain internal documentation and guides.", "Map contributor workflows and remove confusing steps.", "Keep ownership, hand-offs, and checklists current."], ["Clear, structured writing.", "Organized follow-through on details.", "Comfortable asking contributors for the facts."]),
    ],
  },
  {
    slug: "marketing",
    title: "Marketing & Growth",
    summary: "Positioning, content growth, platform storytelling, and audience expansion.",
    roles: [
      role("growth-content-strategist", "Growth Content Strategist", "Marketing & Growth", "Plan content that helps the right people discover the project.", ["Plan and schedule content across channels.", "Turn project milestones into clear public stories.", "Review what performs and adjust the plan."], ["Strong writing and editing skills.", "Comfortable setting and meeting a content calendar.", "Interest in honest, non-spammy growth."]),
    ],
  },
  {
    slug: "business",
    title: "Business Development & Strategy",
    summary: "Partnership thinking, platform positioning, business opportunity analysis, and deals.",
    roles: [
      { slug: "business-strategy-associate", title: "Business Strategy Associate", department: "Business Development & Strategy", status: "Filled", summary: "This contributor position has been filled.", responsibilities: ["Support project planning and prioritization.", "Research audiences, opportunities, and operational needs.", "Help turn strategic goals into practical next steps."], qualifications: ["Clear analysis and structured communication.", "An interest in games, technology, or creator platforms.", "Thoughtful, collaborative decision-making."] },
    ],
  },
];

export const careerRoles: (CareerRole & { branch: CareerBranch })[] =
  careerBranches.flatMap((branch) =>
    branch.roles
      .filter((item) => item.status !== "Pending")
      .map((item) => ({ ...item, branch })),
  );

// Restored to the original position list from the project's first careers page
// (11 original departments, 16 original positions, no legal roles). Statuses keep
// the owner's confirmation: every position is open except Business Strategy Associate, which is filled.
