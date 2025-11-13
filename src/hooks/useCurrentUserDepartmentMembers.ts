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
  pageSize: number;
  setPageSize: (size: number) => void;
  addMember: (request: AddDepartmentMemberRequest) => Promise<void>;
  removeMember: (memberId: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useCurrentUserDepartmentMembers = (
  page: number = 1,
  initialLimit: number = 10,
  search?: string,
): UseCurrentUserDepartmentMembersResult => {
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [pageSize, setPageSize] = useState<number>(initialLimit);
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
        pageSize,
        search,
      );

      if (membersResponse.success) {
        setMembers(membersResponse.data);
        // Get pagination info from the pagination object
        const paginationInfo = membersResponse.pagination;
        setTotalCount(paginationInfo?.total || 0);
        setTotalPages(paginationInfo?.totalPages || 0);
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
  }, [page, pageSize, search]);

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

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
  };

  return {
    members,
    loading,
    error,
    totalPages,
    totalCount,
    departmentName,
    departmentId,
    pageSize,
    setPageSize: handlePageSizeChange,
    addMember,
    removeMember,
    refetch: fetchMembers,
  };
};