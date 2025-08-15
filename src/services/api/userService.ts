import { apiClient } from "./client";
import type {
  User,
  Role,
  Action,
  Employee,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
  UserStats,
  UserClaims,
  EmployeeSearchResult,
  ApiResponse,
} from "@/types/user";

/**
 * User Management Service
 * Handles all user-related API operations including CRUD, roles, and permissions
 */
export class UserService {
  private baseUrl = "/users";

  /**
   * Get all users with filtering and pagination
   */
  async getUsers(
    filters?: UserFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<User[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters && Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value.toString();
        }
        return acc;
      }, {} as Record<string, string>))
    });

    return apiClient.get<User[]>(`${this.baseUrl}?${params}`);
  }

  /**
   * Get user by ID with roles and actions
   */
  async getUserById(id: number): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>(this.baseUrl, userData);
  }

  /**
   * Update user
   */
  async updateUser(userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`${this.baseUrl}/${userData.id}`, userData);
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return apiClient.get<UserStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Search employees by username, military number, or full name
   */
  async searchEmployees(query: string): Promise<ApiResponse<EmployeeSearchResult[]>> {
    const params = new URLSearchParams({ q: query });
    return apiClient.get<EmployeeSearchResult[]>(`/employees/search?${params}`);
  }

  /**
   * Get employee details by username or military number
   */
  async getEmployeeDetails(identifier: string): Promise<ApiResponse<Employee>> {
    const params = new URLSearchParams({ identifier });
    return apiClient.get<Employee>(`/employees/details?${params}`);
  }

  /**
   * Get current user profile with roles and details
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`${this.baseUrl}/me`);
  }

  /**
   * Get current user claims and permissions
   */
  async getCurrentUserClaims(): Promise<ApiResponse<UserClaims>> {
    return apiClient.get<UserClaims>(`${this.baseUrl}/me/claims`);
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(action: string, resource: string): Promise<ApiResponse<boolean>> {
    const params = new URLSearchParams({ action, resource });
    return apiClient.get<boolean>(`${this.baseUrl}/me/permissions/check?${params}`);
  }

  /**
   * Assign roles to user
   */
  async assignRoles(userId: number, roleIds: number[]): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${this.baseUrl}/${userId}/roles`, { roleIds });
  }

  /**
   * Remove roles from user
   */
  async removeRoles(userId: number, roleIds: number[]): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${userId}/roles`);
  }

  /**
   * Assign actions to user
   */
  async assignActions(userId: number, actionIds: number[]): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${this.baseUrl}/${userId}/actions`, { actionIds });
  }

  /**
   * Remove actions from user
   */
  async removeActions(userId: number, actionIds: number[]): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${userId}/actions`);
  }
}

/**
 * Role Management Service
 */
export class RoleService {
  private baseUrl = "/roles";

  /**
   * Get all roles
   */
  async getRoles(): Promise<ApiResponse<Role[]>> {
    return apiClient.get<Role[]>(this.baseUrl);
  }

  /**
   * Get role by ID with actions
   */
  async getRoleById(id: number): Promise<ApiResponse<Role>> {
    return apiClient.get<Role>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create new role
   */
  async createRole(roleData: Omit<Role, 'id'>): Promise<ApiResponse<Role>> {
    return apiClient.post<Role>(this.baseUrl, roleData);
  }

  /**
   * Update role
   */
  async updateRole(role: Role): Promise<ApiResponse<Role>> {
    return apiClient.put<Role>(`${this.baseUrl}/${role.id}`, role);
  }

  /**
   * Delete role
   */
  async deleteRole(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Assign actions to role
   */
  async assignActions(roleId: number, actionIds: number[]): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${this.baseUrl}/${roleId}/actions`, { actionIds });
  }

  /**
   * Remove actions from role
   */
  async removeActions(roleId: number, actionIds: number[]): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${roleId}/actions`);
  }
}

/**
 * Action Management Service
 */
export class ActionService {
  private baseUrl = "/actions";

  /**
   * Get all actions grouped by category
   */
  async getActions(): Promise<ApiResponse<Action[]>> {
    return apiClient.get<Action[]>(this.baseUrl);
  }

  /**
   * Get actions by category
   */
  async getActionsByCategory(categoryName: string): Promise<ApiResponse<Action[]>> {
    const params = new URLSearchParams({ category: categoryName });
    return apiClient.get<Action[]>(`${this.baseUrl}?${params}`);
  }

  /**
   * Get action by ID
   */
  async getActionById(id: number): Promise<ApiResponse<Action>> {
    return apiClient.get<Action>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create new action
   */
  async createAction(actionData: Omit<Action, 'id'>): Promise<ApiResponse<Action>> {
    return apiClient.post<Action>(this.baseUrl, actionData);
  }

  /**
   * Update action
   */
  async updateAction(action: Action): Promise<ApiResponse<Action>> {
    return apiClient.put<Action>(`${this.baseUrl}/${action.id}`, action);
  }

  /**
   * Delete action
   */
  async deleteAction(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}

// Export service instances
export const userService = new UserService();
export const roleService = new RoleService();
export const actionService = new ActionService();
