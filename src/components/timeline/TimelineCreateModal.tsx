import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

import { useLanguage } from "@/contexts/LanguageContext";
import {
  Timeline,
  CreateTimelineRequest,
  TimelineFormData,
} from "@/types/timeline";

interface TimelineCreateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTimeline: (data: CreateTimelineRequest) => Promise<Timeline | null>;
  projectId?: number;
  loading?: boolean;
}

export default function TimelineCreateModal({
  isOpen,
  onOpenChange,
  onCreateTimeline,
  projectId,
  loading = false,
}: TimelineCreateModalProps) {
  const { t, direction } = useLanguage();

  const [formData, setFormData] = useState<TimelineFormData>({
    name: "",
    description: "",
    startDate: null,
    endDate: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
    }

    // End date validation
    if (!formData.endDate) {
      newErrors.endDate = t("validation.endDateRequired");
    } else if (formData.startDate && formData.endDate) {
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
      size="2xl"
      onClose={handleClose}
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <div className={direction === "rtl" ? "text-right" : "text-left"}>
            <ModalHeader className="flex flex-col gap-1">
              {t("timeline.create.title")}
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

                <Textarea
                  label={t("timeline.create.description")}
                  minRows={3}
                  placeholder={t("timeline.create.descriptionPlaceholder")}
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker
                    isRequired
                    errorMessage={errors.startDate}
                    isInvalid={!!errors.startDate}
                    label={t("timeline.create.startDate")}
                    value={formData.startDate}
                    onChange={(date) => handleInputChange("startDate", date)}
                  />

                  <DatePicker
                    isRequired
                    errorMessage={errors.endDate}
                    isInvalid={!!errors.endDate}
                    label={t("timeline.create.endDate")}
                    value={formData.endDate}
                    onChange={(date) => handleInputChange("endDate", date)}
                  />
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
