import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Input,
  DatePicker,
  Autocomplete,
  AutocompleteItem,
  Avatar,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { X } from "lucide-react";
import { today } from "@internationalized/date";

import { useLanguage } from "@/contexts/LanguageContext";
import { MemberSearchResult } from "@/types";
import useTeamSearch from "@/hooks/useTeamSearch";
import { AdhocTask } from "@/types/membersTasks";
import { UseAdhocTasks } from "@/hooks/useAdhocTask";

export interface AddAdhocTaskFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  members: MemberSearchResult[];
}

interface AddAdhocTaskProps {
  onSuccess?: () => void;
}

const AddAdhocTask = ({ onSuccess }: AddAdhocTaskProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<AddAdhocTaskFormData>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    members: [],
  });
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>(
    [],
  );
  const [employeeInputValue, setEmployeeInputValue] = useState<string>("");
  // State for selected members
  const [selectedEmployee, setSelectedEmployee] =
    useState<MemberSearchResult | null>(null);
  // Employee search hooks for employees
  const {
    employees: employees,
    loading: employeeSearchLoading,
    searchEmployees: searchEmployees,
  } = useTeamSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
  });

  // Add validation errors state
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    members?: string;
  }>({});

  const { addAdhocTask, loading, error } = UseAdhocTasks();

  const validateForm = () => {
    const newErrors: {
      name?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      members?: string;
    } = {};

    if (!formData.name.trim()) {
      newErrors.name = t("taskNameRequired");
    }
    if (!formData.description.trim()) {
      newErrors.description = t("taskDescriptionRequired");
    }
    if (!formData.startDate) {
      newErrors.startDate = t("taskStartDateRequired");
    }
    if (!formData.endDate) {
      newErrors.endDate = t("taskEndDateRequired");
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end < start) {
        newErrors.endDate = t("taskValidEndDate");
      }
    }

    if (selectedMembers.length === 0) {
      newErrors.members = t("taskAssigneeRequired");
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof AddAdhocTaskFormData, value: any) => {
    setFormData((prev: AddAdhocTaskFormData) => ({ ...prev, [field]: value }));

    // Clear error for the field being changed
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee: MemberSearchResult) => {
    setSelectedEmployee(employee);
    setEmployeeInputValue(`${employee.gradeName} ${employee.fullName}`);
    if (!selectedMembers.some((user) => user.id === employee.id)) {
      setSelectedMembers([...selectedMembers, employee]);
    }
    // After adding to chips, reset the dropdown input/selection for next pick
    resetUserDropDown();
  };

  const resetUserDropDown = () => {
    // Only reset the dropdown input and current selection, keep selected chips
    setEmployeeInputValue("");
    setSelectedEmployee(null);
  };

  useEffect(() => {
    if (isOpen) {
      console.log("reset called");
      resetUserDropDown();
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        members: [],
      });
      setSelectedMembers([]);
      setErrors({});
      setEmployeeInputValue("");
      setSelectedEmployee(null);
    }
  }, [isOpen]);

  return (
    <>
      {/* Button */}
      <Button
        color="danger"
        size="lg"
        variant="bordered"
        onPress={() => setIsOpen(true)}
      >
        {t("common.AddAdhocTask")}
      </Button>

      {/* Modal */}
      <Modal isOpen={isOpen} size="2xl" onOpenChange={setIsOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-center w-full flex justify-center">
                {t("common.AddAdhocTask")}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("timeline.treeView.name")}
                    </label>
                    <Input
                      errorMessage={errors.name}
                      isInvalid={!!errors.name}
                      placeholder={t("timeline.treeView.name")}
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("timeline.detailsPanel.description")}
                    </label>
                    <Textarea
                      errorMessage={errors.description}
                      isInvalid={!!errors.description}
                      minRows={3}
                      placeholder={t("timeline.detailsPanel.description")}
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DatePicker
                      isRequired
                      errorMessage={errors.startDate}
                      isInvalid={!!errors.startDate}
                      label={t("timeline.detailsPanel.startDate")}
                      minValue={today(getLocalTimeZone())}
                      value={
                        formData.startDate
                          ? parseDate(formData.startDate.substring(0, 10))
                          : null
                      }
                      onChange={(date) =>
                        handleInputChange(
                          "startDate",
                          date ? date.toString() : "",
                        )
                      }
                    />

                    <DatePicker
                      isRequired
                      errorMessage={errors.endDate}
                      isInvalid={!!errors.endDate}
                      label={t("timeline.detailsPanel.endDate")}
                      minValue={today("UTC")}
                      value={
                        formData.endDate
                          ? parseDate(formData.endDate.substring(0, 10))
                          : null
                      }
                      onChange={(date) =>
                        handleInputChange(
                          "endDate",
                          date ? date.toString() : "",
                        )
                      }
                    />
                  </div>
                  {/* Users Drop down */}
                  {/* Tags Display */}
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
                  >
                    {selectedMembers.map((employee, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: "#e0e0e0",
                          padding: "5px 10px",
                          borderRadius: "20px",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <X
                            color="red" // optional color
                            size={24} // optional size
                            style={{ cursor: "pointer" }} // show pointer on hover
                            onClick={() => {
                              setSelectedMembers(
                                selectedMembers.filter(
                                  (user) => user.id !== employee.id,
                                ),
                              );
                              setFormData({
                                ...formData,
                                members: selectedMembers,
                              });
                            }}
                          />

                          <div className="flex flex-col">
                            <span className="text-xs">
                              {employee.gradeName}{" "}
                              {employee.fullName || t("common.none")}
                            </span>

                            <span className="text-xs text-default-400">
                              @{employee.department || t("common.none")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <label>{t("users.selectEmployee")}</label>
                  <Autocomplete
                    isClearable
                    errorMessage={errors.members}
                    isInvalid={!!errors.members ? true : false}
                    isLoading={employeeSearchLoading}
                    label={t("users.selectEmployee")}
                    menuTrigger="input"
                    placeholder={t("users.searchEmployees")}
                    selectedKey={selectedEmployee?.id.toString()}
                    onInputChange={(value) => {
                      setEmployeeInputValue(value);
                      if (
                        selectedEmployee &&
                        value !==
                          `${selectedEmployee.gradeName} ${selectedEmployee.fullName}`
                      ) {
                        setSelectedEmployee(null);
                      }
                      searchEmployees(value);
                      if (errors.members) {
                        setErrors((prev) => ({ ...prev, members: undefined })); // clear error on typing
                      }
                    }}
                    onSelectionChange={(key) => {
                      if (key) {
                        const selectedEmployee = employees.find(
                          (e) => e.id.toString() === key
                        );
                        if (selectedEmployee) {
                          handleEmployeeSelect(selectedEmployee);
                          setErrors((prev) => ({
                            ...prev,
                            members: undefined,
                          })); // clear error on selection
                        }
                      } else {
                        setSelectedEmployee(null);
                        setEmployeeInputValue("");
                      }
                    }}
                    inputValue={employeeInputValue}
                    // Disable client-side filtering; we already filter on the server
                    defaultFilter={(textValue, input) => true}
                  >
                    {employees.map((employee) => (
                      <AutocompleteItem
                        key={employee.id.toString()}
                        // Include username, military number, and department to improve matching
                        textValue={`${employee.gradeName} ${employee.fullName} ${employee.userName} ${employee.militaryNumber} ${employee.department}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={employee.fullName || t("common.none")}
                            size="sm"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {employee.gradeName}{" "}
                              {employee.fullName || t("common.none")}
                            </span>
                            <span className="text-sm text-default-500">
                              {employee.militaryNumber || "N/A"}
                            </span>
                            <span className="text-xs text-default-400">
                              @{employee.userName || t("common.none")}
                            </span>
                            <span className="text-xs text-default-400">
                              @{employee.department || t("common.none")}
                            </span>
                          </div>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-end gap-2">
                <Button
                  color="default"
                  variant="flat"
                  onPress={() => onClose()}
                >
                  {t("cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={loading}
                  onPress={async () => {
                    if (validateForm()) {
                      const newTask: AdhocTask = {
                        name: formData.name,
                        description: formData.description,
                        startDate: formData.startDate,
                        endDate: formData.endDate,
                        assignedMembers: selectedMembers.map((m) =>
                          m.id.toString(),
                        ),
                      };

                      const success = await addAdhocTask(newTask);

                      if (success) {
                        // reset form + close modal
                        setFormData({
                          name: "",
                          description: "",
                          startDate: "",
                          endDate: "",
                          members: [],
                        });
                        setSelectedMembers([]);
                        onClose();

                        // Call the onSuccess callback to refresh the parent component
                        if (onSuccess) {
                          onSuccess();
                        }
                      }
                    }
                  }}
                >
                  {t("confirm")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default AddAdhocTask;
