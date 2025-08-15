export interface Project {
  id: number;
  applicationName: string;
  projectOwner: string;
  alternativeOwner: string;
  owningUnit: string;
  startDate: string;
  expectedCompletionDate: string;
  description: string;
  remarks: string;
  status: "planning" | "active" | "on-hold" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
  priority?: "low" | "medium" | "high";
  budget?: number;
  progress?: number;
}

export interface User {
  id: number;
  name: string;
  militaryNumber: string;
  username: string;
  department: string;
  rank: string;
  email?: string;
  phone?: string;
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
  projectOwner: string;
  alternativeOwner: string;
  owningUnit: string;
  startDate: any; // CalendarDate | null
  expectedCompletionDate: any; // CalendarDate | null
  description: string;
  remarks: string;
  status: string;
}

export interface ProjectStats {
  total: number;
  active: number;
  planning: number;
  completed: number;
  onHold: number;
  cancelled?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
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
  owningUnit?: string;
  projectOwner?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CreateProjectRequest {
  applicationName: string;
  projectOwner: string;
  alternativeOwner?: string;
  owningUnit: string;
  startDate: string;
  expectedCompletionDate: string;
  description: string;
  remarks?: string;
  status: string;
  priority?: string;
  budget?: number;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: number;
}
