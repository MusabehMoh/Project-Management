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
  Select,
  SelectItem,
} from "@heroui/react";
import { useEffect, useState } from "react";
import {
  getLocalTimeZone,
  parseDate,
  DateValue,
} from "@internationalized/date";
import { X } from "lucide-react";
import { today } from "@internationalized/date";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLanguage } from "@/contexts/LanguageContext";
import { MemberSearchResult } from "@/types";
import useTeamSearchByDepartment from "@/hooks/useTeamSearchByDepartment";
import { AdhocTask } from "@/types/membersTasks";
import { UseAdhocTasks } from "@/hooks/useAdhocTask";
import { usePriorityLookups } from "@/hooks/usePriorityLookups";
import { PlusIcon } from "@/components/icons";
import { validateDateNotInPast } from "@/utils/dateValidation";

export interface AddAdhocTaskFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  priority: number;
  members: MemberSearchResult[];
}

interface AddAdhocTaskProps {
  onSuccess?: () => void;
}

const AddAdhocTask = ({ onSuccess }: AddAdhocTaskProps) => {
  const { t, language } = useLanguage();

  // Wrapper function for validation that passes translation
  const handleValidateDateNotInPast = (
    value: DateValue | null,
  ): string | true | null | undefined => {
    return validateDateNotInPast(value, t);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<AddAdhocTaskFormData>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    priority: 0,
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
  const { user } = useCurrentUser();
  const {
    employees: employees,
    loading: employeeSearchLoading,
    searchEmployees: searchEmployees,
  } = useTeamSearchByDepartment({
    departmentId: user?.roles?.[0]?.department?.id
      ? Number(user.roles[0].department.id)
      : 4, // Development Department
    minLength: 1,
    maxResults: 20,
    loadInitialResults: true, // Load initial results to populate on focus
    initialResultsLimit: 20,
  });

  // Add validation errors state
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    priority?: string;
    members?: string;
  }>({});

  const { addAdhocTask, loading } = UseAdhocTasks();

  // Priority lookups
  const { priorityOptions } = usePriorityLookups();

  const validateForm = () => {
    const newErrors: {
      name?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      priority?: string;
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
    if (!formData.priority || formData.priority === 0) {
      newErrors.priority = t("taskPriorityRequired");
    }

    // Validate start date is not in the past
    if (formData.startDate) {
      const startDateValidation = handleValidateDateNotInPast(
        parseDate(formData.startDate.substring(0, 10)),
      );

      if (startDateValidation !== true) {
        newErrors.startDate = t("common.validation.dateNotInPast");
      }
    }

    // Validate end date is not in the past
    if (formData.endDate) {
      const endDateValidation = handleValidateDateNotInPast(
        parseDate(formData.endDate.substring(0, 10)),
      );

      if (endDateValidation !== true) {
        newErrors.endDate = t("common.validation.dateNotInPast");
      }
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
      resetUserDropDown();
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        priority: 0,
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
        className="text-danger"
        color="danger"
        startContent={<PlusIcon className="h-4 w-4" />}
        variant="flat"
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
                      {t("tasks.taskName")}{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <Input
                      errorMessage={errors.name}
                      isInvalid={!!errors.name}
                      placeholder={t("tasks.taskName")}
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("timeline.detailsPanel.description")}{" "}
                      <span className="text-danger">*</span>
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

                  <div>
                    <Select
                      isClearable
                      isRequired
                      errorMessage={errors.priority}
                      isInvalid={!!errors.priority}
                      label={t("requirements.priority")}
                      placeholder={t("requirements.selectPriority")}
                      selectedKeys={
                        formData.priority > 0
                          ? [formData.priority.toString()]
                          : []
                      }
                      onClear={() => {
                        setFormData({
                          ...formData,
                          priority: 0,
                        });
                      }}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;

                        if (selectedKey) {
                          setFormData({
                            ...formData,
                            priority: parseInt(selectedKey),
                          });
                        }
                      }}
                    >
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority.value.toString()}>
                          {language === "ar"
                            ? priority.labelAr
                            : priority.label}
                        </SelectItem>
                      ))}
                    </Select>
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
                      minValue={today(getLocalTimeZone())}
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
                              {employee.militaryNumber || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <label>
                    {t("users.selectEmployee")}{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <Autocomplete
                    isClearable
                    defaultFilter={(_textValue, _input) => true}
                    errorMessage={errors.members}
                    inputValue={employeeInputValue}
                    isInvalid={!!errors.members ? true : false}
                    isLoading={employeeSearchLoading}
                    label={t("users.selectEmployee")}
                    menuTrigger="focus"
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
                    onOpenChange={(isOpen) => {
                      if (isOpen && employees.length === 0) {
                        searchEmployees("");
                      }
                    }}
                    onSelectionChange={(key) => {
                      if (key) {
                        const selectedEmployee = employees.find(
                          (e) => e.id.toString() === key,
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
                  >
                    {employees.map((employee) => (
                      <AutocompleteItem
                        key={employee.id.toString()}
                        textValue={`${employee.gradeName || ''} ${employee.fullName || ''}`.trim()}
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
                        priority: formData.priority,
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
                          priority: 0,
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
