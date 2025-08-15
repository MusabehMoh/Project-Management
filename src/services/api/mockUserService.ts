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
import SearchService from "@/services/searchService";

// Mock data
const mockRoles: Role[] = [
  {
    id: 1,
    name: "Administrator",
    active: true,
    roleOrder: 1,
    actions: [
      { id: 1, name: "user.create", categoryName: "User Management", categoryType: "CRUD", description: "Create new users", isActive: true, actionOrder: 1 },
      { id: 2, name: "user.read", categoryName: "User Management", categoryType: "CRUD", description: "View user details", isActive: true, actionOrder: 2 },
      { id: 3, name: "user.update", categoryName: "User Management", categoryType: "CRUD", description: "Update user information", isActive: true, actionOrder: 3 },
      { id: 4, name: "user.delete", categoryName: "User Management", categoryType: "CRUD", description: "Delete users", isActive: true, actionOrder: 4 },
      { id: 9, name: "role.manage", categoryName: "Role Management", categoryType: "ADMIN", description: "Manage user roles", isActive: true, actionOrder: 9 },
      { id: 10, name: "system.admin", categoryName: "System Administration", categoryType: "ADMIN", description: "Full system access", isActive: true, actionOrder: 10 },
    ],
  },
  {
    id: 2,
    name: "Project Manager",
    active: true,
    roleOrder: 2,
    actions: [
      { id: 2, name: "user.read", categoryName: "User Management", categoryType: "CRUD", description: "View user details", isActive: true, actionOrder: 2 },
      { id: 5, name: "project.create", categoryName: "Project Management", categoryType: "CRUD", description: "Create new projects", isActive: true, actionOrder: 5 },
      { id: 6, name: "project.read", categoryName: "Project Management", categoryType: "CRUD", description: "View project details", isActive: true, actionOrder: 6 },
      { id: 7, name: "project.update", categoryName: "Project Management", categoryType: "CRUD", description: "Update project information", isActive: true, actionOrder: 7 },
      { id: 8, name: "project.delete", categoryName: "Project Management", categoryType: "CRUD", description: "Delete projects", isActive: true, actionOrder: 8 },
    ],
  },
  {
    id: 3,
    name: "Team Lead",
    active: true,
    roleOrder: 3,
    actions: [
      { id: 2, name: "user.read", categoryName: "User Management", categoryType: "CRUD", description: "View user details", isActive: true, actionOrder: 2 },
      { id: 6, name: "project.read", categoryName: "Project Management", categoryType: "CRUD", description: "View project details", isActive: true, actionOrder: 6 },
      { id: 7, name: "project.update", categoryName: "Project Management", categoryType: "CRUD", description: "Update project information", isActive: true, actionOrder: 7 },
    ],
  },
  {
    id: 4,
    name: "Developer",
    active: true,
    roleOrder: 4,
    actions: [
      { id: 6, name: "project.read", categoryName: "Project Management", categoryType: "CRUD", description: "View project details", isActive: true, actionOrder: 6 },
    ],
  },
  {
    id: 5,
    name: "Viewer",
    active: true,
    roleOrder: 5,
    actions: [
      { id: 2, name: "user.read", categoryName: "User Management", categoryType: "CRUD", description: "View user details", isActive: true, actionOrder: 2 },
      { id: 6, name: "project.read", categoryName: "Project Management", categoryType: "CRUD", description: "View project details", isActive: true, actionOrder: 6 },
    ],
  },
];

