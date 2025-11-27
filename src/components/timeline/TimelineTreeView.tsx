import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";

// (Removed unused imports related to requirements & modal move task feature)
import TimelineEditModal, {
  TimelineEditModalFormData,
} from "./TimelineEditModal";
import TimelineItemCreateModal, {
  TimelineItemCreateModalFormData,
} from "./TimelineItemCreateModal";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTimelineHelpers } from "@/hooks/useTimelineHelpers";
import { useTimelineFormHelpers } from "@/hooks/useTimelineFormHelpers";
import { useTimelineToasts } from "@/hooks/useTimelineToasts";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Timeline,
  Task,
  Subtask,
  Department,
  TimelineFilters,
  CreateTaskRequest,
  CreateSubtaskRequest,
  UpdateTaskRequest,
  UpdateSubtaskRequest,
} from "@/types/timeline";
import { formatDateRange } from "@/utils/dateFormatter";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  EditIcon,
  DeleteIcon,
  MoreVerticalIcon,
  SearchIcon,
  MoveIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@/components/icons";

interface TimelineTreeViewProps {
  timelines: Timeline[]; // Changed from single timeline to array
  onItemSelect: (
    itemId: string,
    itemType: "timeline" | "task" | "subtask",
  ) => void;
  onCreateTask: (data: CreateTaskRequest) => Promise<Task | null>;
  onCreateSubtask?: (data: CreateSubtaskRequest) => Promise<Subtask | null>;
  onUpdateTimeline: (data: any) => Promise<Timeline | null>;
  onUpdateTask: (data: UpdateTaskRequest) => Promise<Task | null>;
  onUpdateSubtask?: (data: UpdateSubtaskRequest) => Promise<Subtask | null>;
  onDeleteTask: (id: string) => Promise<boolean>;
  onDeleteSubtask?: (id: string) => Promise<boolean>;
  onMoveTask?: (id: string, moveDays: number) => Promise<Task | null>;
  departments: Department[];
  filters: TimelineFilters;
  selectedItem?: string;
  loading?: boolean;
  highlightTaskId?: string;
}

