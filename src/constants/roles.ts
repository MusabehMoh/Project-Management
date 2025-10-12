/**
 * Role IDs and names for the Project Management Application
 */
export enum RoleIds {
  ADMINISTRATOR = 1,
  ANALYST_DEPARTMENT_MANAGER = 2,
  ANALYST = 3,
  DEVELOPMENT_MANAGER = 4,
  SOFTWARE_DEVELOPER = 5,
  QUALITY_CONTROL_MANAGER = 6,
  QUALITY_CONTROL_TEAM_MEMBER = 7,
  DESIGNER_MANAGER = 8,
  DESIGNER_TEAM_MEMBER = 9,
}

/**
 * Role names corresponding to IDs
 */
export const RoleNames = {
  [RoleIds.ADMINISTRATOR]: "Administrator",
  [RoleIds.ANALYST_DEPARTMENT_MANAGER]: "Analyst Department Manager",
  [RoleIds.ANALYST]: "Analyst",
  [RoleIds.DEVELOPMENT_MANAGER]: "Development Manager",
  [RoleIds.SOFTWARE_DEVELOPER]: "Software Developer",
  [RoleIds.QUALITY_CONTROL_MANAGER]: "Quality Control Manager",
  [RoleIds.QUALITY_CONTROL_TEAM_MEMBER]: "Quality Control Team Member",
  [RoleIds.DESIGNER_MANAGER]: "Designer Manager",
  [RoleIds.DESIGNER_TEAM_MEMBER]: "Designer Team Member",
} as const;

/**
 * Get role name by ID
 */
export const getRoleName = (id: number): string | undefined => {
  return RoleNames[id as RoleIds];
};

/**
 * Get role ID by name
 */
export const getRoleId = (name: string): RoleIds | undefined => {
  const entries = Object.entries(RoleNames) as [string, string][];
  const entry = entries.find(([_, roleName]) => roleName === name);

  return entry ? (parseInt(entry[0]) as RoleIds) : undefined;
};
