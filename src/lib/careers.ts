export type RoleStatus = "Open" | "Limited" | "Waitlist" | "Filled" | "Pending";

export interface CareerRole {
  slug: string;
  title: string;
  department: string;
  status: RoleStatus;
  summary: string;
  responsibilities: string[];
  qualifications: string[];
  capacity: number;
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
  capacity = 3,
): CareerRole => ({ slug, title, department, status, summary, responsibilities, qualifications, capacity });

export const careerBranches: CareerBranch[] = [
  {
    slug: "executive",
    title: "Executive Leadership",
    summary: "Strategic governance, senior operational guidance, and long-term platform direction.",
    roles: [
      role("executive-advisory-board", "Executive Strategic & Advisory Board", "Executive Leadership", "Advise leadership on strategy, direction, and the risks worth weighing.", ["Review strategic proposals and give candid, constructive feedback.", "Advise on risks, opportunities, and long-term direction.", "Join periodic advisory reviews with leadership."], ["Experience advising projects, teams, or organizations.", "Willingness to challenge plans constructively.", "Comfortable reviewing written materials before meetings."]),
      role("chief-technical-officer", "Chief Technical Officer (CTO)", "Executive Leadership", "Own the technical direction and long-term health of the platform.", ["Set technical direction and review architecture decisions.", "Keep engineering standards, security, and tooling in good shape.", "Guide and support technical contributors across the project."], ["Experience leading technical work or technical people.", "Sound judgement about trade-offs, risk, and long-term maintenance.", "Can explain technical decisions to non-technical colleagues."], "Open", 1),
      role("chief-operating-officer", "Chief Operating Officer (COO)", "Executive Leadership", "Keep day-to-day work across departments coordinated, supported, and moving.", ["Set and track operating priorities across departments.", "Clear cross-team blockers and keep hand-offs between teams clear.", "Report progress, risks, and open decisions to leadership."], ["Comfortable running several workstreams at once.", "Calm, clear communication when priorities compete.", "Sound judgement about when to escalate a decision."], "Open", 1),
      role("chief-financial-officer", "Chief Financial Officer (CFO)", "Executive Leadership", "Own the project's budgeting, reporting, and financial planning.", ["Build and maintain simple budgets, forecasts, and cost records.", "Track spend, tooling costs, and funding commitments.", "Prepare clear financial summaries for leadership."], ["Comfortable with budgeting and basic accounting.", "Careful, accurate, and clear in writing.", "Can explain financial trade-offs to non-specialists."], "Open", 1),
      role("chief-marketing-officer", "Chief Marketing Officer (CMO)", "Executive Leadership", "Own the project's positioning, messaging, and growth direction.", ["Set marketing direction and messaging across channels.", "Coordinate campaigns with community and content contributors.", "Review what works and adjust plans based on results."], ["Experience with marketing, branding, or audience growth.", "Clear writing and good judgement about tone.", "Comfortable reviewing results and changing course."], "Open", 1),
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
      role("community-events-coordinator", "Community Events Coordinator", "Community Operations & Player Engagement", "Plan welcoming online activities that give players ways to meet, create, and explore together.", ["Organize community events and coordinate the details with relevant contributors.", "Share clear event schedules, participation guidance, and follow-up updates.", "Gather feedback after events and suggest practical improvements."], ["Enjoys planning activities and keeping details organized.", "Clear, friendly communication with different kinds of players.", "Can adapt plans when attendance or circumstances change."]),
      role("player-feedback-coordinator", "Player Feedback Coordinator", "Community Operations & Player Engagement", "Help the team understand player ideas, concerns, and recurring community themes.", ["Collect and organize feedback from approved community channels.", "Summarize recurring themes without exposing private or sensitive information.", "Share clear, balanced reports with the relevant project contributors."], ["Good listening and concise written communication.", "Able to distinguish recurring themes from individual opinions.", "Handles private information carefully and respectfully."]),
    ],
  },
  {
    slug: "safety",
    title: "Faction",
    summary: "Moderator positions for keeping OpenWorlds community spaces welcoming, fair, and safe.",
    roles: [
      role("community-moderator", "Community Moderator", "Faction", "Help keep official community spaces welcoming by applying published guidelines consistently.", ["Monitor assigned community spaces and respond to rule violations.", "Explain moderation actions calmly and escalate serious concerns through the right channels.", "Keep appropriate records and protect member privacy."], ["Calm, fair judgement when conversations become difficult.", "Comfortable following written guidelines consistently.", "Reliable, respectful communication and good discretion."], "Open", 5),
      role("trust-safety-analyst", "Trust & Safety Moderator", "Faction", "Help keep communities safe by handling reports and shaping clear moderation standards.", ["Review reports and escalations carefully and consistently.", "Document moderation decisions and update guidelines.", "Flag recurring problems to the community team."], ["Sound judgement and calm, fair communication.", "Comfortable applying written rules consistently.", "Able to handle sensitive material professionally."], "Open", 3),
      role("player-reports-moderator", "Player Reports Moderator", "Faction", "Review player reports and help make fair, consistent decisions based on the community guidelines.", ["Review incoming player reports and identify the relevant guideline.", "Record clear, factual summaries and moderation outcomes.", "Escalate urgent or complex reports to the trust and safety team."], ["Careful reading and clear written communication.", "Fair judgement and respect for the privacy of everyone involved.", "Able to follow review procedures consistently."], "Open", 4),
      role("moderation-appeals-reviewer", "Moderation Appeals Reviewer", "Faction", "Independently review moderation appeals and help ensure decisions are consistent and well explained.", ["Review appeals against existing moderation decisions.", "Consider the available context and document a reasoned outcome.", "Escalate sensitive or high-impact cases to the appropriate lead."], ["Impartial, patient decision-making.", "Strong written communication and attention to detail.", "Able to handle sensitive information discreetly."], "Open", 2),
      role("community-safety-coordinator", "Community Safety Coordinator", "Faction", "Coordinate moderator coverage and help improve day-to-day community safety practices.", ["Help organize moderator coverage across official community spaces.", "Share guideline updates and consistent moderation practices with the team.", "Identify recurring safety concerns and raise them with project leadership."], ["Experience supporting or coordinating an online community.", "Organized, calm communication and dependable follow-through.", "Good judgement about when to escalate a concern."], "Open", 2),
    ],
  },
  {
    slug: "support",
    title: "Player Support & Service",
    summary: "Help players get unstuck, answer account and technical questions, and keep support replies clear and quick.",
    roles: [
      role("player-support-specialist", "Player Support Specialist", "Player Support & Service", "Answer player questions and help resolve everyday problems with the game and website.", ["Reply to player messages and support tickets in a clear, friendly tone.", "Follow published procedures for common account, access, and technical questions.", "Record recurring issues so the team can fix them at the source."], ["Clear, patient written communication.", "Comfortable following written procedures consistently.", "Interest in games and online communities."]),
      role("technical-support-specialist", "Technical Support Specialist", "Player Support & Service", "Work through installation, performance, and connectivity problems with players.", ["Troubleshoot installation, performance, and connection issues with players.", "Ask useful questions and gather the details developers need to reproduce a problem.", "Keep troubleshooting notes current so answers stay consistent."], ["Comfortable troubleshooting Windows and basic networking.", "Able to explain technical steps to non-technical players.", "Patient, methodical approach to diagnosing problems."]),
      role("support-escalations-coordinator", "Support Escalations Coordinator", "Player Support & Service", "Take on difficult or high-impact support cases and keep response times on track.", ["Take on complex or high-impact cases from the wider support team.", "Keep response and resolution times visible to the support lead.", "Pass clear, factual summaries to the relevant team when a case needs them."], ["Calm judgement when a case is urgent or unclear.", "Organized tracking of open cases and follow-ups.", "Discreet handling of private player information."], "Open", 1),
    ],
  },
  {
    slug: "quality",
    title: "Quality Assurance & Release Testing",
    summary: "Test builds before release, report reproducible problems, and help updates ship without surprises.",
    roles: [
      role("quality-assurance-tester", "Quality Assurance Tester", "Quality Assurance & Release Testing", "Play through new builds and report clear, reproducible problems before players see them.", ["Work through new builds against a simple test checklist.", "Report problems with clear steps, expected results, and screenshots where useful.", "Re-test fixes and confirm whether an issue is actually resolved."], ["Careful, methodical attention to detail.", "Clear written reports other contributors can act on.", "Comfortable repeating the same steps to confirm a result."]),
      role("release-readiness-coordinator", "Release Readiness Coordinator", "Quality Assurance & Release Testing", "Keep track of known issues and coordinate the checks that happen before an update.", ["Maintain the list of known issues ahead of an update.", "Coordinate final checks with testers and developers.", "Summarize what is ready, what is delayed, and what needs a decision."], ["Organized tracking of tasks and deadlines.", "Clear summaries that separate facts from guesses.", "Comfortable asking for status updates and following up."]),
    ],
  },
  {
    slug: "data",
    title: "Data Science, Analytics & Research",
    summary: "Platform insight, contributor research, user behavior analysis, and metrics.",
    roles: [
      role("product-data-analyst", "Product Data Analyst", "Data Science, Analytics & Research", "Turn platform usage into clear insights that guide decisions.", ["Build and maintain simple dashboards and reports.", "Analyze usage patterns and share findings.", "Help define metrics that reflect real goals."], ["Comfortable with spreadsheets or SQL-style analysis.", "Clear, honest reporting of what the data shows.", "Interest in games, products, or online communities."]),
      role(
        "analytics-engineer",
        "Analytics Engineer",
        "Data Science, Analytics & Research",
        "Build reliable datasets and reporting models that the rest of the company can trust.",
        ["Turn raw product and community data into clear, documented datasets.", "Maintain reporting models, dashboards, and metric definitions.", "Improve data quality checks and make failures easy to investigate."],
        ["Comfortable with SQL, data modeling, and spreadsheet analysis.", "Careful about definitions, consistency, and documentation.", "Able to explain technical data work to non-specialists."],
      ),
      role(
        "player-insights-researcher",
        "Player Insights Researcher",
        "Data Science, Analytics & Research",
        "Help the team understand player needs, motivations, and friction through thoughtful research.",
        ["Plan short surveys, interviews, and feedback reviews.", "Synthesize findings into clear themes and practical recommendations.", "Separate strong evidence from anecdotes and assumptions."],
        ["Good listening and structured qualitative analysis.", "Clear, balanced writing that preserves context.", "Careful handling of participant privacy."],
      ),
      role(
        "experimentation-analyst",
        "Experimentation Analyst",
        "Data Science, Analytics & Research",
        "Design and evaluate experiments that help the team learn without guessing.",
        ["Help define testable questions, success metrics, and guardrails.", "Review experiment results and flag uncertainty or bias.", "Summarize what changed, what did not, and what to try next."],
        ["Understanding of basic statistics and experiment design.", "Comfortable interpreting results with appropriate caution.", "Clear summaries that separate evidence from interpretation."],
      ),
      role(
        "data-quality-analyst",
        "Data Quality Analyst",
        "Data Science, Analytics & Research",
        "Keep company data accurate, consistent, and safe to use for decisions.",
        ["Audit datasets for missing, duplicated, or inconsistent records.", "Document data sources, assumptions, and known limitations.", "Work with contributors to fix issues at the source."],
        ["Patient, detail-oriented investigation.", "Comfortable with spreadsheets, queries, and validation checks.", "Clear documentation and respectful handling of private data."],
      ),
    ],
  },
  {
    slug: "ai",
    title: "AI & Procedural Systems",
    summary: "Intelligent systems research, automation experimentation, and procedural content.",
    roles: [
      role("procedural-systems-developer", "Procedural Systems Developer", "AI & Procedural Systems", "Build systems that generate and adapt content for worlds.", ["Prototype generation algorithms and tools.", "Test output for variety, quality, and performance.", "Document parameters so others can tune results."], ["Programming experience in at least one modern language.", "Interest in procedural generation, simulation, or automation tooling.", "Careful testing habits."]),
      role(
        "ai-systems-researcher",
        "AI Systems Researcher",
        "AI & Procedural Systems",
        "Explore practical AI approaches and help the team choose what is safe, useful, and maintainable.",
        ["Prototype and compare AI-assisted systems and workflows.", "Evaluate output quality, failure modes, cost, and privacy implications.", "Document findings and recommend a clear next step."],
        ["Understanding of modern AI models and their limitations.", "Comfortable running small, reproducible experiments.", "Thoughtful about safety, attribution, and data handling."],
      ),
      role(
        "machine-learning-engineer",
        "Machine Learning Engineer",
        "AI & Procedural Systems",
        "Turn promising AI experiments into dependable tools with clear boundaries.",
        ["Build and maintain model pipelines and evaluation harnesses.", "Improve reliability, latency, and cost of AI-backed features.", "Document model behavior, inputs, and known failure cases."],
        ["Programming experience with Python or a comparable language.", "Familiarity with model evaluation and data pipelines.", "Values reproducibility, monitoring, and careful rollout."],
      ),
      role(
        "procedural-content-designer",
        "Procedural Content Designer",
        "AI & Procedural Systems",
        "Design generation rules and constraints that produce varied, coherent world content.",
        ["Define parameters, constraints, and quality goals for generated content.", "Review generated results and tune rules for variety and coherence.", "Work with artists and designers to keep output on-theme."],
        ["Strong systems thinking and attention to detail.", "Interest in level design, simulation, or generative content.", "Comfortable iterating from examples and feedback."],
      ),
      role(
        "automation-tools-developer",
        "Automation Tools Developer",
        "AI & Procedural Systems",
        "Build internal tools that reduce repetitive work and help contributors move faster safely.",
        ["Identify repetitive workflows that are worth automating.", "Build small, well-documented tools and integrations.", "Test failure cases and provide clear recovery steps."],
        ["Comfortable writing scripts or small applications.", "Good judgement about reliability, permissions, and maintenance.", "Clear documentation and practical problem-solving."],
      ),
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
      role(
        "social-media-manager",
        "Social Media Manager",
        "Marketing & Growth",
        "Keep OpenWorlds social channels active, consistent, and genuinely useful to players.",
        ["Plan and publish regular updates across approved social channels.", "Respond to comments and route important questions to the right team.", "Track reach, engagement, and community sentiment over time."],
        ["Confident, friendly writing for different platforms.", "Organized scheduling and reliable follow-through.", "Good judgement about tone, spoilers, and sensitive topics."],
      ),
      role(
        "brand-messaging-strategist",
        "Brand & Messaging Strategist",
        "Marketing & Growth",
        "Sharpen how OpenWorlds explains itself so every channel tells a consistent story.",
        ["Maintain clear messaging guidelines and approved descriptions.", "Review public copy for consistency, clarity, and tone.", "Help teams translate product updates into understandable language."],
        ["Strong editorial judgement and concise writing.", "Comfortable giving clear, constructive feedback.", "Interest in games, creator platforms, and online communities."],
      ),
      role(
        "growth-marketing-analyst",
        "Growth Marketing Analyst",
        "Marketing & Growth",
        "Measure what actually brings the right people in and where growth efforts need to change.",
        ["Track campaign and channel performance against clear goals.", "Build simple reports that separate useful signals from noise.", "Recommend practical tests based on observed results."],
        ["Comfortable with analytics tools, spreadsheets, and basic statistics.", "Clear, honest reporting of both wins and weak results.", "Respectful approach to audience data and privacy."],
      ),
      role(
        "marketing-operations-coordinator",
        "Marketing Operations Coordinator",
        "Marketing & Growth",
        "Keep campaigns, content calendars, and marketing hand-offs organized across the team.",
        ["Maintain campaign timelines, owners, and approval checkpoints.", "Coordinate assets and copy between creative, product, and community teams.", "Keep a clear record of what shipped and what is still pending."],
        ["Organized planning and dependable follow-through.", "Clear written updates when priorities or dates change.", "Comfortable coordinating several small workstreams."],
      ),
    ],
  },
  {
    slug: "business",
    title: "Business Development & Strategy",
    summary: "Partnership thinking, platform positioning, business opportunity analysis, and deals.",
    roles: [
      { slug: "business-strategy-associate", title: "Business Strategy Associate", department: "Business Development & Strategy", status: "Filled", capacity: 3, summary: "This contributor position has been filled.", responsibilities: ["Support project planning and prioritization.", "Research audiences, opportunities, and operational needs.", "Help turn strategic goals into practical next steps."], qualifications: ["Clear analysis and structured communication.", "An interest in games, technology, or creator platforms.", "Thoughtful, collaborative decision-making."] },
      role(
        "partnerships-manager",
        "Partnerships Manager",
        "Business Development & Strategy",
        "Build and maintain useful relationships with creators, communities, and platform partners.",
        ["Identify partnership opportunities that fit the project's goals.", "Prepare clear briefs, expectations, and follow-up notes.", "Coordinate hand-offs with legal, marketing, and product contributors."],
        ["Comfortable building relationships and following through.", "Clear written communication and sound judgement.", "Careful about commitments, confidentiality, and conflicts of interest."],
      ),
      role(
        "market-research-analyst",
        "Market Research Analyst",
        "Business Development & Strategy",
        "Research the market, comparable platforms, and player expectations to inform strategy.",
        ["Track competitors, platform changes, and relevant market trends.", "Summarize research into concise, decision-ready findings.", "Separate verified facts from assumptions and open questions."],
        ["Strong research and structured writing skills.", "Comfortable with spreadsheets and source evaluation.", "Curious, balanced, and honest about uncertainty."],
      ),
      role(
        "business-operations-strategist",
        "Business Operations Strategist",
        "Business Development & Strategy",
        "Help turn strategy into repeatable operating plans, ownership, and clear measures of progress.",
        ["Map current workflows and identify practical bottlenecks.", "Propose operating plans with owners, milestones, and success measures.", "Review progress with teams and adjust plans when reality changes."],
        ["Structured thinking and clear process design.", "Comfortable coordinating across departments.", "Sound judgement about prioritization and trade-offs."],
      ),
      role(
        "strategic-initiatives-coordinator",
        "Strategic Initiatives Coordinator",
        "Business Development & Strategy",
        "Keep high-priority cross-team initiatives moving with clear owners and decision points.",
        ["Maintain initiative plans, dependencies, and decision logs.", "Follow up on blockers and keep stakeholders informed.", "Prepare concise status summaries for leadership review."],
        ["Excellent organization and dependable follow-through.", "Clear, neutral communication when priorities compete.", "Comfortable working with sensitive strategic information."],
      ),
    ],
  },
];

export const careerRoles: (CareerRole & { branch: CareerBranch })[] =
  careerBranches.flatMap((branch) =>
    branch.roles
      .filter((item) => item.status !== "Pending")
      .map((item) => ({ ...item, branch })),
  );

export function normalizeCareerPosition(position: string) {
  return position.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function careerPositionAliases(role: CareerRole) {
  const aliases: Record<string, string[]> = {
    "executive-advisory-board": ["executive advisory board", "advisory board"],
    "chief-technical-officer": ["chief technical officer", "chief technology officer", "cto"],
    "chief-operating-officer": ["chief operating officer", "coo"],
    "chief-financial-officer": ["chief financial officer", "chief finance officer", "cfo"],
    "chief-marketing-officer": ["chief marketing officer", "cmo"],
  };
  return [...new Set([role.title, ...(aliases[role.slug] ?? [])].map(normalizeCareerPosition))];
}

// Restored to the original position list from the project's first careers page
// (11 original departments, 16 original positions, no legal roles), with Player Support
// and Quality Assurance added later. Statuses keep the owner's confirmation: every position
// is open except Business Strategy Associate, which is filled.