export default function TimelineTreeView({
  timelines, // Now receiving array of timelines
  onItemSelect,
  onCreateTask,
  onCreateSubtask,
  onUpdateTimeline,
  onUpdateTask: _onUpdateTask,
  onUpdateSubtask: _onUpdateSubtask,
  onDeleteTask,
  onDeleteSubtask,
  onMoveTask,
  departments,
  filters,
  selectedItem,
  loading = false,
  highlightTaskId,
}: TimelineTreeViewProps) {
  const { t, direction, language } = useLanguage();
  const { hasPermission } = usePermissions();
  const toasts = useTimelineToasts();
  const containerRef = useRef<HTMLDivElement>(null);

  // Track expanded state for all timelines and their children
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const {
    getDepartmentColor,
    getDepartmentName,
    getProgressColor,
    STATUS_OPTIONS,
    PRIORITY_OPTIONS,
  } = useTimelineHelpers(departments);

  // Use shared form helpers for consistent color/name mapping
  const { getStatusColor, getPriorityColor, getStatusName, getPriorityName } =
    useTimelineFormHelpers();

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalType, setEditModalType] = useState<
    "timeline" | "task" | "subtask"
  >("timeline");
  const [editModalInitialValues, setEditModalInitialValues] =
    useState<TimelineEditModalFormData>({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      departmentId: "",
      statusId: 1,
      priorityId: 2,
      progress: 0,
      notes: "",
    });
  const [editingItem, setEditingItem] = useState<any>(null);

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<"task" | "subtask">(
    "task",
  );
  const [createModalParentName, setCreateModalParentName] =
    useState<string>("");
  const [createParentId, setCreateParentId] = useState<string>("");
  const [createModalInitialValues, setCreateModalInitialValues] = useState<
    Partial<TimelineEditModalFormData>
  >({});
  const [quickSearch, setQuickSearch] = useState("");

  // Popover custom move days (quick moves)
  const [popoverCustomDays, setPopoverCustomDays] = useState<string>("");

  // Initialize expanded items when timelines change
  useEffect(() => {
    // Start with all timelines collapsed by default
    setExpandedItems(new Set());
  }, [timelines]);

  const activeScrollRef = useRef<HTMLElement | null>(null);
  const hasAutoSelectedTask = useRef(false);

  // Auto-expand and scroll to highlighted task across all timelines
  useEffect(() => {
    if (
      !highlightTaskId ||
      timelines.length === 0 ||
      hasAutoSelectedTask.current
    )
      return;

    // Find the task in any timeline
    for (const timeline of timelines) {
      const foundTask = (timeline.tasks || []).find(
        (t: Task) => String(t.id) === highlightTaskId,
      );

      if (foundTask) {
        // Mark as auto-selected so it only happens once
        hasAutoSelectedTask.current = true;

        // Get timeline tree ID
        const raw = (timeline as any)?.treeId;
        const timelineTreeId =
          raw != null && raw !== ""
            ? String(raw)
            : `timeline-${String(timeline?.id ?? "0")}`;

        // Expand timeline
        setExpandedItems((prev) => new Set([...prev, timelineTreeId]));

        // Select and scroll to task after a short delay to allow DOM to update
        setTimeout(() => {
          const taskTreeId = foundTask.treeId || `task-${foundTask.id}`;

          onItemSelect(taskTreeId, "task");

          // Scroll to the task element
          setTimeout(() => {
            const taskElement = document.querySelector(
              `[data-tree-id="${taskTreeId}"]`,
            );

            if (taskElement) {
              taskElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 100);
        }, 300);
        break; // Stop after finding the task
      }
    }
  }, [highlightTaskId, timelines, onItemSelect]);

  // Color legend component
  const renderColorLegend = () => (
    <div className="mb-4 p-3 bg-default-50 rounded-lg space-y-3">
      <div>
        <h4 className="text-sm font-medium mb-2 text-default-700">
          {t("timeline.treeView.hierarchyColorLegend")}
        </h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-blue-500 rounded" />
            <span className="text-default-600">
              {t("timeline.treeView.timelineLabel")}
            </span>
          </div>
        
          {/* Removed requirements level from legend */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-purple-500 rounded" />
            <span className="text-default-600">
              {t("timeline.treeView.tasksLabel")}
            </span>
          </div>
        </div>
      </div>
      {/* <div>
        <h4 className="text-sm font-medium mb-2 text-default-700">
          {t("timeline.treeView.progressColorLegend")}
        </h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-red-500 rounded" />
            <span className="text-default-600">
              {t("timeline.treeView.progressCritical")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-blue-500 rounded" />
            <span className="text-default-600">
              {t("timeline.treeView.progressBehind")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-yellow-500 rounded" />
            <span className="text-default-600">
              {t("timeline.treeView.progressOnTrack")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-green-500 rounded" />
            <span className="text-default-600">
              {t("timeline.treeView.progressExcellent")}
            </span>
          </div>
        </div>
      </div> */}
    </div>
  );

  // Filter all timelines based on filters
  const filteredTimelines = useMemo(() => {
    const hasActiveFilters =
      filters.departments.length > 0 ||
      filters.members.length > 0 ||
      filters.status.length > 0 ||
      filters.priority.length > 0;

    // Sort timelines by createdAt (newest first)
    const sortedTimelines = [...timelines].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      return dateB - dateA; // Descending order (newest first)
    });

    if (!hasActiveFilters) {
      return sortedTimelines.map((tl) => ({ ...tl, tasks: tl.tasks || [] }));
    }

    return sortedTimelines
      .map((timeline) => {
        const filteredTasks = (timeline.tasks || [])
          .map((task: Task) => {
            const taskMatches =
              (filters.departments.length === 0 ||
                !task.departmentId ||
                filters.departments.includes(task.departmentId.toString())) &&
              (filters.members.length === 0 ||
                !task.members ||
                task.members.some((m: any) =>
                  filters.members.includes(m.id.toString()),
                )) &&
              (filters.status.length === 0 ||
                filters.status.includes(task.statusId as any)) &&
              (filters.priority.length === 0 ||
                filters.priority.includes(task.priorityId as any));

            const filteredSubtasks = (task.subtasks || []).filter(
              (subtask: Subtask) => {
                return (
                  (filters.departments.length === 0 ||
                    !subtask.departmentId ||
                    filters.departments.includes(
                      subtask.departmentId.toString(),
                    )) &&
                  (filters.members.length === 0 ||
                    !task.members ||
                    task.members.some((m: any) =>
                      filters.members.includes(m.id.toString()),
                    )) &&
                  (filters.status.length === 0 ||
                    filters.status.includes(task.statusId as any)) &&
                  (filters.priority.length === 0 ||
                    filters.priority.includes(task.priorityId as any))
                );
              },
            );

            if (taskMatches || filteredSubtasks.length > 0) {
              return { ...task, subtasks: filteredSubtasks };
            }

            return null;
          })
          .filter(Boolean) as Task[];

        return { ...timeline, tasks: filteredTasks };
      })
      .filter((tl) => (tl.tasks || []).length > 0); // Only show timelines with filtered tasks
  }, [timelines, filters]);

  // (Removed requirement filter helper – no requirement layer now)

  // Helper function to check if a task matches current filters
  const isTaskFiltered = (task: Task) => {
    const hasActiveFilters =
      filters.departments.length > 0 ||
      filters.members.length > 0 ||
      filters.status.length > 0 ||
      filters.priority.length > 0;

    if (!hasActiveFilters) return false;

    return (
      (filters.departments.length === 0 ||
        !task.departmentId ||
        filters.departments.includes(task.departmentId.toString())) &&
      (filters.members.length === 0 ||
        !task.members ||
        task.members.some((m) => filters.members.includes(m.id.toString()))) &&
      (filters.status.length === 0 ||
        filters.status.includes(task.statusId as any)) &&
      (filters.priority.length === 0 ||
        filters.priority.includes(task.priorityId as any))
    );
  };

  // Auto-expand filtered items and scroll to first match
  useEffect(() => {
    const hasActiveFilters =
      filters.departments.length > 0 ||
      filters.members.length > 0 ||
      filters.status.length > 0 ||
      filters.priority.length > 0;

    if (hasActiveFilters && filteredTimelines.length > 0) {
      // Auto-expand all timelines and items that have matching children
      const itemsToExpand = new Set<string>();

      filteredTimelines.forEach((timeline) => {
        const raw = (timeline as any)?.treeId;
        const timelineTreeId =
          raw != null && raw !== ""
            ? String(raw)
            : `timeline-${String(timeline?.id ?? "0")}`;

        itemsToExpand.add(timelineTreeId);

        (timeline.tasks || []).forEach((task: Task) => {
          itemsToExpand.add(task.treeId);
          task.subtasks?.forEach((subtask: Subtask) => {
            itemsToExpand.add(subtask.treeId);
          });
        });
      });

      setExpandedItems(itemsToExpand);

      // Auto-scroll to the first filtered result
      setTimeout(() => {
        // Try to find the first filtered task
        const firstMatch = containerRef.current?.querySelector(
          '[data-filtered="true"]',
        );

        if (firstMatch) {
          firstMatch.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 200); // Increased delay to ensure DOM is updated
    }
  }, [filteredTimelines, filters]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);

    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleOpenEditModal = (
    type: "timeline" | "task" | "subtask",
    item: any,
  ) => {
    debugger;
    setEditModalType(type);
    setEditingItem(item);

    setEditModalInitialValues({
      name: item.name || "",
      description: item.description || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      departmentId: item.departmentId?.toString() || "",
      statusId: item.statusId || 1,
      priorityId: item.priorityId || 2,
      progress: item.progress || 0,
      notes: item.notes || "",
      members: item.assignedMembers || item.members || [],
      memberIds: item.memberIds || [],
      depTasks: item.dependentTasks || item.depTasks || [],
      depTaskIds: item.depTaskIds || [],
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmitEdit = async (formData: TimelineEditModalFormData) => {
    if (!editingItem) return;

    try {
      if (editModalType === "timeline") {
        await onUpdateTimeline({
          id: editingItem.id,
          ...formData,
        });
        toasts.onTimelineUpdateSuccess();
      } else if (editModalType === "task") {
        debugger;
        // Find the timeline that contains this task
        const taskTimeline = timelines.find((tl) =>
          tl.tasks?.some((t) => t.id === editingItem.id),
        );

        await _onUpdateTask({
          id: editingItem.id,
          projectRequirementId: taskTimeline?.projectRequirementId,
          // Use the task's timeline association directly
          timelineId: (
            editingItem.timelineId ??
            taskTimeline?.id ??
            timelines[0]?.id
          ).toString(),
          ...formData,
          statusId: formData.statusId,
          priorityId: formData.priorityId,
        });
        toasts.onTaskUpdateSuccess();
      } else if (editModalType === "subtask" && _onUpdateSubtask) {
        await _onUpdateSubtask({
          id: editingItem.id,
          ...formData,
          statusId: formData.statusId,
          priorityId: formData.priorityId,
        });
        toasts.onSubtaskUpdateSuccess();
      }
    } catch {
      // Show error toast based on type
      switch (editModalType) {
        case "task":
          toasts.onTaskUpdateError();
          break;
        case "subtask":
          toasts.onSubtaskUpdateError();
          break;
        default:
          toasts.onUpdateError();
      }
      throw new Error("Update operation failed"); // Re-throw to let the modal handle it
    }
  };



  const scrollToTask = (taskId: string) => {
    // Find task in any timeline
    for (const timeline of timelines) {
      const task = (timeline.tasks || []).find(
        (t: Task) => t.id.toString() === taskId,
      );

      if (task) {
        const taskTreeId = task.treeId;
        const raw = (timeline as any)?.treeId;
        const timelineTreeId =
          raw != null && raw !== ""
            ? String(raw)
            : `timeline-${String(timeline?.id ?? "0")}`;

        // Expand timeline to show the task
        setExpandedItems((prev) => new Set([...prev, timelineTreeId]));
        setTimeout(() => {
          const element = document.querySelector(`[data-task-id="${taskId}"]`);

          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            onItemSelect(taskTreeId, "task");
          }
        }, 100);
        break;
      }
    }
  };

  // Create a task directly under timeline
  const handleCreateTask = (timeline: Timeline) => {
    setCreateModalType("task");
    setCreateModalParentName(timeline.name);
    setCreateParentId(timeline.id.toString());
    // Pre-fill with timeline data
    setCreateModalInitialValues({
      name: timeline.name,
      startDate: timeline.startDate,
      endDate: timeline.endDate,
    });
    setIsCreateModalOpen(true);
  };

  // Create a subtask under a task
  const handleCreateSubtask = (taskId: string, taskName: string) => {
    setCreateModalType("subtask");
    setCreateModalParentName(taskName);
    setCreateParentId(taskId);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateParentId("");
    setCreateModalParentName("");
    setCreateModalInitialValues({});
  };

  const handleSubmitCreate = async (
    formData: TimelineItemCreateModalFormData,
  ) => {
    try {
      if (createModalType === "task") {
        // Find the timeline that matches createParentId
        const targetTimeline = timelines.find(
          (tl) => tl.id.toString() === createParentId,
        );

        await onCreateTask({
          timelineId: createParentId,
          projectRequirementId: targetTimeline?.projectRequirementId,
          ...formData,
        });

        // Expand timeline to show new task
        if (targetTimeline) {
          const raw = (targetTimeline as any)?.treeId;
          const timelineTreeId =
            raw != null && raw !== ""
              ? String(raw)
              : `timeline-${String(targetTimeline?.id ?? "0")}`;

          setExpandedItems((prev) => new Set(prev).add(timelineTreeId));
        }
        toasts.onTaskCreateSuccess();
      } else if (createModalType === "subtask" && onCreateSubtask) {
        await onCreateSubtask({
          taskId: createParentId,
          ...formData,
        });
        toasts.onSubtaskCreateSuccess();
      }
    } catch {
      // Show error toast based on type
      switch (createModalType) {
        case "task":
          toasts.onTaskCreateError();
          break;
        case "subtask":
          toasts.onSubtaskCreateError();
          break;
        default:
          toasts.onCreateError();
      }
      throw new Error("Create operation failed"); // Re-throw to let the modal handle it
    }
  };

  const handleDelete = async (id: string, type: "task" | "subtask") => {
    if (!confirm(`${t("timeline.treeView.confirmDelete")} ${type}?`)) return;

    try {
      if (type === "task") {
        await onDeleteTask(id);
        toasts.onTaskDeleteSuccess();
      } else if (type === "subtask") {
        if (onDeleteSubtask) {
          await onDeleteSubtask(id);
          toasts.onSubtaskDeleteSuccess();
        }
      }
    } catch {
      // Show error toast based on type
      switch (type) {
        case "task":
          toasts.onTaskDeleteError();
          break;
        case "subtask":
          toasts.onSubtaskDeleteError();
          break;
        default:
          toasts.onDeleteError();
      }
    }
  };

  const handleQuickMoveTask = async (task: Task, moveDays: number) => {
    if (!onMoveTask) return;

    try {
      await onMoveTask(task.id.toString(), moveDays);
    } catch {
      // move failed
    }
  };

  const handlePopoverCustomMove = async (task: Task) => {
    if (!onMoveTask || !popoverCustomDays.trim()) return;

    const days = parseInt(popoverCustomDays, 10);

    if (isNaN(days) || days === 0) return;

    try {
      await onMoveTask(task.id.toString(), days);
      setPopoverCustomDays(""); // Clear input after successful move
    } catch {
      // custom move failed
    }
  };

  // Removed move task between requirements feature – optional future enhancement for moving between sprints

  // Search component
  const renderQuickSearch = () => {
    const q = quickSearch.toLowerCase();

    // Search results grouped by type
    const timelineResults = filteredTimelines.filter(
      (timeline) =>
        timeline.name.toLowerCase().includes(q) ||
        (timeline.description || "").toLowerCase().includes(q),
    );

    const taskResults = filteredTimelines.flatMap((timeline) =>
      (timeline.tasks || [])
        .filter(
          (task: Task) =>
            task.name.toLowerCase().includes(q) ||
            (task.description || "").toLowerCase().includes(q) ||
            (task.subtasks || []).some(
              (st: Subtask) =>
                st.name.toLowerCase().includes(q) ||
                (st.description || "").toLowerCase().includes(q),
            ),
        )
        .map((task: Task) => ({ timeline, task })),
    );

    const scrollToTimeline = (timelineId: number) => {
      const timeline = timelines.find((tl) => tl.id === timelineId);

      if (!timeline) return;

      const raw = (timeline as any)?.treeId;
      const timelineTreeId =
        raw != null && raw !== ""
          ? String(raw)
          : `timeline-${String(timeline?.id ?? "0")}`;

      // Expand timeline and scroll to it
      setExpandedItems((prev) => new Set([...prev, timelineTreeId]));
      setTimeout(() => {
        const element = document.getElementById(`timeline-${timelineId}`);

        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          onItemSelect(timelineTreeId, "timeline");
        }
      }, 100);
    };

    return (
      <div className="mb-4">
        <Input
          isClearable
          placeholder={t("timeline.treeView.searchPlaceholder")}
          size="sm"
          startContent={<SearchIcon className="w-4 h-4" />}
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
          onClear={() => setQuickSearch("")}
        />
        {quickSearch && (
          <div className="mt-2 max-h-60 overflow-y-auto scrollbar-hide space-y-2 bg-default-50 rounded-lg p-2">
            {/* Timeline results */}
            {timelineResults.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-default-500 px-2">
                  {t("timeline.treeView.timelineLabel")}s (
                  {timelineResults.length})
                </div>
                {timelineResults.map((timeline) => (
                  <button
                    key={`timeline-${timeline.id}`}
                    className="w-full text-left p-2 hover:bg-default-100 rounded flex items-center gap-2 text-xs"
                    onClick={() => scrollToTimeline(timeline.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        scrollToTimeline(timeline.id);
                      }
                    }}
                  >
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span className="font-medium">{timeline.name}</span>
                    <span className="text-default-500">
                      ({(timeline.tasks || []).length} {t("timeline.tasks")})
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Task results */}
            {taskResults.length > 0 && (
              <div className="space-y-1">
                {timelineResults.length > 0 && <Divider className="my-2" />}
                <div className="text-xs font-semibold text-default-500 px-2">
                  {t("timeline.tasks")} ({taskResults.length})
                </div>
                {taskResults.map(({ timeline, task }) => (
                  <button
                    key={`task-${task.id}`}
                    className={`w-full p-2 hover:bg-default-100 rounded flex items-center gap-2 text-xs ${direction === "rtl" ? "text-right" : "text-left"}`}
                    onClick={() => scrollToTask(task.id.toString())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        scrollToTask(task.id.toString());
                      }
                    }}
                  >
                    <div className="w-3 h-3 bg-purple-500 rounded" />
                    <div className="flex-1">
                      <div className={`font-medium ${direction === "rtl" ? "text-right" : "text-left"}`}>{task.name}</div>
                      <div className={`text-default-400 text-[10px] ${direction === "rtl" ? "text-right" : "text-left"}`}>
                        {direction === "rtl" ? "في" : "in"} {timeline.name}
                      </div>
                    </div>
                    <span className="text-default-500">
                      ({(task.subtasks || []).length} {t("timeline.subtasks")})
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {timelineResults.length === 0 && taskResults.length === 0 && (
              <div className="text-center py-4 text-xs text-default-400">
                {t("timeline.treeView.noSearchResults")}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTimelineHeader = (timeline: Timeline) => {
    const raw = (timeline as any)?.treeId;
    const safeTimelineTreeId =
      raw != null && raw !== ""
        ? String(raw)
        : `timeline-${String(timeline?.id ?? "0")}`;

    return (
      <div
        className={`p-4 ${direction === "rtl" ? "border-r-4" : "border-l-4"} cursor-pointer hover:bg-default-50 transition-colors ${
          selectedItem === safeTimelineTreeId ? "bg-primary-50" : ""
        } border-blue-500`}
        id={`timeline-${timeline.id}`}
        role="button"
        tabIndex={0}
        onClick={() => {
          onItemSelect(safeTimelineTreeId, "timeline");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onItemSelect(safeTimelineTreeId, "timeline");
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {(timeline.tasks || []).length > 0 && (
                <div
                  className="flex items-center justify-center w-6 h-6 hover:bg-default-100 rounded cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(safeTimelineTreeId);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpanded(safeTimelineTreeId);
                    }
                  }}
                >
                  {expandedItems.has(safeTimelineTreeId) ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon
                      className={`w-4 h-4 ${direction === "rtl" ? "rotate-180" : ""}`}
                    />
                  )}
                </div>
              )}
              {(timeline.tasks || []).length === 0 && <div className="w-6" />}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{timeline.name}</h3>
              <p
                dangerouslySetInnerHTML={{ __html: timeline.description || "" }}
                className="text-sm text-default-600"
              />
              <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-default-500">
                <span>
                  {formatDateRange(timeline.startDate, timeline.endDate, {
                    language,
                    direction: direction === "rtl" ? "rtl" : "ltr",
                  })}
                </span>
                <span>
                  {(timeline.tasks || []).length} {t("timeline.tasks")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasPermission({ actions: ["timelines.update"] }) && (
              <Button
                color="default"
                size="sm"
                startContent={<EditIcon />}
                variant="light"
                onClick={(e) => e.stopPropagation()}
                onPress={() => handleOpenEditModal("timeline", timeline)}
              >
                {t("timeline.treeView.editModalTitle")}{" "}
                {t("timeline.treeView.timelineLabel")}
              </Button>
            )}
            {hasPermission({ actions: ["timelines.tasks.create"] }) && (
              <Button
                color="primary"
                isLoading={loading}
                size="sm"
                startContent={<PlusIcon />}
                onClick={(e) => e.stopPropagation()}
                onPress={() => handleCreateTask(timeline)}
              >
                {t("timeline.treeView.addTask")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTask = (task: Task) => (
    <div
      key={task.id}
      className={`${direction === "rtl" ? "mr-8" : "ml-8"} group`}
      data-filtered={isTaskFiltered(task) ? "true" : undefined}
      data-task-id={task.id.toString()}
      data-tree-id={task.treeId}
    >
      <div
        className={`p-3 ${direction === "rtl" ? "border-r-4" : "border-l-4"} cursor-pointer hover:bg-default-50 transition-colors ${
          selectedItem === task.treeId
            ? isTaskFiltered(task)
              ? "bg-primary-100"
              : "bg-primary-50"
            : isTaskFiltered(task)
              ? "bg-success-25"
              : ""
        } border-purple-500 relative`}
        role="button"
        tabIndex={0}
        onClick={() => {
          onItemSelect(task.treeId, "task");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onItemSelect(task.treeId, "task");
          }
        }}
      >
        {/* Move Task Popover - positioned in top right */}
        <div className="absolute top-2 right-2 z-10">
          <Popover
            backdrop="transparent"
            placement="bottom-end"
            showArrow={true}
          >
            <PopoverTrigger>
              <Button
                isIconOnly
                className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                size="sm"
                variant="light"
                onClick={(e) => e.stopPropagation()}
              >
                <MoveIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-3">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  {t("timeline.moveTask.quickMoveOptions")}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {hasPermission({
                    actions: ["timelines.tasks.move"],
                  }) && (
                    <Button
                      color="primary"
                      size="sm"
                      startContent={<CalendarDaysIcon size={14} />}
                      variant="flat"
                      onPress={() => handleQuickMoveTask(task, 1)}
                    >
                      +1 {t("timeline.moveTask.movePlus1Day")}
                    </Button>
                  )}
                  {hasPermission({
                    actions: ["timelines.tasks.move"],
                  }) && (
                    <Button
                      color="warning"
                      size="sm"
                      startContent={<CalendarDaysIcon size={14} />}
                      variant="flat"
                      onPress={() => handleQuickMoveTask(task, -1)}
                    >
                      -1 {t("timeline.moveTask.moveMinus1Day")}
                    </Button>
                  )}
                  {hasPermission({
                    actions: ["timelines.tasks.move"],
                  }) && (
                    <Button
                      color="primary"
                      size="sm"
                      startContent={<ClockIcon size={14} />}
                      variant="flat"
                      onPress={() => handleQuickMoveTask(task, 7)}
                    >
                      +7 {t("timeline.moveTask.movePlus1Week")}
                    </Button>
                  )}
                  {hasPermission({
                    actions: ["timelines.tasks.move"],
                  }) && (
                    <Button
                      color="warning"
                      size="sm"
                      startContent={<ClockIcon size={14} />}
                      variant="flat"
                      onPress={() => handleQuickMoveTask(task, -7)}
                    >
                      -7 {t("timeline.moveTask.moveMinus1Week")}
                    </Button>
                  )}
                </div>
                <Divider />
                {/* Custom move */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    {t("timeline.moveTask.customMove")}
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder={t("timeline.moveTask.enterDays")}
                      size="sm"
                      type="number"
                      value={popoverCustomDays}
                      onChange={(e) => setPopoverCustomDays(e.target.value)}
                    />
                    <Button
                      color="primary"
                      isDisabled={
                        !popoverCustomDays.trim() ||
                        isNaN(parseInt(popoverCustomDays, 10)) ||
                        parseInt(popoverCustomDays, 10) === 0
                      }
                      size="sm"
                      variant="solid"
                      onPress={() => handlePopoverCustomMove(task)}
                    >
                      {t("timeline.moveTask.move")}
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {task.subtasks && task.subtasks.length > 0 && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(task.treeId);
                  }}
                >
                  {expandedItems.has(task.treeId) ? (
                    <ChevronDownIcon />
                  ) : (
                    <ChevronRightIcon />
                  )}
                </Button>
              )}
              {(!task.subtasks || task.subtasks.length === 0) && (
                <div className="w-6" />
              )}
            </div>
            <div>
              <h6 className="font-medium">{task.name}</h6>
              <p
                dangerouslySetInnerHTML={{ __html: task.description || "" }}
                className="text-sm text-default-600"
              />
              <div className="flex items-center flex-wrap gap-4 mt-1 text-xs text-default-500">
                <span>
                  {formatDateRange(task.startDate, task.endDate, {
                    language,
                    direction: direction === "rtl" ? "rtl" : "ltr",
                  })}
                </span>
                <span>
                  {task.duration} {t("timeline.detailsPanel.days")}
                </span>
                <Chip
                  color={getStatusColor(task.statusId)}
                  size="sm"
                  variant="flat"
                >
                  {getStatusName(task.statusId)}
                </Chip>
                <Chip
                  color={getPriorityColor(task.priorityId)}
                  size="sm"
                  variant="flat"
                >
                  {getPriorityName(task.priorityId)}
                </Chip>
                {task.departmentId && (
                  <Chip
                    size="sm"
                    style={{
                      backgroundColor: getDepartmentColor(task.departmentId),
                      color: "white",
                    }}
                    variant="flat"
                  >
                    {getDepartmentName(task.departmentId)}
                  </Chip>
                )}
                {task.subtasks && task.subtasks.length > 0 && (
                  <span>
                    {task.subtasks.length} {t("timeline.subtasks")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Progress
                  aria-label={`Task progress: ${task.progress}%`}
                  className="flex-1 max-w-xs"
                  color={getProgressColor(task.progress)}
                  size="sm"
                  value={task.progress}
                />
                <span className="text-xs text-default-500 flex-shrink-0">
                  {task.progress}%
                </span>
              </div>
              {task.members && task.members.length > 0 && (
                <div className="flex items-center flex-wrap gap-1 mt-2">
                  <span className="text-xs text-default-600 mr-2">
                    {t("timeline.assignedMembers")}:
                  </span>
                  {task.members.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-1 bg-success-100 rounded-full px-2 py-1"
                    >
                      <span className="text-xs text-success-800 font-medium">
                        {member.gradeName} {member.fullName.split(" ")[0]}
                      </span>
                    </div>
                  ))}
                  {task.members.length > 3 && (
                    <span className="text-xs text-default-500">
                      +{task.members.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVerticalIcon />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              onAction={(key) => {
                if (key === "edit") {
                  handleOpenEditModal("task", task);
                } else if (key === "delete") {
                  handleDelete(task.id.toString(), "task");
                } else if (key === "create-subtask") {
                  handleCreateSubtask(task.id.toString(), task.name);
                }
              }}
            >
              {hasPermission({
                actions: ["subtasks.create"],
              }) && (
                <DropdownItem key="create-subtask" startContent={<PlusIcon />}>
                  {t("timeline.treeView.addSubtask")}
                </DropdownItem>
              )}
              {hasPermission({
                actions: ["timelines.tasks.update"],
              }) && (
                <DropdownItem key="edit" startContent={<EditIcon />}>
                  {t("timeline.treeView.editTask")}
                </DropdownItem>
              )}
              {hasPermission({
                actions: ["timelines.tasks.delete"],
              }) && (
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<DeleteIcon />}
                >
                  {t("timeline.treeView.deleteTask")}
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
      {/* Render subtasks if expanded */}
      {expandedItems.has(task.treeId) &&
        task.subtasks &&
        task.subtasks.map((subtask) => renderSubtask(subtask))}
    </div>
  );

  const renderSubtask = (subtask: Subtask) => (
    <div
      key={subtask.id}
      className={`${direction === "rtl" ? "mr-12" : "ml-12"}`}
    >
      <div
        className={`p-3 ${direction === "rtl" ? "border-r-4" : "border-l-4"} cursor-pointer hover:bg-default-50 transition-colors ${
          selectedItem === subtask.treeId ? "bg-primary-50" : ""
        } border-orange-500`}
        role="button"
        tabIndex={0}
        onClick={() => {
          onItemSelect(subtask.treeId, "subtask");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onItemSelect(subtask.treeId, "subtask");
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6" /> {/* Spacer for alignment */}
            <div>
              <h6 className="font-medium text-sm">{subtask.name}</h6>
              <p className="text-xs text-default-600">{subtask.description}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-default-500">
                {subtask.startDate && subtask.endDate && (
                  <span>
                    {formatDateRange(subtask.startDate, subtask.endDate, {
                      language,
                      direction: direction === "rtl" ? "rtl" : "ltr",
                    })}
                  </span>
                )}
                {subtask.estimatedHours && (
                  <span>
                    {subtask.estimatedHours}h{" "}
                    {t("timeline.detailsPanel.estimated")}
                  </span>
                )}
                {subtask.actualHours && (
                  <span>
                    {subtask.actualHours}h {t("timeline.detailsPanel.actual")}
                  </span>
                )}
                <Chip
                  color={getStatusColor(subtask.statusId)}
                  size="sm"
                  variant="flat"
                >
                  {getStatusName(subtask.statusId)}
                </Chip>
                {subtask.priorityId && (
                  <Chip
                    color={getPriorityColor(subtask.priorityId)}
                    size="sm"
                    variant="flat"
                  >
                    {getPriorityName(subtask.priorityId)}
                  </Chip>
                )}
                {subtask.assigneeName && (
                  <Chip size="sm" variant="flat">
                    {subtask.assigneeName}
                  </Chip>
                )}
              </div>
              {subtask.progress !== undefined && (
                <div className="flex items-center gap-4 mt-2">
                  <Progress
                    aria-label={`Subtask progress: ${subtask.progress}%`}
                    className="flex-1 max-w-xs"
                    color={getProgressColor(subtask.progress)}
                    size="sm"
                    value={subtask.progress}
                  />
                  <span className="text-xs text-default-500 flex-shrink-0">
                    {subtask.progress}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVerticalIcon />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              onAction={(key) => {
                if (key === "edit") {
                  handleOpenEditModal("subtask", subtask);
                } else if (key === "delete") {
                  handleDelete(subtask.id.toString(), "subtask");
                }
              }}
            >
              {hasPermission({ actions: ["subtasks.update"] }) && (
                <DropdownItem key="edit" startContent={<EditIcon />}>
                  {t("timeline.treeView.editSubtask")}
                </DropdownItem>
              )}
              {hasPermission({ actions: ["subtasks.delete"] }) && (
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<DeleteIcon />}
                >
                  {t("timeline.treeView.deleteSubtask")}
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </div>
  );



  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="text-default-600">
            {t("timeline.treeView.loadingTimeline")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`relative ${direction === "rtl" ? "rtl" : "ltr"}`}
      >
        <Card>
          <CardBody
            className={`p-4 ${direction === "rtl" ? "text-right" : "text-left"}`}
          >
            {renderColorLegend()}
            {renderQuickSearch()}
            <div className="space-y-4 pb-8">
              {filteredTimelines.map((timeline) => {
                const raw = (timeline as any)?.treeId;
                const timelineTreeId =
                  raw != null && raw !== ""
                    ? String(raw)
                    : `timeline-${String(timeline?.id ?? "0")}`;

                return (
                  <div key={timeline.id}>
                    {renderTimelineHeader(timeline)}
                    {expandedItems.has(timelineTreeId) &&
                      (timeline.tasks || []).map((task: Task) =>
                        renderTask(task),
                      )}
                  </div>
                );
              })}
              {filteredTimelines.length === 0 && (
                <div className="text-center py-8 text-default-500">
                  {t("timeline.treeView.noTimelinesFound")}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
      <TimelineEditModal
        departments={departments}
        getProgressColor={getProgressColor}
        initialValues={editModalInitialValues}
        isOpen={isEditModalOpen}
        loading={loading}
        priorityOptions={PRIORITY_OPTIONS}
        statusOptions={STATUS_OPTIONS}
        timelineId={editingItem?.id || timelines[0]?.id}
        type={editModalType}
        onClose={handleCloseEditModal}
        onSubmit={handleSubmitEdit}
      />
      <TimelineItemCreateModal
        departments={departments}
        initialValues={createModalInitialValues}
        isOpen={isCreateModalOpen}
        loading={loading}
        parentName={createModalParentName}
        timelineId={parseInt(createParentId) || timelines[0]?.id}
        type={createModalType}
        onClose={handleCloseCreateModal}
        onSubmit={handleSubmitCreate}
      />
    </>
  );
}
