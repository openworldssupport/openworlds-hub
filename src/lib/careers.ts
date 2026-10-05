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

/** No approved public openings have been provided yet. Add verified openings here. */
export const careerBranches: CareerBranch[] = [];

export const careerRoles: (CareerRole & { branch: CareerBranch })[] = [];
