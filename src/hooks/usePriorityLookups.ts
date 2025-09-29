import { useState, useEffect, useCallback } from "react";

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

export function usePriorityLookups(options: PriorityLookupOptions = {}) {
  const [priorities, setPriorities] = useState<LookupDto[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<PriorityOptions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const fetchPriorities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await lookupServiceInstance.getByCode("Priority");

      if (response.success) {
        setPriorities(response.data);

        // Convert to options format for UI components
        const options = response.data
          .filter((priority) => priority.isActive)
          .map((priority: LookupDto) => ({
            key: priority.code.toLowerCase(),
            label: priority.name,
            labelAr: priority.nameAr,
            value: priority.value,
            color: getPriorityColorFromValue(priority.value),
          }))
          .sort((a, b) => a.value - b.value);

        setPriorityOptions(options);
      } else {
        setError(response.message || "Unknown error");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch priorities",
      );
    } finally {
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    if (options.refreshOnMount !== false) {
      fetchPriorities();
    }
  }, [fetchPriorities, options.refreshOnMount]);

  return {
    priorities,
    priorityOptions,
    loading,
    error,
    refetch: fetchPriorities,
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