const mockActions: Action[] = [
  // User Management Actions
  {
    id: 1,
    name: "user.create",
    categoryName: "User Management",
    categoryType: "CRUD",
    description: "Create new users",
    isActive: true,
    actionOrder: 1,
  },
  {
    id: 2,
    name: "user.read",
    categoryName: "User Management",
    categoryType: "CRUD",
    description: "View user details",
    isActive: true,
    actionOrder: 2,
  },
  {
    id: 3,
    name: "user.update",
    categoryName: "User Management",
    categoryType: "CRUD",
    description: "Update user information",
    isActive: true,
    actionOrder: 3,
  },
  {
    id: 4,
    name: "user.delete",
    categoryName: "User Management",
    categoryType: "CRUD",
    description: "Delete users",
    isActive: true,
    actionOrder: 4,
  },
  // Project Management Actions
  {
    id: 5,
    name: "project.create",
    categoryName: "Project Management",
    categoryType: "CRUD",
    description: "Create new projects",
    isActive: true,
    actionOrder: 5,
  },
  {
    id: 6,
    name: "project.read",
    categoryName: "Project Management",
    categoryType: "CRUD",
    description: "View project details",
    isActive: true,
    actionOrder: 6,
  },
  {
    id: 7,
    name: "project.update",
    categoryName: "Project Management",
    categoryType: "CRUD",
    description: "Update project information",
    isActive: true,
    actionOrder: 7,
  },
  {
    id: 8,
    name: "project.delete",
    categoryName: "Project Management",
    categoryType: "CRUD",
    description: "Delete projects",
    isActive: true,
    actionOrder: 8,
  },
  // Role Management Actions
  {
    id: 9,
    name: "role.manage",
    categoryName: "Role Management",
    categoryType: "ADMIN",
    description: "Manage user roles",
    isActive: true,
    actionOrder: 9,
  },
  {
    id: 10,
    name: "system.admin",
    categoryName: "System Administration",
    categoryType: "ADMIN",
    description: "Full system access",
    isActive: true,
    actionOrder: 10,
  },
];

const mockEmployees: Employee[] = [
  {
    id: 1,
    userName: "sarah.johnson",
    militaryNumber: "MIL001234",
    gradeName: "Captain",
    fullName: "Sarah Johnson",
    statusId: 1,
  },
  {
    id: 2,
    userName: "mike.chen",
    militaryNumber: "MIL001235",
    gradeName: "Lieutenant",
    fullName: "Mike Chen",
    statusId: 1,
  },
  {
    id: 3,
    userName: "ahmed.hassan",
    militaryNumber: "MIL001240",
    gradeName: "Major",
    fullName: "Ahmed Hassan",
    statusId: 1,
  },
  {
    id: 4,
    userName: "ahmed.ali",
    militaryNumber: "MIL001244",
    gradeName: "عقيد",
    fullName: "أحمد محمد العلي",
    statusId: 1,
  },
  {
    id: 5,
    userName: "fatima.zahra",
    militaryNumber: "MIL001245",
    gradeName: "رائد",
    fullName: "فاطمة حسن الزهراء",
    statusId: 1,
  },
];

const mockUsers: User[] = [
  {
    id: 1,
    userName: "sarah.johnson",
    fullName: "Sarah Johnson",
    militaryNumber: "MIL001234",
    gradeName: "Captain",
    prsId: 1,
    isVisible: true,
    employee: mockEmployees[0],
    roles: [mockRoles[0]], // Administrator
  },
  {
    id: 2,
    userName: "mike.chen",
    fullName: "Mike Chen",
    militaryNumber: "MIL001235",
    gradeName: "Lieutenant",
    prsId: 2,
    isVisible: true,
    employee: mockEmployees[1],
    roles: [mockRoles[1]], // Project Manager
  },
  {
    id: 3,
    userName: "ahmed.hassan",
    fullName: "Ahmed Hassan",
    militaryNumber: "MIL001240",
    gradeName: "Major",
    prsId: 3,
    isVisible: true,
    employee: mockEmployees[2],
    roles: [mockRoles[2]], // Team Lead
  },
  {
    id: 4,
    userName: "ahmed.ali",
    fullName: "أحمد محمد العلي",
    militaryNumber: "MIL001244",
    gradeName: "عقيد",
    prsId: 4,
    isVisible: true,
    employee: mockEmployees[3],
    roles: [mockRoles[3]], // Developer
  },
  {
    id: 5,
    userName: "fatima.zahra",
    fullName: "فاطمة حسن الزهراء",
    militaryNumber: "MIL001245",
    gradeName: "رائد",
    prsId: 5,
    isVisible: true,
    employee: mockEmployees[4],
    roles: [mockRoles[4]], // Viewer
  },
];

