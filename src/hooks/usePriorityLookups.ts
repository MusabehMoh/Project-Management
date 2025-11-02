import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useLanguage } from "@/contexts/LanguageContext";
import { LookupDto } from "@/types/timeline";
import { lookupServiceInstance } from "@/services/api";

export interface PriorityOptions {
  key: string;
  label: string;
  labelAr: string;
  value: number;
  color: string;
}

export interface PriorityLookupOptions {
  useCache?: boolean;
  refreshOnMount?: boolean;
}

export function usePriorityLookups(_options: PriorityLookupOptions = {}) {
  const { language } = useLanguage();

  // Fetch priorities using React Query - automatic caching and deduplication
  const {
    data = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["priorities"],
    queryFn: async () => {
      const response = await lookupServiceInstance.getByCode("Priority");

      if (response.success) {
        return response.data;
      }

      throw new Error(response.message || "Unknown error");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to fetch priorities"
    : null;
  const priorities = data;

  // Convert to options format for UI components
  const priorityOptions = useMemo(() => {
    return priorities
      .filter((priority) => priority.isActive)
      .map((priority: LookupDto) => ({
        key: priority.code.toLowerCase(),
        label: priority.name,
        labelAr: priority.nameAr,
        value: priority.value,
        color: getPriorityColorFromValue(priority.value),
      }))
      .sort((a, b) => a.value - b.value);
  }, [priorities]);

  const getPriorityByValue = useCallback(
    (value: number) => {
      return priorities.find((priority: LookupDto) => priority.value === value);
    },
    [priorities],
  );

  const getPriorityByKey = useCallback(
    (key: string | number) => {
      if (typeof key === "number") {
        return priorities.find((priority: LookupDto) => priority.value === key);
      }

      return priorities.find(
        (priority: LookupDto) =>
          priority.code.toLowerCase() === key.toLowerCase(),
      );
    },
    [priorities],
  );

  const getPriorityLabel = useCallback(
    (value: number) => {
      const priority = getPriorityByValue(value);

      return language === "ar"
        ? priority?.nameAr
        : priority?.name || `Priority ${value}`;
    },
    [getPriorityByValue, language],
  );

  const getPriorityColor = useCallback((value: number) => {
    return getPriorityColorFromValue(value);
  }, []);

  const getPriorityValue = useCallback(
    (key: string | number) => {
      const priority = getPriorityByKey(key);

      return priority?.value || 0;
    },
    [getPriorityByKey],
  );

  const getPriorityKey = useCallback(
    (value: number) => {
      const priority = getPriorityByValue(value);

      return priority?.code.toLowerCase() || "";
    },
    [getPriorityByValue],
  );

  return {
    priorities,
    priorityOptions,
    loading,
    error,
    refetch,
    getPriorityByValue,
    getPriorityByKey,
    getPriorityLabel,
    getPriorityColor,
    getPriorityValue,
    getPriorityKey,
  };
}

// Helper function to map priority values to colors
function getPriorityColorFromValue(
  value: number,
): "success" | "warning" | "danger" | "default" {
  switch (value) {
    case 1:
      return "success"; // low
    case 2:
      return "warning"; // medium
    case 3:
      return "danger"; // high
    case 4:
      return "danger"; // critical
    default:
      return "default";
  }
}
