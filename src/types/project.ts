export interface Project {
  id: number;
  applicationName: string;
  // Employee objects for project owners
  projectOwnerEmployee?: Employee; // Full employee object for project owner
  alternativeOwnerEmployee?: Employee; // Full employee object for alternative owner
  owningUnit: string; // Display name for owning unit
  // Numeric IDs for edit/create operations
  projectOwnerId: number; // Actual ID for project owner (prsId)
  alternativeOwnerId: number; // Actual ID for alternative owner (prsId)
  owningUnitId: number; // Actual ID for owning unit
  analysts?: string; // Display names for analysts (comma-separated)
  analystIds?: number[]; // Actual IDs for analysts
  managerIds?: number[]; // Actual IDs for managers
  startDate: string;
  expectedCompletionDate: string;
  description: string;
  remarks: string;
  status: 1 | 2 | 3 | 4 | 5;
  createdAt?: string;
  updatedAt?: string;
  priority?: "low" | "medium" | "high";
  budget?: number;
  progress?: number;
}

export interface Employee {
  id: number;
  userName: string;
  militaryNumber: string;
  gradeName: string;
  fullName: string;
  statusId: number;
  department?: string;
}

export interface User {
  id: number;
  userName: string;
  prsId?: number;
  militaryNumber: string;
  gradeName: string;
  fullName: string;
  statusId: number;
  department?: string;
  isVisible?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OwningUnit {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  parentUnitId?: number;
  commander?: string;
}

export interface ProjectFormData {
  applicationName: string;
  projectOwner: number; // Numeric ID for project owner (prsId)
  alternativeOwner: number; // Numeric ID for alternative owner (prsId)
  owningUnit: number; // Numeric ID for owning unit
  analysts?: number[]; // Array of numeric IDs for analysts
  managers?: number[]; // Array of numeric IDs for managers
  startDate: any; // CalendarDate | null
  expectedCompletionDate: any; // CalendarDate | null
  description: string;
  remarks: string;
  status: number; // Phase code (1-5)
}

export interface ProjectStats {
  total: number;
  new: number; // New (جديد)
  delayed: number; // Delayed (مؤجل)
  underStudy: number; // Under Review (قيد الدراسة)
  underTesting: number; // Under Testing (قيد الأختبار)
  underDevelopment: number; // Under Development (قيد التطوير)
  production: number; // Production Environment (بيئة الانتاج)
  statusNames?: {
    new: { en: string; ar: string };
    underStudy: { en: string; ar: string };
    underDevelopment: { en: string; ar: string };
    underTesting: { en: string; ar: string };
    production: { en: string; ar: string };
    delayed: { en: string; ar: string };
  };
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

export interface ProjectFilters {
  status?: string;
  owningUnit?: number; // Numeric ID for owning unit filtering
  projectOwner?: number; // Numeric ID for project owner filtering
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CreateProjectRequest {
  applicationName: string;
  projectOwner: number; // Numeric ID for project owner (prsId)
  alternativeOwner?: number; // Numeric ID for alternative owner (prsId)
  owningUnit: number; // Numeric ID for owning unit
  analysts?: number[]; // Array of numeric IDs for analysts
  units: number[];
  startDate: string;
  expectedCompletionDate: string;
  description: string;
  remarks?: string;
  status: number; // Phase code (1-5)
  priority?: string;
  budget?: number;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: number;
}
