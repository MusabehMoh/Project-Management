import { useEffect } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { siteConfig } from "@/config/site";

/**
 * Custom hook for setting page titles consistently across the application
 *
 * @param titleKey - The translation key for the page title
 * @param options - Additional options for title formatting
 * @param options.appendAppName - Whether to append the app name (default: true)
 * @param options.separator - The separator between title and app name (default: " - ")
 * @param options.fallback - Fallback title if translation key is not found
 */
export const usePageTitle = (
  titleKey?: string,
  options: {
    appendAppName?: boolean;
    separator?: string;
    fallback?: string;
  } = {},
) => {
  const { t } = useLanguage();

  const { appendAppName = true, separator = " - ", fallback } = options;

  // The app name from site config, or "PMA" as fallback
  const appName = siteConfig.name || "PMA";

  useEffect(() => {
    // If no title key is provided, just use the app name
    if (!titleKey) {
      document.title = appName;

      return;
    }

    // Try to get the translated title
    const translatedTitle = titleKey ? t(titleKey) : "";

    // Use the translation, fallback, or the key itself if neither is available
    const pageTitle = translatedTitle || fallback || titleKey;

    // Set the document title, with app name appended if requested
    document.title = appendAppName
      ? `${pageTitle}${separator}${appName}`
      : pageTitle;

    // Clean up function - reset to app name
    return () => {
      document.title = appName;
    };
  }, [titleKey, t, appName, appendAppName, separator, fallback]);
};
