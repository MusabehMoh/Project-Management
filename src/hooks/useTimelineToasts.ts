/**
 * Example hook showing how to integrate toast messages with timeline operations
 * This demonstrates proper usage of the translation keys added to LanguageContext.tsx
 */

import { useLanguage } from "@/contexts/LanguageContext";
import { createTimelineToasts, createGeneralToasts } from "@/utils/toast";

export const useTimelineToasts = () => {
  const { t } = useLanguage();

  // Create toast helper functions with current language translations
  const timelineToasts = createTimelineToasts(t);
  const generalToasts = createGeneralToasts(t);

  return {
    // Timeline operations
    onTimelineCreateSuccess: () => timelineToasts.timelineCreated(),
    onTimelineCreateError: () => timelineToasts.timelineCreateError(),
    onTimelineUpdateSuccess: () => timelineToasts.timelineUpdated(),
    onTimelineUpdateError: () => timelineToasts.timelineUpdateError(),
    onTimelineDeleteSuccess: () => timelineToasts.timelineDeleted(),
    onTimelineDeleteError: () => timelineToasts.timelineDeleteError(),

    // Sprint operations
    onSprintCreateSuccess: () => timelineToasts.sprintCreated(),
    onSprintCreateError: () => timelineToasts.sprintCreateError(),
    onSprintUpdateSuccess: () => timelineToasts.sprintUpdated(),
    onSprintUpdateError: () => timelineToasts.sprintUpdateError(),
    onSprintDeleteSuccess: () => timelineToasts.sprintDeleted(),
    onSprintDeleteError: () => timelineToasts.sprintDeleteError(),

    // Requirement operations
    onRequirementCreateSuccess: () => timelineToasts.requirementCreated(),
    onRequirementCreateError: () => timelineToasts.requirementCreateError(),
    onRequirementUpdateSuccess: () => timelineToasts.requirementUpdated(),
    onRequirementUpdateError: () => timelineToasts.requirementUpdateError(),
    onRequirementDeleteSuccess: () => timelineToasts.requirementDeleted(),
    onRequirementDeleteError: () => timelineToasts.requirementDeleteError(),

    // Task operations
    onTaskCreateSuccess: () => timelineToasts.taskCreated(),
    onTaskCreateError: () => timelineToasts.taskCreateError(),
    onTaskUpdateSuccess: () => timelineToasts.taskUpdated(),
    onTaskUpdateError: () => timelineToasts.taskUpdateError(),
    onTaskDeleteSuccess: () => timelineToasts.taskDeleted(),
    onTaskDeleteError: () => timelineToasts.taskDeleteError(),

    // Subtask operations
    onSubtaskCreateSuccess: () => timelineToasts.subtaskCreated(),
    onSubtaskCreateError: () => timelineToasts.subtaskCreateError(),
    onSubtaskUpdateSuccess: () => timelineToasts.subtaskUpdated(),
    onSubtaskUpdateError: () => timelineToasts.subtaskUpdateError(),
    onSubtaskDeleteSuccess: () => timelineToasts.subtaskDeleted(),
    onSubtaskDeleteError: () => timelineToasts.subtaskDeleteError(),

    // General operations
    onCreateSuccess: () => generalToasts.createSuccess(),
    onCreateError: () => generalToasts.createError(),
    onUpdateSuccess: () => generalToasts.updateSuccess(),
    onUpdateError: () => generalToasts.updateError(),
    onDeleteSuccess: () => generalToasts.deleteSuccess(),
    onDeleteError: () => generalToasts.deleteError(),
    onSaveSuccess: () => generalToasts.saveSuccess(),
    onSaveError: () => generalToasts.saveError(),
  };
};

