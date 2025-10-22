/**
 * Toast utility functions for displaying success, error, and other notification messages
 * Uses HeroUI's addToast function for actual toast display
 */

import { addToast } from "@heroui/toast";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Toast implementation using HeroUI's addToast
export const showToast = (toast: ToastMessage) => {
  // Map our toast types to HeroUI colors
  const getColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "danger";
      case "warning":
        return "warning";
      case "info":
        return "primary";
      default:
        return "default";
    }
  };

  addToast({
    title: toast.title,
    description: toast.message,
    color: getColor(toast.type),
    timeout: toast.duration || 4000,
  });
};

// Helper functions for common toast scenarios
export const showSuccessToast = (title: string, message?: string) => {
  showToast({ type: "success", title, message });
};

export const showErrorToast = (title: string, message?: string) => {
  showToast({ type: "error", title, message });
};

export const showWarningToast = (title: string, message?: string) => {
  showToast({ type: "warning", title, message });
};

export const showInfoToast = (title: string, message?: string) => {
  showToast({ type: "info", title, message });
};

// Timeline-specific toast helpers using the translations
export const createTimelineToasts = (t: (key: string) => string) => ({
  // Timeline operations
  timelineCreated: () => showSuccessToast(t("timeline.toast.timelineCreated")),
  timelineCreateError: () =>
    showErrorToast(t("timeline.toast.timelineCreateError")),
  timelineUpdated: () => showSuccessToast(t("timeline.toast.timelineUpdated")),
  timelineUpdateError: () =>
    showErrorToast(t("timeline.toast.timelineUpdateError")),
  timelineDeleted: () => showSuccessToast(t("timeline.toast.timelineDeleted")),
  timelineDeleteError: () =>
    showErrorToast(t("timeline.toast.timelineDeleteError")),

  // Sprint operations
  sprintCreated: () => showSuccessToast(t("timeline.toast.sprintCreated")),
  sprintCreateError: () =>
    showErrorToast(t("timeline.toast.sprintCreateError")),
  sprintUpdated: () => showSuccessToast(t("timeline.toast.sprintUpdated")),
  sprintUpdateError: () =>
    showErrorToast(t("timeline.toast.sprintUpdateError")),
  sprintDeleted: () => showSuccessToast(t("timeline.toast.sprintDeleted")),
  sprintDeleteError: () =>
    showErrorToast(t("timeline.toast.sprintDeleteError")),

  // Requirement operations
  requirementCreated: () =>
    showSuccessToast(t("timeline.toast.requirementCreated")),
  requirementCreateError: () =>
    showErrorToast(t("timeline.toast.requirementCreateError")),
  requirementUpdated: () =>
    showSuccessToast(t("timeline.toast.requirementUpdated")),
  requirementUpdateError: () =>
    showErrorToast(t("timeline.toast.requirementUpdateError")),
  requirementDeleted: () =>
    showSuccessToast(t("timeline.toast.requirementDeleted")),
  requirementDeleteError: () =>
    showErrorToast(t("timeline.toast.requirementDeleteError")),

  // Task operations
  taskCreated: () => showSuccessToast(t("timeline.toast.taskCreated")),
  taskCreateError: () => showErrorToast(t("timeline.toast.taskCreateError")),
  taskUpdated: () => showSuccessToast(t("timeline.toast.taskUpdated")),
  taskUpdateError: () => showErrorToast(t("timeline.toast.taskUpdateError")),
  taskDeleted: () => showSuccessToast(t("timeline.toast.taskDeleted")),
  taskDeleteError: () => showErrorToast(t("timeline.toast.taskDeleteError")),

  // Subtask operations
  subtaskCreated: () => showSuccessToast(t("timeline.toast.subtaskCreated")),
  subtaskCreateError: () =>
    showErrorToast(t("timeline.toast.subtaskCreateError")),
  subtaskUpdated: () => showSuccessToast(t("timeline.toast.subtaskUpdated")),
  subtaskUpdateError: () =>
    showErrorToast(t("timeline.toast.subtaskUpdateError")),
  subtaskDeleted: () => showSuccessToast(t("timeline.toast.subtaskDeleted")),
  subtaskDeleteError: () =>
    showErrorToast(t("timeline.toast.subtaskDeleteError")),
});

// General toast helpers using the translations
export const createGeneralToasts = (t: (key: string) => string) => ({
  createSuccess: () => showSuccessToast(t("toast.createSuccess")),
  createError: (message?: string) => showErrorToast(t("toast.createError"), message),
  updateSuccess: () => showSuccessToast(t("toast.updateSuccess")),
  updateError: (message?: string) => showErrorToast(t("toast.updateError"), message),
  deleteSuccess: () => showSuccessToast(t("toast.deleteSuccess")),
  deleteError: (message?: string) => showErrorToast(t("toast.deleteError"), message),
  saveSuccess: () => showSuccessToast(t("toast.saveSuccess")),
  saveError: () => showErrorToast(t("toast.saveError")),
});
