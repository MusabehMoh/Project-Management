import { useState, useEffect } from "react";

import { lookupService } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { LookupDto } from "@/types/timeline";

// Map LookupDto to RequirementStatus for compatibility
export interface RequirementStatus {
  id: number;
  nameEn: string;
  nameAr: string;
  value: number;
  code: string;
  isActive: boolean;
  order: number;
}

export interface UseRequirementStatus {
  statuses: RequirementStatus[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getRequirementStatusByCode: (code: number) => RequirementStatus | undefined;
  getRequirementStatusName: (code: number) => string;
  getRequirementStatusColor: (
    code: number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
}

export function useRequirementStatus(): UseRequirementStatus {
  const [statuses, setStatuses] = useState<RequirementStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await lookupService.getByCode("RequirementStatus");

      if (response.success) {
        // Map LookupDto to RequirementStatus for compatibility
        const mappedStatuses: RequirementStatus[] = response.data.map(
          (lookup: LookupDto) => ({
            id: lookup.id,
            nameEn: lookup.name,
            nameAr: lookup.nameAr,
            code: lookup.code,
            value: lookup.value,
            isActive: lookup.isActive,
            order: lookup.value, // Use value as order since they're similar
          }),
        );

        setStatuses(mappedStatuses);
      } else {
        throw new Error(
          response.message || "Failed to fetch requirement statuses",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const getRequirementStatusByCode = (
    value: number,
  ): RequirementStatus | undefined => {
    return statuses.find((status) => status.value === value);
  };

  const getRequirementStatusName = (value: number): string => {
    const status = getRequirementStatusByCode(value);

    if (!status) return `Status ${value}`;

    // Use translation key format for dynamic translation
    return language === "ar" ? status.nameAr : status.nameEn;
  };

  const getRequirementStatusColor = (
    code: number,
  ): "warning" | "danger" | "primary" | "secondary" | "success" | "default" => {
    switch (code) {
      case 1: // New
        return "default";
      case 2: // Manager Review
        return "warning";
      case 3: // Approved
        return "success";
      case 4: // Under Development
        return "primary";
      case 5: // Under Testing
        return "secondary";
      case 6: // Completed
        return "success";
      default:
        return "default";
    }
  };

  return {
    statuses,
    loading,
    error,
    refetch: fetchStatuses,
    getRequirementStatusByCode,
    getRequirementStatusName,
    getRequirementStatusColor,
  };
}