/**
 * Example usage in TimelineItemCreateModal:
 *
 * ```tsx
 * import { useTimelineToasts } from "@/hooks/useTimelineToasts";
 *
 * export default function TimelineItemCreateModal({ type, onSubmit, ... }) {
 *   const toasts = useTimelineToasts();
 *
 *   const handleSubmit = async () => {
 *     try {
 *       await onSubmit(payload);
 *
 *       // Show success toast based on type
 *       switch (type) {
 *         case "sprint":
 *           toasts.onSprintCreateSuccess();
 *           break;
 *         case "requirement":
 *           toasts.onRequirementCreateSuccess();
 *           break;
 *         case "task":
 *           toasts.onTaskCreateSuccess();
 *           break;
 *         case "subtask":
 *           toasts.onSubtaskCreateSuccess();
 *           break;
 *         default:
 *           toasts.onCreateSuccess();
 *       }
 *
 *       onClose();
 *     } catch (error) {
 *       // Show error toast based on type
 *       switch (type) {
 *         case "sprint":
 *           toasts.onSprintCreateError();
 *           break;
 *         case "requirement":
 *           toasts.onRequirementCreateError();
 *           break;
 *         case "task":
 *           toasts.onTaskCreateError();
 *           break;
 *         case "subtask":
 *           toasts.onSubtaskCreateError();
 *           break;
 *         default:
 *           toasts.onCreateError();
 *       }
 *     }
 *   };
 * }
 * ```
 */

/**
 * Example usage in TimelineEditModal:
 *
 * ```tsx
 * import { useTimelineToasts } from "@/hooks/useTimelineToasts";
 *
 * export default function TimelineEditModal({ type, onSubmit, ... }) {
 *   const toasts = useTimelineToasts();
 *
 *   const handleSubmit = async () => {
 *     try {
 *       await onSubmit(payload);
 *
 *       // Show success toast based on type
 *       switch (type) {
 *         case "timeline":
 *           toasts.onTimelineUpdateSuccess();
 *           break;
 *         case "sprint":
 *           toasts.onSprintUpdateSuccess();
 *           break;
 *         case "requirement":
 *           toasts.onRequirementUpdateSuccess();
 *           break;
 *         case "task":
 *           toasts.onTaskUpdateSuccess();
 *           break;
 *         case "subtask":
 *           toasts.onSubtaskUpdateSuccess();
 *           break;
 *       }
 *
 *       onClose();
 *     } catch (error) {
 *       // Show error toast based on type
 *       switch (type) {
 *         case "timeline":
 *           toasts.onTimelineUpdateError();
 *           break;
 *         case "sprint":
 *           toasts.onSprintUpdateError();
 *           break;
 *         case "requirement":
 *           toasts.onRequirementUpdateError();
 *           break;
 *         case "task":
 *           toasts.onTaskUpdateError();
 *           break;
 *         case "subtask":
 *           toasts.onSubtaskUpdateError();
 *           break;
 *       }
 *     }
 *   };
 * }
 * ```
 */

/**
 * Example for delete operations:
 *
 * ```tsx
 * const handleDelete = async (id: string, type: string) => {
 *   try {
 *     await deleteTimelineItem(id, type);
 *
 *     switch (type) {
 *       case "timeline":
 *         toasts.onTimelineDeleteSuccess();
 *         break;
 *       case "sprint":
 *         toasts.onSprintDeleteSuccess();
 *         break;
 *       case "requirement":
 *         toasts.onRequirementDeleteSuccess();
 *         break;
 *       case "task":
 *         toasts.onTaskDeleteSuccess();
 *         break;
 *       case "subtask":
 *         toasts.onSubtaskDeleteSuccess();
 *         break;
 *     }
 *   } catch (error) {
 *     switch (type) {
 *       case "timeline":
 *         toasts.onTimelineDeleteError();
 *         break;
 *       case "sprint":
 *         toasts.onSprintDeleteError();
 *         break;
 *       case "requirement":
 *         toasts.onRequirementDeleteError();
 *         break;
 *       case "task":
 *         toasts.onTaskDeleteError();
 *         break;
 *       case "subtask":
 *         toasts.onSubtaskDeleteError();
 *         break;
 *     }
 *   }
 * };
 * ```
 */
