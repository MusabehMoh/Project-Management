// Constants for mapping between backend enums and frontend display values
// These match the C# enums in the backend

export const REQUIREMENT_PRIORITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
} as const;

export const REQUIREMENT_TYPE = {
  NEW: 1,
  CHANGE_REQUEST: 2,
} as const;

export const REQUIREMENT_STATUS = {
  NEW: 1,
  MANAGER_REVIEW: 2,
  APPROVED: 3,
  UNDER_DEVELOPMENT: 4,
  UNDER_TESTING: 5,
  COMPLETED: 6,
  POSTPONED: 7,
  CANCELLED: 8,
  ReturnedToAnalyst: 9,
  ReturnedToMamager: 10,
} as const;

// Type definitions for the constants
export type RequirementPriority =
  (typeof REQUIREMENT_PRIORITY)[keyof typeof REQUIREMENT_PRIORITY];
export type RequirementType =
  (typeof REQUIREMENT_TYPE)[keyof typeof REQUIREMENT_TYPE];
export type RequirementStatus =
  (typeof REQUIREMENT_STATUS)[keyof typeof REQUIREMENT_STATUS];

// Mapping objects for converting between integers and string keys
export const PRIORITY_MAP = {
  [REQUIREMENT_PRIORITY.LOW]: "low",
  [REQUIREMENT_PRIORITY.MEDIUM]: "medium",
  [REQUIREMENT_PRIORITY.HIGH]: "high",
  [REQUIREMENT_PRIORITY.CRITICAL]: "critical",
} as const;

export const PRIORITY_REVERSE_MAP = {
  low: REQUIREMENT_PRIORITY.LOW,
  medium: REQUIREMENT_PRIORITY.MEDIUM,
  high: REQUIREMENT_PRIORITY.HIGH,
  critical: REQUIREMENT_PRIORITY.CRITICAL,
} as const;

export const TYPE_MAP = {
  [REQUIREMENT_TYPE.NEW]: "new",
  [REQUIREMENT_TYPE.CHANGE_REQUEST]: "change request",
} as const;

export const TYPE_REVERSE_MAP = {
  new: REQUIREMENT_TYPE.NEW,
  "change request": REQUIREMENT_TYPE.CHANGE_REQUEST,
} as const;

export const STATUS_MAP = {
  [REQUIREMENT_STATUS.NEW]: "New",
  [REQUIREMENT_STATUS.MANAGER_REVIEW]: "ManagerReview",
  [REQUIREMENT_STATUS.APPROVED]: "Approved",
  [REQUIREMENT_STATUS.UNDER_DEVELOPMENT]: "UnderDevelopment",
  [REQUIREMENT_STATUS.UNDER_TESTING]: "UnderTesting",
  [REQUIREMENT_STATUS.COMPLETED]: "Completed",
} as const;

export const STATUS_REVERSE_MAP = {
  new: REQUIREMENT_STATUS.NEW,
  "manager-review": REQUIREMENT_STATUS.MANAGER_REVIEW,
  approved: REQUIREMENT_STATUS.APPROVED,
  "under-development": REQUIREMENT_STATUS.UNDER_DEVELOPMENT,
  "under-testing": REQUIREMENT_STATUS.UNDER_TESTING,
  completed: REQUIREMENT_STATUS.COMPLETED,
  // Also support the backend enum names for compatibility
  New: REQUIREMENT_STATUS.NEW,
  ManagerReview: REQUIREMENT_STATUS.MANAGER_REVIEW,
  Approved: REQUIREMENT_STATUS.APPROVED,
  UnderDevelopment: REQUIREMENT_STATUS.UNDER_DEVELOPMENT,
  UnderTesting: REQUIREMENT_STATUS.UNDER_TESTING,
  Completed: REQUIREMENT_STATUS.COMPLETED,
} as const;

// Utility functions for conversions
export const convertPriorityToInt = (
  priority: keyof typeof PRIORITY_REVERSE_MAP,
): number => {
  return PRIORITY_REVERSE_MAP[priority];
};

export const convertPriorityToString = (
  priority: number,
): "low" | "medium" | "high" | "critical" => {
  const result = PRIORITY_MAP[priority as keyof typeof PRIORITY_MAP];

  if (!result) return "medium";

  return result as "low" | "medium" | "high" | "critical";
};

export const convertTypeToInt = (
  type: keyof typeof TYPE_REVERSE_MAP,
): number => {
  return TYPE_REVERSE_MAP[type];
};

export const convertTypeToString = (type: number): "new" | "change request" => {
  const result = TYPE_MAP[type as keyof typeof TYPE_MAP];

  if (!result) return "new";

  return result as "new" | "change request";
};

export const convertStatusToInt = (
  status: keyof typeof STATUS_REVERSE_MAP,
): number => {
  return STATUS_REVERSE_MAP[status];
};

export const convertStatusToString = (status: number): string => {
  return STATUS_MAP[status as keyof typeof STATUS_MAP] || "New";
};

export const convertStatusToBackendEnum = (status: string): string => {
  // Convert frontend filter strings to backend enum names
  const statusMap: Record<string, string> = {
    new: "New",
    "under-study": "UnderStudy",
    "under-development": "UnderDevelopment",
    "under-testing": "UnderTesting",
    completed: "Completed",
    approved: "Approved",
  };

  return statusMap[status] || status;
};
