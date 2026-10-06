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
    slug: "executive-leadership",
    title: "Executive Leadership",
    summary: "Support the priorities, decisions, and coordination that keep the whole project moving.",
    roles: [
      role("chief-of-staff", "Chief of Staff", "Executive Leadership", "Keep leadership priorities organized and turn decisions into tracked work.", ["Coordinate priorities across departments and flag conflicts early.", "Prepare concise briefs and notes for leadership discussions.", "Follow every commitment through from decision to completion."], ["Structured thinking and clear written communication.", "Comfortable coordinating several teams at once.", "Discretion with sensitive internal information."], "Open"),
      role("executive-operations-associate", "Executive Operations Associate", "Executive Leadership", "Handle the records, scheduling, and follow-ups that keep the executive side of the project running.", ["Maintain agendas, meeting notes, and action lists.", "Prepare background research for planning sessions.", "Keep internal documents accurate and up to date."], ["Organized, reliable, and focused on detail.", "Can turn long discussions into clear next steps.", "Interested in how small teams plan and run projects."], "Open"),
    ],
  },
  {
    slug: "engineering",
    title: "Engineering",
    summary: "Help build reliable tools and experiences for creating and exploring worlds.",
    roles: [
      role("gameplay-systems-developer", "Gameplay & Systems Developer", "Engineering", "Contribute to the systems that make interactive worlds feel responsive and fun.", ["Prototype gameplay systems and interactions.", "Work with designers to turn ideas into maintainable features.", "Test edge cases and document technical decisions."], ["Comfortable programming in at least one modern language.", "Curious about gameplay, simulation, or interactive applications.", "Can explain trade-offs and collaborate asynchronously."], "Open"),
      role("web-platform-developer", "Web Platform Developer", "Engineering", "Improve the web tools and services around the OpenWorlds experience.", ["Build and refine responsive product interfaces.", "Help maintain reliable APIs, data flows, and account experiences.", "Review code thoughtfully and improve accessibility."], ["Experience building web applications with JavaScript or TypeScript.", "Familiarity with component-based UI and API-driven apps.", "Values security, usability, and readable code."], "Open"),
      role("quality-assurance-tester", "Quality Assurance Tester", "Engineering", "Help us find confusing workflows and hard-to-reproduce issues before players do.", ["Explore new features using clear test scenarios.", "Write useful, reproducible bug reports.", "Retest fixes and look for regressions across devices."], ["Patient, observant, and comfortable describing steps clearly.", "Can test in a consistent and constructive way.", "Prior QA experience is welcome but not required."], "Open"),
    ],
  },
  {
    slug: "design",
    title: "Design & Creative",
    summary: "Shape how OpenWorlds looks, feels, and communicates its ideas.",
    roles: [
      role("3d-environment-artist", "3D Environment Artist", "Design & Creative", "Create visual building blocks and environments that make worlds memorable.", ["Develop environment concepts and reusable assets.", "Keep scale, visual clarity, and performance in mind.", "Share work-in-progress and incorporate feedback."], ["Can share examples of 3D or environment work.", "Understands composition, materials, and visual consistency.", "Experience with a 3D tool is useful; a learning mindset matters most."], "Open"),
      role("ui-ux-designer", "UI/UX Designer", "Design & Creative", "Make creator and player journeys clear, accessible, and enjoyable.", ["Map user journeys and identify friction.", "Create wireframes, prototypes, or interface specifications.", "Collaborate with engineering and test designs with users."], ["Can explain design decisions and user needs.", "Experience with prototyping or visual design tools.", "Interest in accessible, responsive interfaces."], "Open"),
      role("game-experience-designer", "Game Experience Designer", "Design & Creative", "Help shape the activities, rules, and feedback that make a world engaging.", ["Develop and communicate gameplay concepts.", "Think through progression, onboarding, and player feedback.", "Iterate on ideas with art, engineering, and community contributors."], ["Strong written communication and creative problem solving.", "Can turn broad ideas into clear playable concepts.", "Experience designing games or interactive experiences is welcome."], "Open"),
    ],
  },
  {
    slug: "community",
    title: "Community & Communications",
    summary: "Help people feel informed, welcome, and heard as the project develops.",
    roles: [
      role("community-coordinator", "Community Coordinator", "Community & Communications", "Help create a thoughtful, welcoming community around OpenWorlds.", ["Support community activities and keep conversations constructive.", "Collect feedback and communicate recurring themes to the team.", "Help prepare clear community updates and event information."], ["Friendly, calm communication and sound judgement.", "Comfortable organizing information and following through.", "Experience supporting online communities is a plus."], "Open"),
      role("content-communications-writer", "Content & Communications Writer", "Community & Communications", "Turn project progress into clear, accurate updates for players and creators.", ["Draft news posts, guides, and project announcements.", "Check facts and coordinate reviews with subject-matter contributors.", "Adapt tone and format for different audiences."], ["Strong writing and editing skills.", "Can make technical or creative topics easy to understand.", "Reliable with review feedback and deadlines."], "Open"),
    ],
  },
  {
    slug: "marketing",
    title: "Marketing & Partnerships",
    summary: "Help the right people discover the project through honest, useful communication.",
    roles: [
      role("marketing-social-coordinator", "Marketing & Social Coordinator", "Marketing & Partnerships", "Help plan a consistent and transparent presence across project channels.", ["Plan and draft channel-appropriate updates.", "Coordinate visuals and publishing calendars with the team.", "Review engagement to learn what information is useful."], ["Good short-form writing and organization.", "Understands respectful, non-spammy community outreach.", "Can work from confirmed facts and flag uncertainty."], "Open"),
      role("partnerships-research-associate", "Partnerships Research Associate", "Marketing & Partnerships", "Research potential collaborators and help the team prepare thoughtful outreach.", ["Research organizations, creators, and aligned projects.", "Keep concise records of fit, context, and follow-up.", "Help prepare clear, professional partnership materials."], ["Strong research, writing, and follow-through.", "Comfortable evaluating alignment and communicating respectfully.", "Interest in games, creator tools, or digital communities."], "Open"),
    ],
  },
  {
    slug: "business-strategy",
    title: "Business Strategy",
    summary: "Help the team make careful, evidence-led plans for a sustainable project.",
    roles: [
      { slug: "business-strategy-associate", title: "Business Strategy Associate", department: "Business Strategy", status: "Filled", summary: "This contributor position has been filled.", responsibilities: ["Support project planning and prioritization.", "Research audiences, opportunities, and operational needs.", "Help turn strategic goals into practical next steps."], qualifications: ["Clear analysis and structured communication.", "An interest in games, technology, or creator platforms.", "Thoughtful, collaborative decision-making."] },
      role("project-coordinator", "Project Coordinator", "Business Strategy", "Keep contributor work organized, tracked, and moving forward.", ["Log opportunities and incoming interest for the team.", "Track application progress and send reminders to staff.", "Help coordinate review and follow-up for contributors."], ["Organized, responsive, and comfortable with simple project tools.", "Can summarize applications and keep teams aligned.", "Comfortable tracking commitments and next steps."], "Open"),
      role("content-strategist", "Content Strategist", "Business Strategy", "Tell the project’s story across public updates and contributor materials.", ["Plan and write clear project updates.", "Match messages to the right audience and channel.", "Coordinate feedback and approvals before publishing."], ["Strong writing, editing, and audience awareness.", "Can organize information into clear stories.", "Comfortable working across teams and deadlines."], "Open"),
      role("business-ops-associate", "Business Operations Associate", "Business Strategy", "Support the logistics that keep contributor projects running.", ["Coordinate schedules, tasks, and review follow-ups.", "Prepare concise notes for strategic discussions.", "Help track time, deliverables, and next actions."], ["Comfortable with organizational details and recurring check-ins.", "Can keep records clear and accurate.", "Interest in running projects from start to finish."], "Open"),
    ]
  },
];

export const careerRoles: (CareerRole & { branch: CareerBranch })[] =
  careerBranches.flatMap((branch) =>
    branch.roles
      .filter((item) => item.status !== "Pending")
      .map((item) => ({ ...item, branch })),
  );

// The current opening statuses were confirmed by the project owner:
// all listed positions are open except Business Strategy Associate, which is filled.
// Role descriptions are retained from the existing Careers draft.
