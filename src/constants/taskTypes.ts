// Constants for task types matching backend enum
export const TASK_TYPES = {
  TIMELINE: 1,
  CHANGE_REQUEST: 2,
  ADHOC: 3,
} as const;

// Type definition for the constants
export type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];

// Helper function to get task type text
export const getTaskTypeText = (typeId?: number): string => {
  switch (typeId) {
    case TASK_TYPES.TIMELINE:
      return "task.type.timeline";
    case TASK_TYPES.CHANGE_REQUEST:
      return "task.type.changeRequest";
    case TASK_TYPES.ADHOC:
      return "task.type.adhoc";
    default:
      return "task.type.timeline"; // Default to timeline
  }
};

// Helper function to get task type color
export const getTaskTypeColor = (
  typeId?: number,
): "warning" | "danger" | "primary" | "secondary" | "success" | "default" => {
  switch (typeId) {
    case TASK_TYPES.TIMELINE:
      return "primary";
    case TASK_TYPES.CHANGE_REQUEST:
      return "warning";
    case TASK_TYPES.ADHOC:
      return "secondary";
    default:
      return "default";
  }
};
