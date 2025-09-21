import { useState, useEffect } from "react";

import { lookupService } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { LookupDto } from "@/types/timeline";

// Map LookupDto to ProjectStatus for backward compatibility
export interface ProjectStatus {
  id: number;
  nameEn: string;
  nameAr: string;
  code: number;
  isActive: boolean;
  order: number;
}

export interface UseProjectStatus {
  phases: ProjectStatus[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getProjectStatusByCode: (code: number) => ProjectStatus | undefined;
  getProjectStatusName: (code: number) => string;
  getProjectStatusColor: (
    code: number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
}

export function useProjectStatus(): UseProjectStatus {
  const [phases, setPhases] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const fetchPhases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await lookupService.getByCode("ProjectStatus");

      if (response.success) {
        // Map LookupDto to ProjectStatus for backward compatibility
        const mappedPhases: ProjectStatus[] = response.data.map(
          (lookup: LookupDto) => ({
            id: lookup.id,
            nameEn: lookup.name,
            nameAr: lookup.nameAr,
            code: lookup.value,
            isActive: lookup.isActive,
            order: lookup.value, // Use value as order since they're similar
          }),
        );

        setPhases(mappedPhases);
      } else {
        throw new Error(response.message || "Failed to fetch phases");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhases();
  }, []);

  const getProjectStatusByCode = (code: number): ProjectStatus | undefined => {
    return phases.find((phase) => phase.code === code);
  };

  const getProjectStatusName = (code: number): string => {
    const phase = getProjectStatusByCode(code);

    if (!phase) return `Phase ${code}`;

    return language === "ar" ? phase.nameAr : phase.nameEn;
  };

  const getProjectStatusColor = (
    code: number,
  ): "warning" | "danger" | "primary" | "secondary" | "success" | "default" => {
    switch (code) {
      case 1: // Under Study
        return "warning";
      case 2: // Delayed
        return "danger";
      case 3: // Under Review
        return "primary";
      case 4: // Under Development
        return "secondary";
      case 5: // Production
        return "success";
      default:
        return "default";
    }
  };

  return {
    phases,
    loading,
    error,
    refetch: fetchPhases,
    getProjectStatusByCode,
    getProjectStatusName,
    getProjectStatusColor,
  };
}
