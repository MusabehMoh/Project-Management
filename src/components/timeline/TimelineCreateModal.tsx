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


import { 
  Timeline,
  CreateTimelineRequest,
  TimelineFormData
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
  loading = false
}: TimelineCreateModalProps) {
  const [formData, setFormData] = useState<TimelineFormData>({
    name: "",
    description: "",
    startDate: null,
    endDate: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Timeline name is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate.toString());
      const end = new Date(formData.endDate.toString());
      
      if (start >= end) {
        newErrors.endDate = "End date must be after start date";
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
      setErrors({ general: "Project ID is required" });
      return;
    }

    try {
      const createData: CreateTimelineRequest = {
        projectId,
        name: formData.name.trim(),
        description: formData.description?.trim(),
        startDate: formData.startDate!.toString(),
        endDate: formData.endDate!.toString()
      };

      const result = await onCreateTimeline(createData);
      
      if (result) {
        // Reset form
        setFormData({
          name: "",
          description: "",
          startDate: null,
          endDate: null
        });
        setErrors({});
        onOpenChange(false);
      }
    } catch (error) {
      setErrors({ general: "Failed to create timeline" });
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      startDate: null,
      endDate: null
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
      onClose={handleClose}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Create New Timeline
              <p className="text-sm text-default-500 font-normal">
                Create a new timeline to organize your project phases
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
                  label="Timeline Name"
                  placeholder="Enter timeline name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  isRequired
                  errorMessage={errors.name}
                  isInvalid={!!errors.name}
                />

                <Textarea
                  label="Description"
                  placeholder="Describe this timeline (optional)"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  minRows={3}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(date) => setFormData({ ...formData, startDate: date })}
                    isRequired
                    errorMessage={errors.startDate}
                    isInvalid={!!errors.startDate}
                  />

                  <DatePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={(date) => setFormData({ ...formData, endDate: date })}
                    isRequired
                    errorMessage={errors.endDate}
                    isInvalid={!!errors.endDate}
                  />
                </div>

                {!projectId && (
                  <div className="p-3 text-sm text-warning bg-warning-50 rounded-lg">
                    Warning: No project selected. Please select a project first.
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                color="danger" 
                variant="light" 
                onPress={onClose}
                isDisabled={loading}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSave}
                isLoading={loading}
                isDisabled={loading || !projectId}
              >
                Create Timeline
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
