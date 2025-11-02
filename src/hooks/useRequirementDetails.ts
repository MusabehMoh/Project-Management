import type { ProjectRequirement } from "@/types/projectRequirement";

import { useState, useEffect } from "react";

import { projectRequirementsService } from "@/services/api";

interface UseRequirementDetailsOptions {
  requirementId: number | undefined;
  enabled?: boolean;
}

interface UseRequirementDetailsResult {
  requirement: ProjectRequirement | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRequirementDetails(
  options: UseRequirementDetailsOptions,
): UseRequirementDetailsResult {
  const { requirementId, enabled = true } = options;
  const [requirement, setRequirement] = useState<ProjectRequirement | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequirementDetails = async () => {
    if (!requirementId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response =
        await projectRequirementsService.getRequirement(requirementId);

      if (response) {
        setRequirement(response);
      } else {
        setError("Requirement not found");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch requirement details";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementDetails();
  }, [requirementId, enabled]);

  return {
    requirement,
    loading,
    error,
    refetch: fetchRequirementDetails,
  };
}
