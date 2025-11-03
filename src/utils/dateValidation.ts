import type { DateValue } from "@react-types/calendar";

import { getLocalTimeZone, today } from "@internationalized/date";

/**
 * Checks if a DateValue object has a complete and valid format
 * @param value - The date value to check
 * @returns true if date is complete and valid, false otherwise
 */
export const isDateFormatValid = (
  value: DateValue | null | undefined,
): boolean => {
  if (!value) {
    return false;
  }

  // Check if year has 4 digits (should be >= 1000)
  if (value.year < 1000) {
    return false;
  }

  // Check if month is valid (1-12)
  if (value.month < 1 || value.month > 12) {
    return false;
  }

  // Check if day is valid (1-31)
  if (value.day < 1 || value.day > 31) {
    return false;
  }

  return true;
};

/**
 * Validates that a date is not in the past
 * @param value - The date value to validate
 * @param t - Translation function from useLanguage hook
 * @returns Validation result: true if valid, error message if invalid, null/undefined if required error
 */

export const validateDateNotInPast = (
  value: DateValue | null,
  t: (key: string) => string,
): string | true | null | undefined => {
  if (!value) {
    return t("common.validation.dateRequired");
  }

  const todayDate = today(getLocalTimeZone());

  // Compare: if selected date is before today → invalid
  if (value.compare(todayDate) < 0) {
    return t("common.validation.dateCannotBeInPast");
  }

  return true; // valid
};

/**
 * Validates that expected completion date is after start date and not in the past
 * @param value - The date value to validate
 * @param startDate - The project start date to compare against
 * @param t - Translation function from useLanguage hook
 * @returns Validation result: true if valid, error message if invalid, null/undefined if required error
 */
export const validateExpectedCompletionDate = (
  value: DateValue | null,
  startDate: DateValue | null,
  t: (key: string) => string,
): string | true | null | undefined => {
  if (!value) {
    return t("common.validation.dateRequired");
  }

  const todayDate = today(getLocalTimeZone());

  // Compare: if selected date is before today → invalid
  if (value.compare(todayDate) < 0) {
    return t("common.validation.dateCannotBeInPast");
  }

  // Check if expected completion date is after start date
  if (startDate && value.compare(startDate) <= 0) {
    return t("projects.validation.expectedCompletionAfterStart");
  }

  return true; // valid
};
