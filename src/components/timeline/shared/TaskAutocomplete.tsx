import React from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";

import { useTaskSearch } from "@/hooks/useTaskSearch";
import { useLanguage } from "@/contexts/LanguageContext";
import { WorkItem } from "@/types/timeline";

export interface TaskAutocompleteProps {
  selectedTasks: WorkItem[];
  onTaskSelect: (task: WorkItem) => void;
  onTaskRemove: (taskId: string | number) => void;
  label?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  isDisabled?: boolean;
  className?: string;
  timelineId?: number;
}

export function TaskAutocomplete({
  selectedTasks,
  onTaskSelect,
  onTaskRemove,
  label,
  placeholder,
  size = "sm",
  isDisabled = false,
  className,
  timelineId,
}: TaskAutocompleteProps) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = React.useState<string>("");
  const [selectedTask, setSelectedTask] = React.useState<WorkItem | null>(null);

  const {
    workItems: tasks,
    loading: searchLoading,
    searchTasks,
  } = useTaskSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
    timelineId,
  });

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (selectedTask && value !== selectedTask.name) {
      setSelectedTask(null);
    }

    searchTasks(value);
  };

  const handleSelectionChange = (key: React.Key | null) => {
    if (!key) {
      setSelectedTask(null);
      setInputValue("");

      return;
    }

    const found = tasks.find((task) => task.id.toString() === key);

    if (found && !selectedTasks.some((t) => t.id === found.id)) {
      onTaskSelect(found);
      setSelectedTask(null);
      setInputValue("");
    }
  };

  return (
    <div className={className}>
      {/* Chips for selected tasks */}
      <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
        {selectedTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 rounded-full bg-default-200 px-2 py-1 text-xs"
          >
            <span>{task.name}</span>
            <button
              className="text-danger"
              onClick={() => onTaskRemove(task.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Autocomplete */}
      <Autocomplete
        isClearable
        defaultFilter={() => true}
        inputValue={inputValue}
        isDisabled={isDisabled}
        isLoading={searchLoading}
        label={label || t("timeline.selectPredecessors")}
        menuTrigger="input"
        placeholder={placeholder || t("timeline.selectPredecessorsPlaceholder")}
        selectedKey={selectedTask?.id?.toString()}
        size={size}
        onInputChange={handleInputChange}
        onSelectionChange={handleSelectionChange}
      >
        {tasks.map((task) => (
          <AutocompleteItem key={task.id.toString()} textValue={task.name}>
            <span className="flex items-center gap-2">
              <span className="flex flex-col">
                <span className="text-sm font-medium">{task.name}</span>
                {task.description && (
                  <span className="text-xs text-default-500 truncate max-w-48">
                    {task.description}
                  </span>
                )}
              </span>
              {task.description && (
                <span className="text-xs text-default-400">Task</span>
              )}
            </span>
          </AutocompleteItem>
        ))}
      </Autocomplete>
    </div>
  );
}
