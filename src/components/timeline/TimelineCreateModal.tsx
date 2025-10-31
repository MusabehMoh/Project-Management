import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Info } from "lucide-react";
import { today, getLocalTimeZone } from "@internationalized/date";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Import RTL styles for ReactQuill
import "../../pages/project-requirements.css";

import { useLanguage } from "@/contexts/LanguageContext";
import {
  Timeline,
  CreateTimelineRequest,
  TimelineFormData,
} from "@/types/timeline";
import { validateDateNotInPast } from "@/utils/dateValidation";

interface TimelineCreateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTimeline: (data: CreateTimelineRequest) => Promise<Timeline | null>;
  projectId?: number;
  loading?: boolean;
  initialName?: string;
  initialDescription?: string;
}

export default function TimelineCreateModal({
  isOpen,
  onOpenChange,
  onCreateTimeline,
  projectId,
  loading = false,
  initialName = "",
  initialDescription = "",
}: TimelineCreateModalProps) {
  const { t, direction } = useLanguage();

  // Wrapper function for validation that passes translation
  const handleValidateDateNotInPast = (
    value: any,
  ): string | true | null | undefined => {
    return validateDateNotInPast(value, t);
  };

  const [formData, setFormData] = useState<TimelineFormData>({
    name: "",
    description: "",
    startDate: null,
    endDate: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initial values change
  useEffect(() => {
    if (isOpen && (initialName || initialDescription)) {
      setFormData((prev) => ({
        ...prev,
        name: initialName || "",
        description: initialDescription || "",
      }));
    }
  }, [isOpen, initialName, initialDescription]);

  const handleInputChange = (field: keyof TimelineFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for the field being changed
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t("validation.nameRequired");
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t("validation.nameMinLength");
    }

    // Start date validation
    if (!formData.startDate) {
      newErrors.startDate = t("validation.startDateRequired");
    } else {
      // Validate start date is not in the past
      const startDateValidation = handleValidateDateNotInPast(
        formData.startDate,
      );

      if (startDateValidation !== true) {
        newErrors.startDate = t("common.validation.dateNotInPast");
      }
    }

    // End date validation
    if (!formData.endDate) {
      newErrors.endDate = t("validation.endDateRequired");
    } else {
      // Validate end date is not in the past
      const endDateValidation = handleValidateDateNotInPast(formData.endDate);

      if (endDateValidation !== true) {
        newErrors.endDate = t("common.validation.dateNotInPast");
      }
    }

    // Check if end date is after start date (only if both dates exist and are valid)
    if (
      formData.startDate &&
      formData.endDate &&
      !newErrors.startDate &&
      !newErrors.endDate
    ) {
      const start = new Date(formData.startDate.toString());
      const end = new Date(formData.endDate.toString());

      if (start >= end) {
        newErrors.endDate = t("validation.endDateAfterStart");
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!projectId) {
      setErrors({ general: t("timeline.create.projectRequired") });

      return;
    }

    try {
      const createData: CreateTimelineRequest = {
        projectId,
        name: formData.name.trim(),
        description: formData.description?.trim(),
        startDate: formData.startDate!.toString(),
        endDate: formData.endDate!.toString(),
      };

      const result = await onCreateTimeline(createData);

      if (result) {
        // Reset form
        setFormData({
          name: "",
          description: "",
          startDate: null,
          endDate: null,
        });
        setErrors({});
        onOpenChange(false);
      }
    } catch {
      setErrors({ general: t("timeline.create.failedToCreate") });
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      startDate: null,
      endDate: null,
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="4xl"
      onClose={handleClose}
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <div className={direction === "rtl" ? "text-right" : "text-left"}>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">
                  {t("timeline.create.title")}
                </h2>
                <Popover placement="bottom">
                  <PopoverTrigger>
                    <Button
                      isIconOnly
                      className="text-default-400 hover:text-default-600"
                      size="sm"
                      variant="light"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="px-1 py-2">
                      <div className="text-small font-bold">
                        {t("common.info")}
                      </div>
                      <div className="text-tiny text-default-600 max-w-xs">
                        {t("timeline.create.timelineInfo")}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-sm text-default-500 font-normal">
                {t("timeline.create.subtitle")}
              </p>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {errors.general && (
                  <div className="p-3 text-sm text-danger bg-danger-50 rounded-lg">
                    {errors.general}
                  </div>
                )}

                <Input
                  isRequired
                  errorMessage={errors.name}
                  isInvalid={!!errors.name}
                  label={t("timeline.create.timelineName")}
                  placeholder={t("timeline.create.timelineNamePlaceholder")}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker
                    isRequired
                    errorMessage={errors.startDate}
                    isInvalid={!!errors.startDate}
                    label={t("timeline.create.startDate")}
                    minValue={today(getLocalTimeZone())}
                    value={formData.startDate}
                    onChange={(date) => handleInputChange("startDate", date)}
                  />

                  <DatePicker
                    isRequired
                    errorMessage={errors.endDate}
                    isInvalid={!!errors.endDate}
                    label={t("timeline.create.endDate")}
                    minValue={today(getLocalTimeZone())}
                    value={formData.endDate}
                    onChange={(date) => handleInputChange("endDate", date)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t("timeline.create.description")}
                  </label>
                  <div className="min-h-[120px]">
                    <ReactQuill
                      className={direction === "rtl" ? "rtl-editor" : ""}
                      modules={{
                        toolbar: [
                          ["bold", "italic", "underline"],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["clean"],
                        ],
                      }}
                      placeholder={t("timeline.create.descriptionPlaceholder")}
                      style={{
                        height: "100px",
                      }}
                      theme="snow"
                      value={formData.description || ""}
                      onChange={(value) =>
                        handleInputChange("description", value)
                      }
                    />
                  </div>
                </div>

                {!projectId && (
                  <div className="p-3 text-sm text-warning bg-warning-50 rounded-lg">
                    {t("timeline.create.noProjectWarning")}
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                isDisabled={loading}
                variant="light"
                onPress={onClose}
              >
                {t("timeline.create.cancel")}
              </Button>
              <Button
                color="primary"
                isDisabled={loading || !projectId}
                isLoading={loading}
                onPress={handleSave}
              >
                {t("timeline.create.createTimeline")}
              </Button>
            </ModalFooter>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
