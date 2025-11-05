import type {
  DepartmentMember,
  AddDepartmentMemberRequest,
} from "@/types/department";

import { useState, useEffect } from "react";

import { departmentService } from "@/services/api";

interface UseCurrentUserDepartmentMembersResult {
  members: DepartmentMember[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalCount: number;
  departmentName: string | null;
  departmentId: number | null;
  addMember: (request: AddDepartmentMemberRequest) => Promise<void>;
  removeMember: (memberId: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useCurrentUserDepartmentMembers = (
  page: number = 1,
  limit: number = 10,
  search?: string,
): UseCurrentUserDepartmentMembersResult => {
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<number | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get current user's department
      const currentUserResponse =
        await departmentService.getCurrentUserDepartment();

      if (!currentUserResponse.success || !currentUserResponse.data) {
        setError("No department assigned to current user");
        setDepartmentId(null);
        setDepartmentName(null);
        setMembers([]);
        setTotalCount(0);
        setTotalPages(0);

        return;
      }

      const userDepartment = currentUserResponse.data;

      setDepartmentId(userDepartment.id);
      setDepartmentName(userDepartment.name);

      // Then get department members
      const membersResponse = await departmentService.getDepartmentMembers(
        userDepartment.id,
        currentPage,
        limit,
        search,
      );

      if (membersResponse.success) {
        setMembers(membersResponse.data);
        setTotalCount(membersResponse.totalCount || 0);
        setTotalPages(membersResponse.totalPages || 0);
      } else {
        setError(
          membersResponse.message || "Failed to fetch department members",
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching current user department members:", err);
      setError("An error occurred while fetching department members");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when dependencies change
  useEffect(() => {
    setCurrentPage(page);
    fetchMembers();
  }, [page, limit, search]);

  // Add member function
  const addMember = async (request: AddDepartmentMemberRequest) => {
    if (!departmentId) {
      throw new Error("No department assigned");
    }

    const response = await departmentService.addDepartmentMember(
      departmentId,
      request,
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to add member");
    }

    // Refresh the members list
    await fetchMembers();
  };

  // Remove member function
  const removeMember = async (memberId: number) => {
    const response = await departmentService.removeDepartmentMember(memberId);

    if (!response.success) {
      throw new Error(response.message || "Failed to remove member");
    }

    // Refresh the members list
    await fetchMembers();
  };

  return {
    members,
    loading,
    error,
    totalPages,
    totalCount,
    departmentName,
    departmentId,
    addMember,
    removeMember,
    refetch: fetchMembers,
  };
};