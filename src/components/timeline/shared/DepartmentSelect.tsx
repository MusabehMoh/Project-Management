import React from "react";
import { Select, SelectItem } from "@heroui/react";

import { useLanguage } from "@/contexts/LanguageContext";
import { Department } from "@/types/timeline";

export interface DepartmentSelectProps {
  departments: Department[];
  selectedDepartmentId?: string;
  onSelectionChange: (departmentId: string) => void;
  label?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  isDisabled?: boolean;
  isRequired?: boolean;
  errorMessage?: string;
  isInvalid?: boolean;
  className?: string;
}

export function DepartmentSelect({
  departments,
  selectedDepartmentId,
  onSelectionChange,
  label,
  placeholder,
  size = "md",
  isDisabled = false,
  isRequired = false,
  errorMessage,
  isInvalid = false,
  className,
}: DepartmentSelectProps) {
  const { t } = useLanguage();

  const handleSelectionChange = (keys: Set<React.Key> | "all") => {
    if (keys === "all") return;

    const selected = Array.from(keys)[0] as string;

    onSelectionChange(selected || "");
  };

  return (
    <div className={className}>
      <Select
        errorMessage={errorMessage}
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        isRequired={isRequired}
        label={label || t("timeline.detailsPanel.department")}
        placeholder={placeholder || t("timeline.detailsPanel.selectDepartment")}
        selectedKeys={selectedDepartmentId ? [selectedDepartmentId] : []}
        size={size}
        onSelectionChange={handleSelectionChange}
      >
        {departments.map((dept) => (
          <SelectItem key={dept.id.toString()} textValue={dept.name}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dept.color }}
              />
              {dept.name}
            </div>
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
