import type { MemberSearchResult } from "@/types/timeline";

import { useState, useEffect } from "react";

import { membersTasksService } from "@/services/api/membersTasksService";

interface UseTeamMembersResult {
  teamMembers: MemberSearchResult[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch team members for assignee filtering
 * Returns team members based on user role and department access
 */
export function useTeamMembers(): UseTeamMembersResult {
  const [teamMembers, setTeamMembers] = useState<MemberSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await membersTasksService.getTeamMembers();

      if (response.success && response.data) {
        setTeamMembers(response.data);
      } else {
        setError(response.message || "Failed to fetch team members");
        setTeamMembers([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch team members";

      setError(errorMessage);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  return {
    teamMembers,
    loading,
    error,
    refetch: fetchTeamMembers,
  };
}

export default useTeamMembers;
