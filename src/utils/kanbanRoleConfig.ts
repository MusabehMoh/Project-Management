import { RoleIds } from "@/constants/roles";

/**
 * Configuration for role-based Kanban board permissions
 * Defines which status transitions are allowed for each role
 */

export interface KanbanRoleConfig {
  roleId: RoleIds;
  allowedStatuses: number[]; // Statuses this role can view/interact with
  allowedTransitions: {
    from: number[];
    to: number[];
  };
  canDragFrom: (statusId: number) => boolean;
  canDropTo: (statusId: number, fromStatusId: number) => boolean;
}

/**
 * Software Developer Configuration
 * Can work with: To Do (1), In Progress (2), In Review (3)
 * Workflow: To Do → In Progress → In Review
 */
const SOFTWARE_DEVELOPER_CONFIG: KanbanRoleConfig = {
  roleId: RoleIds.SOFTWARE_DEVELOPER,
  allowedStatuses: [1, 2, 3], // To Do, In Progress, In Review
  allowedTransitions: {
    from: [1, 2, 3],
    to: [1, 2, 3],
  },
  canDragFrom: (statusId: number) => {
    return [1, 2, 3].includes(statusId);
  },
  canDropTo: (statusId: number, fromStatusId: number) => {
    // Can move between To Do, In Progress, and In Review
    const allowedStatuses = [1, 2, 3];

    return (
      allowedStatuses.includes(statusId) &&
      allowedStatuses.includes(fromStatusId)
    );
  },
};

/**
 * Quality Control Team Member Configuration
 * Can work with: In Review (3), Rework (4), Completed (5)
 * Workflow: In Review → Rework (if issues found) or Completed (if passed)
 */
const QC_TEAM_MEMBER_CONFIG: KanbanRoleConfig = {
  roleId: RoleIds.QUALITY_CONTROL_TEAM_MEMBER,
  allowedStatuses: [3, 4, 5], // In Review, Rework, Completed
  allowedTransitions: {
    from: [3, 4],
    to: [4, 5],
  },
  canDragFrom: (statusId: number) => {
    return [3, 4].includes(statusId);
  },
  canDropTo: (statusId: number, fromStatusId: number) => {
    // From In Review: can move to Rework or Completed
    if (fromStatusId === 3) {
      return [4, 5].includes(statusId);
    }
    // From Rework: can move back to In Review or Completed
    if (fromStatusId === 4) {
      return [3, 5].includes(statusId);
    }

    return false;
  },
};

/**
 * Analyst Configuration
 * Can work with: To Do (1), In Progress (2), Completed (5)
 * ONLY for adhoc tasks (typeId = 3)
 * Workflow: To Do ↔ In Progress ↔ Completed (bidirectional for adhoc tasks)
 * Special: Can drag completed tasks back to In Progress or To Do
 */
const ANALYST_CONFIG: KanbanRoleConfig = {
  roleId: RoleIds.ANALYST,
  allowedStatuses: [1, 2, 5], // To Do, In Progress, Completed (no In Review or Rework)
  allowedTransitions: {
    from: [1, 2, 5], // Can drag from any of these statuses
    to: [1, 2, 5], // Can drop to any of these statuses
  },
  canDragFrom: (statusId: number) => {
    // Can drag from To Do, In Progress, AND Completed
    return [1, 2, 5].includes(statusId);
  },
  canDropTo: (statusId: number, fromStatusId: number) => {
    // Can drop to To Do, In Progress, or Completed from any allowed status
    const allowedStatuses = [1, 2, 5];

    return (
      allowedStatuses.includes(statusId) &&
      allowedStatuses.includes(fromStatusId)
    );
  },
};

/**
 * Designer Team Member Configuration
 * Can work with: To Do (1), In Progress (2)
 * Can view: Completed (5) - but cannot drag to it
 * Restricted workflow for design tasks - cannot move to In Review or Completed
 */
