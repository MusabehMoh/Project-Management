import type { ProjectStatus } from "@/services/api/ProjectStatusService";

import { useState, useEffect } from "react";

import { projectStatusApiService } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";

export interface UseProjectStatus {
  phases: ProjectStatus[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getProjectStatusByCode: (code: number) => ProjectStatus | undefined;
  getProjectStatusName: (code: number) => string;
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
      const response = await projectStatusApiService.getProjectStatus();

      if (response.success) {
        setPhases(response.data);
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

  return {
    phases,
    loading,
    error,
    refetch: fetchPhases,
    getProjectStatusByCode,
    getProjectStatusName,
  };
}
