/**
 * Department IDs and names for the Project Management Application
 */
export enum DepartmentIds {
  SYSTEMS_ANALYSIS = 1,
  SOFTWARE_DEVELOPMENT = 2,
  DESIGN = 3,
  QUALITY_ASSURANCE = 5,
}

/**
 * Department names corresponding to IDs
 */
export const DepartmentNames = {
  [DepartmentIds.SYSTEMS_ANALYSIS]: "Systems Analysis Department",
  [DepartmentIds.SOFTWARE_DEVELOPMENT]: "Software Development Department",
  [DepartmentIds.DESIGN]: "Design Department",
  [DepartmentIds.QUALITY_ASSURANCE]: "Quality Assurance Department",
} as const;

/**
 * Department short names for display
 */
export const DepartmentShortNames = {
  [DepartmentIds.SYSTEMS_ANALYSIS]: "Systems Analysis",
  [DepartmentIds.SOFTWARE_DEVELOPMENT]: "Software Development",
  [DepartmentIds.DESIGN]: "Design",
  [DepartmentIds.QUALITY_ASSURANCE]: "Quality Assurance",
} as const;
