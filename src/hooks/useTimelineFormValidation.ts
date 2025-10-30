import { useState, useCallback } from "react";

import { useLanguage } from "@/contexts/LanguageContext";

export interface TimelineFormErrors {
  name?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  departmentId?: string;
}

export interface TimelineFormData {
  name: string;
  description?: string;
  startDate: string | any;
  endDate: string | any;
  departmentId?: string;
  [key: string]: any;
}

export interface ValidationOptions {
  requireName?: boolean;
  requireStartDate?: boolean;
  requireEndDate?: boolean;
  requireDescription?: boolean;
  requireDepartment?: boolean;
  minNameLength?: number;
  maxNameLength?: number;
  timelineStartDate?: string;
  timelineEndDate?: string;
  validateTimelineRange?: boolean;
}

/**
 * Reusable form validation hook for timeline modals
 * Provides consistent validation logic across create and edit modals
 */
export function useTimelineFormValidation(options: ValidationOptions = {}) {
  const { t } = useLanguage();
  const [errors, setErrors] = useState<TimelineFormErrors>({});

  const {
    requireName = true,
    requireStartDate = true,
    requireEndDate = true,
    requireDescription = false,
    requireDepartment = false,
    minNameLength = 2,
    maxNameLength = 100,
    timelineStartDate,
    timelineEndDate,
    validateTimelineRange = true,
  } = options;

  const validateForm = useCallback(
    (formData: TimelineFormData): boolean => {
      const newErrors: TimelineFormErrors = {};

      // Name validation
      if (requireName) {
        if (!formData.name?.trim()) {
          newErrors.name = t("validation.nameRequired");
        } else if (formData.name.trim().length < minNameLength) {
          newErrors.name = t("validation.nameMinLength");
        } else if (formData.name.trim().length > maxNameLength) {
          newErrors.name = t("validation.nameMaxLength");
        }
      }

      // Description validation
      if (requireDescription && !formData.description?.trim()) {
        newErrors.description = t("validation.descriptionRequired");
      }

      // Department validation
      if (requireDepartment && !formData.departmentId) {
        newErrors.departmentId = t("validation.departmentRequired");
      }

      // Start date validation
      if (requireStartDate && !formData.startDate) {
        newErrors.startDate = t("validation.startDateRequired");
      }

      // End date validation
      if (requireEndDate) {
        if (!formData.endDate) {
          newErrors.endDate = t("validation.endDateRequired");
        } else if (formData.startDate && formData.endDate) {
          // Handle both string and DatePicker object formats
          const startDate = new Date(
            typeof formData.startDate === "string"
              ? formData.startDate
              : formData.startDate.toString(),
          );
          const endDate = new Date(
            typeof formData.endDate === "string"
              ? formData.endDate
              : formData.endDate.toString(),
          );

          if (startDate >= endDate) {
            newErrors.endDate = t("validation.endDateAfterStart");
          }
        }
        debugger;
        // Timeline date range validation
        if (
          validateTimelineRange &&
          timelineStartDate &&
          timelineEndDate &&
          formData.startDate &&
          formData.endDate
        ) {
          const timelineStart = new Date(timelineStartDate);
          const timelineEnd = new Date(timelineEndDate);

          // Reset time to compare only dates
          timelineStart.setHours(0, 0, 0, 0);
          timelineEnd.setHours(0, 0, 0, 0);

          // Handle both string and DatePicker object formats
          const itemStartDate = new Date(
            typeof formData.startDate === "string"
              ? formData.startDate
              : formData.startDate.toString(),
          );
          const itemEndDate = new Date(
            typeof formData.endDate === "string"
              ? formData.endDate
              : formData.endDate.toString(),
          );

          // Reset time to compare only dates
          itemStartDate.setHours(0, 0, 0, 0);
          itemEndDate.setHours(0, 0, 0, 0);

          if (itemStartDate < timelineStart || itemStartDate > timelineEnd) {
            newErrors.startDate = t("validation.startDateWithinTimeline");
          }

          if (itemEndDate < timelineStart || itemEndDate > timelineEnd) {
            newErrors.endDate = t("validation.endDateWithinTimeline");
          }
        }
      }

      setErrors(newErrors);

      return Object.keys(newErrors).length === 0;
    },
    [
      t,
      requireName,
      requireStartDate,
      requireEndDate,
      requireDescription,
      requireDepartment,
      minNameLength,
      maxNameLength,
      timelineStartDate,
      timelineEndDate,
      validateTimelineRange,
    ],
  );

  const clearError = useCallback((field: keyof TimelineFormErrors) => {
    setErrors((prev) => {
      const newErrors = { ...prev };

      delete newErrors[field];

      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setCustomError = useCallback(
    (field: keyof TimelineFormErrors, message: string) => {
      setErrors((prev) => ({
        ...prev,
        [field]: message,
      }));
    },
    [],
  );

  return {
    errors,
    validateForm,
    clearError,
    clearAllErrors,
    setCustomError,
    hasErrors: Object.keys(errors).length > 0,
  };
}
