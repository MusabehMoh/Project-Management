/**
 * Date formatting utilities for the timeline and other components
 */

/**
 * Formats a date string to display date and time (hours:minutes)
 * Handles formats like "2025-09-01T00:00:00" and converts them to readable format
 *
 * @param dateString - The date string to format (ISO format or similar)
 * @param options - Optional formatting options
 * @returns Formatted date string or "-" if invalid
 */
export const formatDateTime = (
  dateString: string | null | undefined,
  options: {
    showTime?: boolean;
    showDate?: boolean;
    language?: string;
  } = {},
): string => {
  if (!dateString) return "-";

  const { showTime = true, showDate = true, language = "en-US" } = options;

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "-";

    // If only showing date
    if (showDate && !showTime) {
      return date.toLocaleDateString(language, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    // If only showing time
    if (!showDate && showTime) {
      return date.toLocaleTimeString(language, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    // Show both date and time
    return date.toLocaleDateString(language, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "-";
  }
};

/**
 * Formats a date range from start to end dates
 *
 * @param startDate - Start date string
 * @param endDate - End date string
 * @param options - Formatting options
 * @returns Formatted date range string
 */
export const formatDateRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  options: {
    showTime?: boolean;
    showDate?: boolean;
    language?: string;
    direction?: "ltr" | "rtl";
  } = {},
): string => {
  const { direction = "ltr" } = options;

  const formattedStart = formatDateTime(startDate, options);
  const formattedEnd = formatDateTime(endDate, options);

  if (formattedStart === "-" && formattedEnd === "-") return "-";
  if (formattedStart === "-") return formattedEnd;
  if (formattedEnd === "-") return formattedStart;

  const arrow = direction === "rtl" ? "←" : "→";

  return `${formattedStart} ${arrow} ${formattedEnd}`;
};

/**
 * Formats just the date part (without time)
 *
 * @param dateString - The date string to format
 * @param language - Language for formatting
 * @returns Formatted date string
 */
export const formatDateOnly = (
  dateString: string | null | undefined,
  language = "en-US",
): string => {
  return formatDateTime(dateString, { showTime: false, language });
};

/**
 * Formats just the time part (without date)
 *
 * @param dateString - The date string to format
 * @param language - Language for formatting
 * @returns Formatted time string
 */
export const formatTimeOnly = (
  dateString: string | null | undefined,
  language = "en-US",
): string => {
  return formatDateTime(dateString, { showDate: false, language });
};

/**
 * Formats relative time (e.g., "22 minutes ago")
 *
 * @param dateString - The date string to format
 * @param language - Language for formatting ("en" or "ar")
 * @returns Relative time string
 */
export const formatRelativeTime = (
  dateString: string | null | undefined,
  language: "en" | "ar" = "en",
): string => {
  if (!dateString) return "-";

  try {
    const now = new Date();
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "-";

    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return language === "ar" ? "الآن" : "Just now";
    } else if (diffInMinutes < 60) {
      return language === "ar"
        ? `منذ ${diffInMinutes} دقيقة`
        : `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
    } else if (diffInHours < 24) {
      return language === "ar"
        ? `منذ ${diffInHours} ساعة`
        : `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    } else if (diffInDays < 7) {
      return language === "ar"
        ? `منذ ${diffInDays} يوم`
        : `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    } else {
      return formatDateOnly(dateString, language === "ar" ? "ar" : "en-US");
    }
  } catch {
    return "-";
  }
};