const DESIGNER_TEAM_MEMBER_CONFIG: KanbanRoleConfig = {
  roleId: RoleIds.DESIGNER_TEAM_MEMBER,
  allowedStatuses: [1, 2, 5], // To Do, In Progress, and Completed (view only)
  allowedTransitions: {
    from: [1, 2, 5], // Can view tasks from these statuses
    to: [1, 2], // Can only drop to To Do and In Progress
  },
  canDragFrom: (statusId: number) => {
    return [1, 2, 5].includes(statusId);
  },
  canDropTo: (statusId: number, fromStatusId: number) => {
    const allowedStatuses = [1, 2, 5]; // Cannot drop to In Review (3) or Completed (5)

    return (
      allowedStatuses.includes(statusId) &&
      allowedStatuses.includes(fromStatusId)
    );
  },
};

/**
 * Administrator Configuration
 * Full access to all statuses and transitions
 */
const ADMINISTRATOR_CONFIG: KanbanRoleConfig = {
  roleId: RoleIds.ADMINISTRATOR,
  allowedStatuses: [1, 2, 3, 4, 5],
  allowedTransitions: {
    from: [1, 2, 3, 4, 5],
    to: [1, 2, 3, 4, 5],
  },
  canDragFrom: (statusId: number) => {
    return [1, 2, 3, 4, 5].includes(statusId);
  },
  canDropTo: (statusId: number, fromStatusId: number) => {
    return (
      [1, 2, 3, 4, 5].includes(statusId) &&
      [1, 2, 3, 4, 5].includes(fromStatusId)
    );
  },
};

/**
 * Manager Roles Configuration (Development Manager, QC Manager, Designer Manager, Analyst Manager)
 * Full visibility and control over their team's workflow
 */
const MANAGER_CONFIG: KanbanRoleConfig = {
  roleId: RoleIds.DEVELOPMENT_MANAGER, // Placeholder, applies to all manager roles
  allowedStatuses: [1, 2, 3, 4, 5],
  allowedTransitions: {
    from: [1, 2, 3, 4, 5],
    to: [1, 2, 3, 4, 5],
  },
  canDragFrom: (statusId: number) => {
    return [1, 2, 3, 4, 5].includes(statusId);
  },
  canDropTo: (statusId: number, fromStatusId: number) => {
    return (
      [1, 2, 3, 4, 5].includes(statusId) &&
      [1, 2, 3, 4, 5].includes(fromStatusId)
    );
  },
};

/**
 * Role configuration map
 */
const ROLE_CONFIGS: Record<number, KanbanRoleConfig> = {
  [RoleIds.SOFTWARE_DEVELOPER]: SOFTWARE_DEVELOPER_CONFIG,
  [RoleIds.QUALITY_CONTROL_TEAM_MEMBER]: QC_TEAM_MEMBER_CONFIG,
  [RoleIds.ANALYST]: ANALYST_CONFIG,
  [RoleIds.DESIGNER_TEAM_MEMBER]: DESIGNER_TEAM_MEMBER_CONFIG,
  [RoleIds.ADMINISTRATOR]: ADMINISTRATOR_CONFIG,
  [RoleIds.DEVELOPMENT_MANAGER]: MANAGER_CONFIG,
  [RoleIds.QUALITY_CONTROL_MANAGER]: MANAGER_CONFIG,
  [RoleIds.DESIGNER_MANAGER]: MANAGER_CONFIG,
  [RoleIds.ANALYST_DEPARTMENT_MANAGER]: MANAGER_CONFIG,
};

/**
 * Get Kanban configuration for a specific role
 */
export const getKanbanConfigForRole = (
  roleId: number,
): KanbanRoleConfig | null => {
  return ROLE_CONFIGS[roleId] || null;
};

/**
 * Get Kanban configuration for multiple roles
 * Returns the most permissive configuration (union of allowed statuses)
 */