// Simulate API delays
const delay = (ms?: number) => new Promise(resolve => setTimeout(resolve, ms || 500));

/**
 * Mock User Management Service
 */
export class MockUserService {
  private users: User[] = [...mockUsers];
  private roles: Role[] = [...mockRoles];
  private actions: Action[] = [...mockActions];
  private employees: Employee[] = [...mockEmployees];
  private currentId: number = Math.max(...this.users.map(u => u.id)) + 1;

  /**
   * Get all users with filtering and pagination
   */
  async getUsers(
    filters?: UserFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<User[]>> {
    await delay();

    let filteredUsers = [...this.users];

    // Apply filters
    if (filters) {
      if (filters.userName) {
        filteredUsers = filteredUsers.filter(u => 
          u.userName.toLowerCase().includes(filters.userName!.toLowerCase())
        );
      }
      if (filters.fullName) {
        filteredUsers = filteredUsers.filter(u => 
          u.employee?.fullName.toLowerCase().includes(filters.fullName!.toLowerCase())
        );
      }
      if (filters.militaryNumber) {
        filteredUsers = filteredUsers.filter(u => 
          u.employee?.militaryNumber.includes(filters.militaryNumber!)
        );
      }
      if (filters.search) {
        // Use unified search service for consistent search behavior
        const searchableUsers = filteredUsers.map(u => ({
          id: u.id,
          name: u.employee?.fullName || u.userName,
          militaryNumber: u.employee?.militaryNumber || '',
          username: u.userName,
          email: '', // Not available in current Employee type
          department: '', // Not available in current Employee type
          rank: u.employee?.gradeName || '',
          isActive: u.isVisible
        }));
        
        const searchResults = SearchService.universalSearch(searchableUsers, filters.search);
        const sortedResults = SearchService.sortByRelevance(searchResults, filters.search);
        
        // Map back to original user objects
        filteredUsers = sortedResults.map(searchResult => 
          filteredUsers.find(u => u.id === searchResult.id)!
        ).filter(Boolean);
      }
      if (filters.roleId) {
        filteredUsers = filteredUsers.filter(u => 
          u.roles?.some(r => r.id === filters.roleId)
        );
      }
      if (filters.isVisible !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.isVisible === filters.isVisible);
      }
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredUsers.length / limit);

    return {
      success: true,
      data: paginatedUsers,
      message: "Users retrieved successfully",
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages,
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<ApiResponse<User>> {
    await delay();

    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    return {
      success: true,
      data: user,
      message: "User retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    await delay();

    // Find employee by prsId
    const employee = this.employees.find(e => e.id === userData.prsId);
    if (!employee) {
      throw new Error(`Employee with ID ${userData.prsId} not found`);
    }

    // Get roles
    const roles = this.roles.filter(r => userData.roleIds.includes(r.id));

    const newUser: User = {
      id: this.currentId++,
      userName: userData.userName,
      fullName: employee.fullName,
      militaryNumber: employee.militaryNumber,
      gradeName: employee.gradeName,
      prsId: userData.prsId,
      isVisible: userData.isVisible,
      employee,
      roles,
    };

    this.users.push(newUser);

    return {
      success: true,
      data: newUser,
      message: "User created successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update user
   */
  async updateUser(userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    await delay();

    const index = this.users.findIndex(u => u.id === userData.id);
    if (index === -1) {
      throw new Error(`User with ID ${userData.id} not found`);
    }

    // Find employee by prsId
    const employee = this.employees.find(e => e.id === userData.prsId);
    if (!employee) {
      throw new Error(`Employee with ID ${userData.prsId} not found`);
    }

    // Get roles
    const roles = this.roles.filter(r => userData.roleIds.includes(r.id));

    const updatedUser: User = {
      ...this.users[index],
      userName: userData.userName,
      prsId: userData.prsId,
      isVisible: userData.isVisible,
      employee,
      roles,
    };

    this.users[index] = updatedUser;

    return {
      success: true,
      data: updatedUser,
      message: "User updated successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<ApiResponse<void>> {
    await delay();

    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found`);
    }

    this.users.splice(index, 1);

    return {
      success: true,
      data: undefined,
      message: "User deleted successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Search employees
   */
  async searchEmployees(query: string): Promise<ApiResponse<EmployeeSearchResult[]>> {
    await delay(300);

    // If query is empty or too short, return first 5 employees for demo
    if (!query || query.length < 1) {
      const results = this.employees.slice(0, 5).map(e => ({
        id: e.id,
        userName: e.userName,
        militaryNumber: e.militaryNumber,
        fullName: e.fullName,
        gradeName: e.gradeName,
        statusId: e.statusId,
      }));

      return {
        success: true,
        data: results,
        message: "Employee search completed",
        timestamp: new Date().toISOString(),
      };
    }

    const searchTerm = query.toLowerCase();
    const results = this.employees
      .filter(e => 
        e.userName.toLowerCase().includes(searchTerm) ||
        e.militaryNumber.toLowerCase().includes(searchTerm) ||
        e.fullName.toLowerCase().includes(searchTerm)
      )
      .map(e => ({
        id: e.id,
        userName: e.userName,
        militaryNumber: e.militaryNumber,
        fullName: e.fullName,
        gradeName: e.gradeName,
        statusId: e.statusId,
      }));

    return {
      success: true,
      data: results,
      message: "Employee search completed",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get employee details
   */
  async getEmployeeDetails(identifier: string): Promise<ApiResponse<Employee>> {
    await delay();

    const employee = this.employees.find(e => 
      e.userName === identifier || e.militaryNumber === identifier
    );

    if (!employee) {
      throw new Error(`Employee with identifier ${identifier} not found`);
    }

    return {
      success: true,
      data: employee,
      message: "Employee details retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    await delay();

    const stats: UserStats = {
      total: this.users.length,
      active: this.users.filter(u => u.isVisible).length,
      inactive: this.users.filter(u => !u.isVisible).length,
      byRole: this.roles.reduce((acc, role) => {
        acc[role.name] = this.users.filter(u => 
          u.roles?.some(r => r.id === role.id)
        ).length;
        return acc;
      }, {} as { [roleName: string]: number }),
    };

    return {
      success: true,
      data: stats,
      message: "User statistics retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get roles
   */
  async getRoles(): Promise<ApiResponse<Role[]>> {
    await delay();

    return {
      success: true,
      data: this.roles,
      message: "Roles retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get actions
   */
  async getActions(): Promise<ApiResponse<Action[]>> {
    await delay();

    return {
      success: true,
      data: this.actions,
      message: "Actions retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current user profile (mock)
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    await delay();

    // Mock current user data
    const currentUser: User = {
      id: 1,
      userName: "sarah.johnson",
      fullName: "Sarah Johnson",
      militaryNumber: "MIL001234",
      gradeName: "Captain",
      department: "IT Department",
      email: "sarah.johnson@organization.mil",
      phone: "+1-555-0101",
      isVisible: true,
      roles: [this.roles[0]], // Administrator role
      actions: this.roles[0].actions || [], // All admin actions
      createdAt: "2024-01-15T08:00:00Z",
      updatedAt: "2024-12-01T10:30:00Z",
    };

    return {
      success: true,
      data: currentUser,
      message: "Current user retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current user claims (mock)
   */
  async getCurrentUserClaims(): Promise<ApiResponse<UserClaims>> {
    await delay();

    // Mock current user as administrator
    const claims: UserClaims = {
      userId: 1,
      userName: "sarah.johnson",
      roles: ["Administrator"],
      actions: this.actions.map(a => a.name),
      permissions: this.actions.map(a => ({
        action: a.name,
        resource: a.categoryName,
        allowed: true,
      })),
    };

    return {
      success: true,
      data: claims,
      message: "User claims retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check permission (mock)
   */
  async checkPermission(action: string, resource: string): Promise<ApiResponse<boolean>> {
    await delay(100);

    // Mock: Administrator has all permissions
    return {
      success: true,
      data: true,
      message: "Permission check completed",
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const mockUserService = new MockUserService();
