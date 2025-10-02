import React from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";

import { useTeamSearch } from "@/hooks/useTeamSearch";
import { useLanguage } from "@/contexts/LanguageContext";
import { MemberSearchResult } from "@/types/timeline";

export interface MemberAutocompleteProps {
  selectedMembers: MemberSearchResult[];
  onMemberSelect: (member: MemberSearchResult) => void;
  onMemberRemove: (memberId: number) => void;
  label?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  isDisabled?: boolean;
  className?: string;
}

export function MemberAutocomplete({
  selectedMembers,
  onMemberSelect,
  onMemberRemove,
  label,
  placeholder,
  size = "sm",
  isDisabled = false,
  className,
}: MemberAutocompleteProps) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = React.useState<string>("");
  const [selectedMember, setSelectedMember] =
    React.useState<MemberSearchResult | null>(null);

  const {
    employees,
    loading: searchLoading,
    searchEmployees,
  } = useTeamSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
  });

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (selectedMember && value !== selectedMember.fullName) {
      setSelectedMember(null);
    }

    searchEmployees(value);
  };

  const handleSelectionChange = (key: React.Key | null) => {
    if (!key) {
      setSelectedMember(null);
      setInputValue("");

      return;
    }

    const found = employees.find((emp) => emp.id.toString() === key);

    if (found && !selectedMembers.some((m) => m.id === found.id)) {
      onMemberSelect(found);
      setSelectedMember(null);
      setInputValue("");
    }
  };

  return (
    <div className={className}>
      {/* Chips for selected members */}
      <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
        {selectedMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-2 rounded-full bg-default-200 px-2 py-1 text-xs"
          >
            <span>{member.fullName}</span>
            <button
              className="text-danger"
              onClick={() => onMemberRemove(member.id)}
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
        label={label || t("users.selectEmployee")}
        menuTrigger="input"
        placeholder={placeholder || t("users.searchEmployees")}
        selectedKey={selectedMember?.id?.toString()}
        size={size}
        onInputChange={handleInputChange}
        onSelectionChange={handleSelectionChange}
      >
        {employees.map((employee) => (
          <AutocompleteItem
            key={employee.id.toString()}
            textValue={employee.fullName}
          >
            <span className="flex items-center gap-2">
              <span className="flex flex-col">
                <span className="text-sm font-medium">{employee.fullName}</span>
                {employee.userName && (
                  <span className="text-xs text-default-500">
                    {employee.userName}
                  </span>
                )}
              </span>
              {employee.department && (
                <span className="text-xs text-default-400">
                  {employee.department}
                </span>
              )}
            </span>
          </AutocompleteItem>
        ))}
      </Autocomplete>
    </div>
  );
}