export const getKanbanConfigForRoles = (
  roleIds: number[],
): KanbanRoleConfig => {
  // If user has admin or any manager role, return full access
  const hasAdminOrManager = roleIds.some((id) =>
    [
      RoleIds.ADMINISTRATOR,
      RoleIds.DEVELOPMENT_MANAGER,
      RoleIds.QUALITY_CONTROL_MANAGER,
      RoleIds.DESIGNER_MANAGER,
      RoleIds.ANALYST_DEPARTMENT_MANAGER,
    ].includes(id),
  );

  if (hasAdminOrManager) {
    return MANAGER_CONFIG;
  }

  // Combine permissions from all roles
  const configs = roleIds.map((id) => ROLE_CONFIGS[id]).filter(Boolean);

  if (configs.length === 0) {
    // Default: read-only access (no drag and drop)
    return {
      roleId: roleIds[0] as RoleIds,
      allowedStatuses: [1, 2, 3, 4, 5],
      allowedTransitions: { from: [], to: [] },
      canDragFrom: () => false,
      canDropTo: () => false,
    };
  }

  // Merge all allowed statuses and transitions
  const allowedStatuses = Array.from(
    new Set(configs.flatMap((c) => c.allowedStatuses)),
  ).sort();

  const allowedFromStatuses = Array.from(
    new Set(configs.flatMap((c) => c.allowedTransitions.from)),
  ).sort();

  const allowedToStatuses = Array.from(
    new Set(configs.flatMap((c) => c.allowedTransitions.to)),
  ).sort();

  return {
    roleId: roleIds[0], // Use first role as identifier
    allowedStatuses,
    allowedTransitions: {
      from: allowedFromStatuses,
      to: allowedToStatuses,
    },
    canDragFrom: (statusId: number) => {
      return configs.some((config) => config.canDragFrom(statusId));
    },
    canDropTo: (statusId: number, fromStatusId: number) => {
      return configs.some((config) => config.canDropTo(statusId, fromStatusId));
    },
  };
};

/**
 * Check if a status transition is allowed for given roles
 */
export const isTransitionAllowed = (
  roleIds: number[],
  fromStatusId: number,
  toStatusId: number,
): boolean => {
  const config = getKanbanConfigForRoles(roleIds);

  return config.canDropTo(toStatusId, fromStatusId);
};

/**
 * Check if dragging is allowed from a status for given roles
 */
export const isDragAllowed = (roleIds: number[], statusId: number): boolean => {
  const config = getKanbanConfigForRoles(roleIds);

  return config.canDragFrom(statusId);
};

/**
 * Reason codes for column accessibility
 */
export enum ColumnRestrictionReason {
  NOT_ACCESSIBLE = "notAccessible",
  CANNOT_MODIFY = "cannotModify",
  CANNOT_DRAG_FROM = "cannotDragFrom",
  CANNOT_DROP_TO = "cannotDropTo",
}

/**
 * Get visual indicator for disabled columns
 */
export const getColumnAccessibility = (
  roleIds: number[],
  statusId: number,
): {
  isVisible: boolean;
  isDraggable: boolean;
  isDroppable: boolean;
  reasonCode?: ColumnRestrictionReason;
} => {
  const config = getKanbanConfigForRoles(roleIds);
  const isVisible = config.allowedStatuses.includes(statusId);
  const isDraggable = config.canDragFrom(statusId);
  const isDroppable = config.allowedTransitions.to.includes(statusId);

  let reasonCode: ColumnRestrictionReason | undefined;

  if (!isVisible) {
    reasonCode = ColumnRestrictionReason.NOT_ACCESSIBLE;
  } else if (!isDraggable && !isDroppable) {
    reasonCode = ColumnRestrictionReason.CANNOT_MODIFY;
  } else if (!isDraggable) {
    reasonCode = ColumnRestrictionReason.CANNOT_DRAG_FROM;
  } else if (!isDroppable) {
    reasonCode = ColumnRestrictionReason.CANNOT_DROP_TO;
  }

  return {
    isVisible,
    isDraggable,
    isDroppable,
    reasonCode,
  };
};
