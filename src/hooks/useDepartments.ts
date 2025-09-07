import type {
  Department,
  DepartmentMember,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  AddDepartmentMemberRequest,
  UpdateDepartmentMemberRequest,
  DepartmentFilters,
  DepartmentStats,
} from "@/types/department";

import { useState, useEffect } from "react";

import { departmentService } from "@/services/api";
// import { departmentService } from "@/services/api/departmentService"; // Use for real API

// Hook for managing departments
export const useDepartments = (
  filters?: DepartmentFilters,
  page: number = 1,
  limit: number = 20,
) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use mock service for development
      const response = await departmentService.getDepartments(
        filters,
        currentPage,
        limit,
      );
      // const response = await departmentService.getDepartments(filters, currentPage, limit); // Use for real API

      if (response.success) {
        setDepartments(response.data);
        setTotalCount(response.totalCount || 0);
        setTotalPages(response.totalPages || 0);
      } else {
        setError(response.message || "Failed to fetch departments");
      }
    } catch (err) {
      setError("An error occurred while fetching departments");
      console.error("Error fetching departments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [currentPage, limit, JSON.stringify(filters)]);

  const createDepartment = async (request: CreateDepartmentRequest) => {
    try {
      setError(null);

      const response = await departmentService.createDepartment(request);
      // const response = await departmentService.createDepartment(request); // Use for real API

      if (response.success) {
        await fetchDepartments(); // Refresh the list

        return response.data;
      } else {
        setError(response.message || "Failed to create department");
        throw new Error(response.message || "Failed to create department");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while creating department";

      setError(errorMessage);
      throw err;
    }
  };

  const updateDepartment = async (request: UpdateDepartmentRequest) => {
    try {
      setError(null);

      const response = await departmentService.updateDepartment(request);
      // const response = await departmentService.updateDepartment(request); // Use for real API

      if (response.success) {
        await fetchDepartments(); // Refresh the list

        return response.data;
      } else {
        setError(response.message || "Failed to update department");
        throw new Error(response.message || "Failed to update department");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while updating department";

      setError(errorMessage);
      throw err;
    }
  };

  const deleteDepartment = async (id: number) => {
    try {
      setError(null);

      const response = await departmentService.deleteDepartment(id);
      // const response = await departmentService.deleteDepartment(id); // Use for real API

      if (response.success) {
        await fetchDepartments(); // Refresh the list

        return true;
      } else {
        setError(response.message || "Failed to delete department");
        throw new Error(response.message || "Failed to delete department");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while deleting department";

      setError(errorMessage);
      throw err;
    }
  };

  return {
    departments,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    setCurrentPage,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    refetch: fetchDepartments,
  };
};

// Hook for managing department details
export const useDepartment = (id: number) => {
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartment = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await departmentService.getDepartmentById(id);
      // const response = await departmentService.getDepartmentById(id); // Use for real API

      if (response.success) {
        setDepartment(response.data);
      } else {
        setError(response.message || "Failed to fetch department");
      }
    } catch (err) {
      setError("An error occurred while fetching department");
      console.error("Error fetching department:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartment();
  }, [id]);

  return {
    department,
    loading,
    error,
    refetch: fetchDepartment,
  };
};

// Hook for managing department members
export const useDepartmentMembers = (
  departmentId: number,
  page: number = 1,
  limit: number = 20,
  searchTerm: string = "",
) => {
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);

  const fetchMembers = async () => {
    if (!departmentId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await departmentService.getDepartmentMembers(
        departmentId,
        currentPage,
        limit,
      );
      // const response = await departmentService.getDepartmentMembers(departmentId, currentPage, limit); // Use for real API

      if (response.success) {
        let filteredMembers = response.data;

        // Apply client-side search filtering
        if (searchTerm.trim()) {
          filteredMembers = response.data.filter(
            (member) =>
              member.user.fullName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              member.user.userName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              member.user.militaryNumber
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              member.user.gradeName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()),
          );
          // Reset to first page when searching
          setCurrentPage(1);
        }

        setMembers(filteredMembers);
        setTotalCount(filteredMembers.length);
        setTotalPages(Math.ceil(filteredMembers.length / limit));
      } else {
        setError(response.message || "Failed to fetch members");
      }
    } catch (err) {
      setError("An error occurred while fetching members");
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [departmentId, currentPage, limit, searchTerm]);

  const addMember = async (request: AddDepartmentMemberRequest) => {
    try {
      setError(null);

      const response = await departmentService.addDepartmentMember(request);
      // const response = await departmentService.addDepartmentMember(request); // Use for real API

      if (response.success) {
        await fetchMembers(); // Refresh the list

        return response.data;
      } else {
        setError(response.message || "Failed to add member");
        throw new Error(response.message || "Failed to add member");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while adding member";

      setError(errorMessage);
      throw err;
    }
  };

  const updateMember = async (request: UpdateDepartmentMemberRequest) => {
    try {
      setError(null);

      const response = await departmentService.updateDepartmentMember(request);
      // const response = await departmentService.updateDepartmentMember(request); // Use for real API

      if (response.success) {
        await fetchMembers(); // Refresh the list

        return response.data;
      } else {
        setError(response.message || "Failed to update member");
        throw new Error(response.message || "Failed to update member");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while updating member";

      setError(errorMessage);
      throw err;
    }
  };

  const removeMember = async (memberId: number) => {
    try {
      setError(null);

      const response = await departmentService.removeDepartmentMember(memberId);
      // const response = await departmentService.removeDepartmentMember(memberId); // Use for real API

      if (response.success) {
        await fetchMembers(); // Refresh the list

        return true;
      } else {
        setError(response.message || "Failed to remove member");
        throw new Error(response.message || "Failed to remove member");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while removing member";

      setError(errorMessage);
      throw err;
    }
  };

  return {
    members,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    setCurrentPage,
    addMember,
    updateMember,
    removeMember,
    refetch: fetchMembers,
  };
};

// Hook for department statistics
export const useDepartmentStats = () => {
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await departmentService.getDepartmentStats();
      // const response = await departmentService.getDepartmentStats(); // Use for real API

      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message || "Failed to fetch statistics");
      }
    } catch (err) {
      setError("An error occurred while fetching statistics");
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

// Hook for searching available users to add to department
export const useAvailableUsers = (departmentId: number) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = async (
    query: string,
    page: number = 1,
    limit: number = 10,
  ) => {
    if (!query.trim()) {
      setUsers([]);

      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const response = await departmentService.searchAvailableUsers(
        departmentId,
        query,
        page,
        limit,
      );
      // const response = await departmentService.searchAvailableUsers(departmentId, query, page, limit); // Use for real API

      if (response.success) {
        setUsers(response.data);

        return response.data;
      } else {
        setError(response.message || "Failed to search users");

        return [];
      }
    } catch (err) {
      setError("An error occurred while searching users");
      console.error("Error searching users:", err);

      return [];
    } finally {
      setLoading(false);
    }
  };

  const clearUsers = () => {
    setUsers([]);
    setError(null);
  };

  return {
    users,
    loading,
    error,
    searchUsers,
    clearUsers,
  };
};
