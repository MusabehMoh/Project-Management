import { TaskDto } from "./tasks";

export interface DesignRequest {
  id: number;
  taskId: number;
  requestedByPrsId: number;
  requestedBy: string;
  requestedDate: string;
  assignedToPrsId?: number;
  assignedTo?: string;
  assignedDate?: string;
  status: number; // 1=Pending, 2=Assigned, 3=Completed
  notes: string;
  task: TaskDto;
}

export interface CreateDesignRequestDto {
  taskId: number;
  notes: string;
}

export interface AssignDesignRequestDto {
  designRequestId: number;
  assignedToPrsId: number;
  notes?: string;
}

export interface DesignRequestsResponse {
  designRequests: DesignRequest[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DesignRequestsSearchParams {
  page?: number;
  limit?: number;
  taskId?: number;
  assignedToPrsId?: number;
  status?: number;
}

export enum DesignRequestStatus {
  Pending = 1,
  Assigned = 2,
  Completed = 3,
}
