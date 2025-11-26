/**
 * Timeline Item Create Modal
 * Wrapper around the unified TimelineItemModal component for CREATE mode
 * Maintains backward compatibility with existing code
 */

import TimelineItemModal, {
  TimelineItemModalFormData,
} from "./TimelineItemModal";

export type TimelineItemCreateModalFormData = TimelineItemModalFormData;

interface TimelineItemCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TimelineItemCreateModalFormData) => Promise<void>;
  type: "sprint" | "requirement" | "task" | "subtask";
  departments: any[];
  loading?: boolean;
  parentName?: string;
  timelineId?: number;
  initialValues?: Partial<TimelineItemCreateModalFormData>;
}

export default function TimelineItemCreateModal({
  isOpen,
  onClose,
  onSubmit,
  type,
  departments,
  loading = false,
  parentName,
  timelineId,
  initialValues,
}: TimelineItemCreateModalProps) {
  return (
    <TimelineItemModal
      departments={departments}
      initialValues={initialValues as any}
      isOpen={isOpen}
      loading={loading}
      mode="create"
      parentName={parentName}
      timelineId={timelineId}
      type={type as any}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
