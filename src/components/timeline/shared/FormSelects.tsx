import React from "react";
import { Select, SelectItem } from "@heroui/react";

import { useLanguage } from "@/contexts/LanguageContext";
import { StatusOption, PriorityOption } from "@/hooks/useTimelineFormHelpers";

export interface StatusSelectProps {
  statusOptions: StatusOption[];
  selectedStatusId?: number;
  onSelectionChange: (statusId: number) => void;
  label?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  isDisabled?: boolean;
  isRequired?: boolean;
  errorMessage?: string;
  isInvalid?: boolean;
  className?: string;
}

export function StatusSelect({
  statusOptions,
  selectedStatusId,
  onSelectionChange,
  label,
  placeholder,
  size = "md",
  isDisabled = false,
  isRequired = false,
  errorMessage,
  isInvalid = false,
  className,
}: StatusSelectProps) {
  const { t } = useLanguage();

  const handleSelectionChange = (keys: Set<React.Key> | "all") => {
    if (keys === "all") return;

    const selected = Array.from(keys)[0] as string;

    onSelectionChange(selected ? parseInt(selected) : 1);
  };

  const selectItems = statusOptions.map((status) => ({
    value: status.value.toString(),
    label: status.label,
    color: status.color,
  }));

  return (
    <div className={className}>
      <Select
        errorMessage={errorMessage}
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        isRequired={isRequired}
        items={selectItems}
        label={label || t("timeline.detailsPanel.status")}
        placeholder={placeholder || t("timeline.detailsPanel.selectStatus")}
        selectedKeys={selectedStatusId ? [selectedStatusId.toString()] : []}
        size={size}
        onSelectionChange={handleSelectionChange}
      >
        {(item) => (
          <SelectItem key={item.value} textValue={item.label}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </div>
          </SelectItem>
        )}
      </Select>
    </div>
  );
}

export interface PrioritySelectProps {
  priorityOptions: PriorityOption[];
  selectedPriorityId?: number;
  onSelectionChange: (priorityId: number) => void;
  label?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  isDisabled?: boolean;
  isRequired?: boolean;
  errorMessage?: string;
  isInvalid?: boolean;
  className?: string;
}

export function PrioritySelect({
  priorityOptions,
  selectedPriorityId,
  onSelectionChange,
  label,
  placeholder,
  size = "md",
  isDisabled = false,
  isRequired = false,
  errorMessage,
  isInvalid = false,
  className,
}: PrioritySelectProps) {
  const { t } = useLanguage();

  const handleSelectionChange = (keys: Set<React.Key> | "all") => {
    if (keys === "all") return;

    const selected = Array.from(keys)[0] as string;

    onSelectionChange(selected ? parseInt(selected) : 2);
  };

  const selectItems = priorityOptions.map((priority) => ({
    value: priority.value.toString(),
    label: priority.label,
    color: priority.color,
  }));

  return (
    <div className={className}>
      <Select
        errorMessage={errorMessage}
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        isRequired={isRequired}
        items={selectItems}
        label={label || t("timeline.detailsPanel.priority")}
        placeholder={placeholder || t("timeline.detailsPanel.selectPriority")}
        selectedKeys={selectedPriorityId ? [selectedPriorityId.toString()] : []}
        size={size}
        onSelectionChange={handleSelectionChange}
      >
        {(item) => (
          <SelectItem key={item.value} textValue={item.label}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </div>
          </SelectItem>
        )}
      </Select>
    </div>
  );
}