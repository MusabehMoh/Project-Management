export interface Project {
  id: number;
  applicationName: string;
  // Display names (strings) for table display - with fallbacks for undefined values
  projectOwner: string; // Display name for project owner
  alternativeOwner: string; // Display name for alternative owner
  owningUnit: string; // Display name for owning unit
  // Numeric IDs for edit/create operations
  projectOwnerId: number; // Actual ID for project owner (prsId)
  alternativeOwnerId: number; // Actual ID for alternative owner (prsId)
  owningUnitId: number; // Actual ID for owning unit
  analysts?: string; // Display names for analysts (comma-separated)
  analystIds?: number[]; // Actual IDs for analysts
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

export interface User {
  id: number;
  userName: string;
  prsId: number;
  isVisible: boolean;
  fullName: string;
  militaryNumber: string;
  gradeName: string;
  department: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  // Legacy properties for backward compatibility
  name?: string;
  username?: string;
  rank?: string;
  isActive?: boolean;
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
  underReview: number; // Under Review (قيد الدراسة)
  underDevelopment: number; // Under Development (قيد التطوير)
  production: number; // Production Environment (بيئة الانتاج)
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
