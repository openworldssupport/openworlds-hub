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
): CareerRole => ({ slug, title, department, status: "Pending", summary, responsibilities, qualifications });

export const careerBranches: CareerBranch[] = [
  {
    slug: "engineering",
    title: "Engineering",
    summary: "Help build reliable tools and experiences for creating and exploring worlds.",
    roles: [
      role("gameplay-systems-developer", "Gameplay & Systems Developer", "Engineering", "Contribute to the systems that make interactive worlds feel responsive and fun.", ["Prototype gameplay systems and interactions.", "Work with designers to turn ideas into maintainable features.", "Test edge cases and document technical decisions."], ["Comfortable programming in at least one modern language.", "Curious about gameplay, simulation, or interactive applications.", "Can explain trade-offs and collaborate asynchronously."]),
      role("web-platform-developer", "Web Platform Developer", "Engineering", "Improve the web tools and services around the OpenWorlds experience.", ["Build and refine responsive product interfaces.", "Help maintain reliable APIs, data flows, and account experiences.", "Review code thoughtfully and improve accessibility."], ["Experience building web applications with JavaScript or TypeScript.", "Familiarity with component-based UI and API-driven apps.", "Values security, usability, and readable code."]),
      role("quality-assurance-tester", "Quality Assurance Tester", "Engineering", "Help us find confusing workflows and hard-to-reproduce issues before players do.", ["Explore new features using clear test scenarios.", "Write useful, reproducible bug reports.", "Retest fixes and look for regressions across devices."], ["Patient, observant, and comfortable describing steps clearly.", "Can test in a consistent and constructive way.", "Prior QA experience is welcome but not required."]),
    ],
  },
  {
    slug: "design",
    title: "Design & Creative",
    summary: "Shape how OpenWorlds looks, feels, and communicates its ideas.",
    roles: [
      role("3d-environment-artist", "3D Environment Artist", "Design & Creative", "Create visual building blocks and environments that make worlds memorable.", ["Develop environment concepts and reusable assets.", "Keep scale, visual clarity, and performance in mind.", "Share work-in-progress and incorporate feedback."], ["Can share examples of 3D or environment work.", "Understands composition, materials, and visual consistency.", "Experience with a 3D tool is useful; a learning mindset matters most."]),
      role("ui-ux-designer", "UI/UX Designer", "Design & Creative", "Make creator and player journeys clear, accessible, and enjoyable.", ["Map user journeys and identify friction.", "Create wireframes, prototypes, or interface specifications.", "Collaborate with engineering and test designs with users."], ["Can explain design decisions and user needs.", "Experience with prototyping or visual design tools.", "Interest in accessible, responsive interfaces."]),
      role("game-experience-designer", "Game Experience Designer", "Design & Creative", "Help shape the activities, rules, and feedback that make a world engaging.", ["Develop and communicate gameplay concepts.", "Think through progression, onboarding, and player feedback.", "Iterate on ideas with art, engineering, and community contributors."], ["Strong written communication and creative problem solving.", "Can turn broad ideas into clear playable concepts.", "Experience designing games or interactive experiences is welcome."]),
    ],
  },
  {
    slug: "community",
    title: "Community & Communications",
    summary: "Help people feel informed, welcome, and heard as the project develops.",
    roles: [
      role("community-coordinator", "Community Coordinator", "Community", "Help create a thoughtful, welcoming community around OpenWorlds.", ["Support community activities and keep conversations constructive.", "Collect feedback and communicate recurring themes to the team.", "Help prepare clear community updates and event information."], ["Friendly, calm communication and sound judgement.", "Comfortable organizing information and following through.", "Experience supporting online communities is a plus."]),
      role("content-communications-writer", "Content & Communications Writer", "Community", "Turn project progress into clear, accurate updates for players and creators.", ["Draft news posts, guides, and project announcements.", "Check facts and coordinate reviews with subject-matter contributors.", "Adapt tone and format for different audiences."], ["Strong writing and editing skills.", "Can make technical or creative topics easy to understand.", "Reliable with review feedback and deadlines."]),
    ],
  },
  {
    slug: "marketing",
    title: "Marketing & Partnerships",
    summary: "Help the right people discover the project through honest, useful communication.",
    roles: [
      role("marketing-social-coordinator", "Marketing & Social Coordinator", "Marketing", "Help plan a consistent and transparent presence across project channels.", ["Plan and draft channel-appropriate updates.", "Coordinate visuals and publishing calendars with the team.", "Review engagement to learn what information is useful."], ["Good short-form writing and organization.", "Understands respectful, non-spammy community outreach.", "Can work from confirmed facts and flag uncertainty."]),
      role("partnerships-research-associate", "Partnerships Research Associate", "Marketing", "Research potential collaborators and help the team prepare thoughtful outreach.", ["Research organizations, creators, and aligned projects.", "Keep concise records of fit, context, and follow-up.", "Help prepare clear, professional partnership materials."], ["Strong research, writing, and follow-through.", "Comfortable evaluating alignment and communicating respectfully.", "Interest in games, creator tools, or digital communities."]),
    ],
  },
  {
    slug: "business-strategy",
    title: "Business Strategy",
    summary: "Help the team make careful, evidence-led plans for a sustainable project.",
    roles: [
      { slug: "business-strategy-associate", title: "Business Strategy Associate", department: "Business Strategy", status: "Filled", summary: "This contributor position has been filled.", responsibilities: ["Support project planning and prioritization.", "Research audiences, opportunities, and operational needs.", "Help turn strategic goals into practical next steps."], qualifications: ["Clear analysis and structured communication.", "An interest in games, technology, or creator platforms.", "Thoughtful, collaborative decision-making."] },
    ],
  },
];

export const careerRoles: (CareerRole & { branch: CareerBranch })[] =
  careerBranches.flatMap((branch) => branch.roles.map((item) => ({ ...item, branch })));
