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