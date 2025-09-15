import {
  Timeline,
  Sprint,
  Task,
  Subtask,
  Department,
  TimelineFilters,
  CreateSprintRequest,
  CreateTaskRequest,
  CreateSubtaskRequest,
  UpdateSprintRequest,
  UpdateTaskRequest,
  UpdateSubtaskRequest,
} from "@/types/timeline";

interface TimelineGanttViewProps {
  timeline: Timeline;
  onItemSelect: (
    itemId: string,
    itemType: "timeline" | "sprint" | "task" | "subtask",
  ) => void;
  onCreateSprint: (data: CreateSprintRequest) => Promise<Sprint | null>;
  onCreateTask: (data: CreateTaskRequest) => Promise<Task | null>;
  onCreateSubtask: (data: CreateSubtaskRequest) => Promise<Subtask | null>;
  onUpdateSprint: (data: UpdateSprintRequest) => Promise<Sprint | null>;
  onUpdateTask: (data: UpdateTaskRequest) => Promise<Task | null>;
  onUpdateSubtask: (data: UpdateSubtaskRequest) => Promise<Subtask | null>;
  onDeleteSprint: (id: string) => Promise<boolean>;
  onDeleteTask: (id: string) => Promise<boolean>;
  onDeleteSubtask: (id: string) => Promise<boolean>;
  departments: Department[];
  filters: TimelineFilters;
  selectedItem?: string;
  loading?: boolean;
}

export default function TimelineGanttView(_props: TimelineGanttViewProps) {
  // TODO: Implement TimelineGanttView component
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">
          Timeline Gantt View - To be implemented
        </div>
      </div>
    </div>
  );
}
