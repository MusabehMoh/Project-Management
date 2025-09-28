// Department Management Types
export interface Department {
  id: number;
  name: string;
  nameAr?: string;
  isActive: boolean;
  description?: string;
  memberCount: number;
  members?: DepartmentMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentMember {
  id: number;
  departmentId: number;
  userId: number;
  role: "manager" | "supervisor" | "member";
  joinDate: string;
  isActive: boolean;
  // Employee information
  user: {
    id: number;
    userName: string;
    fullName: string;
    militaryNumber: string;
    gradeName: string;
    email?: string;
    phone?: string;
    department?: string;
  };
}

export interface CreateDepartmentRequest {
  name: string;
  nameAr?: string;
  description?: string;
  status: "active" | "inactive";
}

export interface UpdateDepartmentRequest {
  id: number;
  name: string;
  nameAr?: string;
  description?: string;
  status: "active" | "inactive";
}

export interface AddDepartmentMemberRequest {
  departmentId: number;
  userId?: number;
  userName?: string;
  fullName?: string;
  role?: "manager" | "supervisor" | "member";
}

export interface UpdateDepartmentMemberRequest {
  id: number;
  role: "manager" | "supervisor" | "member";
  isActive: boolean;
}

export interface DepartmentFilters {
  name?: string;
  status?: "active" | "inactive";
  search?: string;
}

export interface DepartmentStats {
  total: number;
  active: number;
  inactive: number;
  totalMembers: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
}
