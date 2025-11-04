import type {
  Department,
  DepartmentMember,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  AddDepartmentMemberRequest,
  UpdateDepartmentMemberRequest,
  DepartmentFilters,
  DepartmentStats,
  ApiResponse,
} from "@/types/department";

import { apiClient } from "./client";

/**
 * Department Management Service
 * Handles all department-related API operations including CRUD and member management
 */
export class DepartmentService {
  private baseUrl = "/departments";

  /**
   * Get all departments with filtering and pagination
   */
  async getDepartments(
    filters?: DepartmentFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiResponse<Department[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters &&
        Object.entries(filters).reduce(
          (acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              acc[key] = value.toString();
            }

            return acc;
          },
          {} as Record<string, string>,
        )),
    });

    return apiClient.get<Department[]>(`${this.baseUrl}?${params}`);
  }

  /**
   * Get department by ID with members
   */
  async getDepartmentById(id: number): Promise<ApiResponse<Department>> {
    return apiClient.get<Department>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new department
   */
  async createDepartment(
    request: CreateDepartmentRequest,
  ): Promise<ApiResponse<Department>> {
    return apiClient.post<Department>(this.baseUrl, request);
  }

  /**
   * Update an existing department
   */
  async updateDepartment(
    request: UpdateDepartmentRequest,
  ): Promise<ApiResponse<Department>> {
    return apiClient.put<Department>(`${this.baseUrl}/${request.id}`, request);
  }

  /**
   * Delete a department
   */
  async deleteDepartment(id: number): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(): Promise<ApiResponse<DepartmentStats>> {
    return apiClient.get<DepartmentStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Get current user's department
   */
  async getCurrentUserDepartment(): Promise<ApiResponse<Department>> {
    return apiClient.get<Department>(`${this.baseUrl}/current-user`);
  }

  // Member Management Methods

  /**
   * Get members of a specific department
   */
  async getDepartmentMembers(
    departmentId: number,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<ApiResponse<DepartmentMember[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search && search.trim()) {
      params.append("search", search.trim());
    }

    return apiClient.get<DepartmentMember[]>(
      `${this.baseUrl}/${departmentId}/members?${params}`,
    );
  }

  /**
   * Add a member to a department
   */
  async addDepartmentMember(
    departmentId: number,
    request: AddDepartmentMemberRequest,
  ): Promise<ApiResponse<DepartmentMember>> {
    return apiClient.post<DepartmentMember>(
      `${this.baseUrl}/${departmentId}/members`,
      request,
    );
  }

  /**
   * Update a department member
   */
  async updateDepartmentMember(
    request: UpdateDepartmentMemberRequest,
  ): Promise<ApiResponse<DepartmentMember>> {
    return apiClient.put<DepartmentMember>(
      `${this.baseUrl}/members/${request.id}`,
      request,
    );
  }

  /**
   * Remove a member from a department
   */
  async removeDepartmentMember(
    memberId: number,
  ): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>(`${this.baseUrl}/members/${memberId}`);
  }

  /**
   * Search available users to add to department
   */
  async searchAvailableUsers(
    departmentId: number,
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      limit: limit.toString(),
      excludeDepartment: departmentId.toString(),
    });

    return apiClient.get<any[]>(`/users/search?${params}`);
  }
}

// Create and export a singleton instance
export const departmentService = new DepartmentService();
