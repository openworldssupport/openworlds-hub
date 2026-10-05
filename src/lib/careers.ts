export type RoleStatus = "Open" | "Limited" | "Waitlist" | "Filled";

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

const businessStrategyAssociate: CareerRole = {
  slug: "business-strategy-associate",
  title: "Business Strategy Associate",
  department: "Business Strategy",
  status: "Filled",
};

const businessStrategyBranch: CareerBranch = {
  slug: "business-strategy",
  title: "Business Strategy",
  summary: "Business Strategy role listing.",
  roles: [businessStrategyAssociate],
};

/** Only the role and status explicitly confirmed by the team are listed here. */
export const careerBranches: CareerBranch[] = [businessStrategyBranch];

export const careerRoles: (CareerRole & { branch: CareerBranch })[] =
  careerBranches.flatMap((branch) => branch.roles.map((role) => ({ ...role, branch })));
