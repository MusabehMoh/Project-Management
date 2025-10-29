import TimelineItemModal, {
  TimelineItemModalFormData,
} from "./TimelineItemModal";

export type TimelineEditModalFormData = TimelineItemModalFormData;

interface TimelineEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TimelineEditModalFormData) => Promise<void>;
  type: "timeline" | "sprint" | "requirement" | "task" | "subtask";
  initialValues: TimelineEditModalFormData;
  departments: any[];
  statusOptions: Array<{ id: number; label: string; color: string }>;
  priorityOptions: Array<{ id: number; label: string; color: string }>;
  getProgressColor: (
    progress: number,
  ) =>
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "foreground";
  loading?: boolean;
  timelineId?: number;
}

export default function TimelineEditModal({
  isOpen,
  onClose,
  onSubmit,
  type,
  initialValues,
  departments,
  statusOptions,
  priorityOptions,
  getProgressColor,
  loading = false,
  timelineId,
}: TimelineEditModalProps) {
  return (
    <TimelineItemModal
      departments={departments}
      getProgressColor={getProgressColor}
      initialValues={initialValues}
      isOpen={isOpen}
      loading={loading}
      mode="edit"
      priorityOptions={priorityOptions}
      statusOptions={statusOptions}
      timelineId={timelineId}
      type={type}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
