// User Management Types
export interface User {
  id: number;
  userName: string;
  prsId?: number;
  isActive: boolean;
  // Employee information (flattened from Employee entity)
  fullName: string;
  militaryNumber: string;
  gradeName: string;
  department?: string;
  email?: string;
  phone?: string;
  // Extended properties from EmployeesView
  employee?: Employee;
  roles?: Role[];
  actions?: Action[];
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: number;
  name: string;
  active: boolean;
  roleOrder: number;
  actions?: Action[];
}

export interface Action {
  id: number;
  name: string;
  category: string;
  categoryName: string;
  categoryType: string;
  description: string;
  isActive: boolean;
  relatedActionIds?: number[];
  actionOrder: number;
}

export interface RoleAction {
  id: number;
  roleId: number;
  actionId: number;
  role?: Role;
  action?: Action;
}

export interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  user?: User;
  role?: Role;
}

export interface UserAction {
  userId: number;
  actionId: number;
  user?: User;
  action?: Action;
}

export interface Employee {
  id: number;
  userName: string;
  militaryNumber: string; // Military Number
  gradeName: string;
  fullName: string;
  statusId: number;
}

// Form Data Types
export interface CreateUserRequest {
  userName: string;
  prsId: number;
  isActive: boolean;
  roleIds: number[];
  actionIds?: number[];
}

export interface UpdateUserRequest {
  id: number;
  userName: string;
  prsId: number;
  isActive: boolean;
  roleIds: number[];
  actionIds?: number[];
}

export interface UserFilters {
  userName?: string;
  militaryNumber?: string;
  fullName?: string;
  search?: string; // Combined search for fullName and militaryNumber
  roleId?: number;
  isActive?: boolean;
  statusId?: number;
}

// Authentication Types
export interface UserClaims {
  userId: number;
  userName: string;
  roles: string[];
  actions: string[];
  permissions: Permission[];
}

export interface Permission {
  action: string;
  resource: string;
  allowed: boolean;
}

// API Response Types
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: { [roleName: string]: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search Types
export interface EmployeeSearchResult {
  id: number;
  userName: string;
  militaryNumber: string;
  fullName: string;
  gradeName: string;
  statusId: number;
}
