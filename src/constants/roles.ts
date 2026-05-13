export enum RoleIds {
  ADMINISTRATOR = 1,
  PROJECT_MANAGER = 2,
}

export const RoleNames = {
  [RoleIds.ADMINISTRATOR]: "Administrator",
  [RoleIds.PROJECT_MANAGER]: "Project Manager",
} as const;

export const getRoleName = (id: number): string | undefined => {
  return RoleNames[id as RoleIds];
};

export const getRoleId = (name: string): RoleIds | undefined => {
  const entries = Object.entries(RoleNames) as [string, string][];
  const entry = entries.find(([_, roleName]) => roleName === name);
  return entry ? (parseInt(entry[0]) as RoleIds) : undefined;
};

export const isAdmin = (roleIds: number[]): boolean =>
  roleIds.includes(RoleIds.ADMINISTRATOR);

export const isProjectManager = (roleIds: number[]): boolean =>
  roleIds.includes(RoleIds.PROJECT_MANAGER);

export const isAdminOrPM = (roleIds: number[]): boolean =>
  isAdmin(roleIds) || isProjectManager(roleIds);
