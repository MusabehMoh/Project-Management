// Constants for task statuses matching backend enum
export const TASK_STATUSES = {
  TO_DO: 1,
  IN_PROGRESS: 2,
  IN_REVIEW: 3,
  REWORK: 4,
  COMPLETED: 5,
  BLOCKED: 6,
} as const;

// Type definition for the constants
export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];

// Helper function to get task status text
export const getTaskStatusText = (statusId?: number): string => {
  switch (statusId) {
    case TASK_STATUSES.TO_DO:
      return "task.status.toDo";
    case TASK_STATUSES.IN_PROGRESS:
      return "task.status.inProgress";
    case TASK_STATUSES.IN_REVIEW:
      return "task.status.inReview";
    case TASK_STATUSES.REWORK:
      return "task.status.rework";
    case TASK_STATUSES.COMPLETED:
      return "task.status.completed";
    case TASK_STATUSES.BLOCKED:
      return "task.status.blocked";
    default:
      return "task.status.toDo"; // Default to To Do
  }
};

// Helper function to get task status color
export const getTaskStatusColor = (
  statusId?: number,
): "warning" | "danger" | "primary" | "secondary" | "success" | "default" => {
  switch (statusId) {
    case TASK_STATUSES.TO_DO:
      return "default";
    case TASK_STATUSES.IN_PROGRESS:
      return "primary";
    case TASK_STATUSES.IN_REVIEW:
      return "warning";
    case TASK_STATUSES.REWORK:
      return "danger";
    case TASK_STATUSES.COMPLETED:
      return "success";
    case TASK_STATUSES.BLOCKED:
      return "secondary";
    default:
      return "default";
  }
};
