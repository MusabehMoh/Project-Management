export interface TaskDto {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  statusId: number;
  priorityId: number;
  typeId: number; // 1=TimeLine, 2=ChangeRequest, 3=AdHoc
  departmentId?: number;
  department?: {
    id: string | number;
    name: string;
    color: string;
  };
  progress: number;
  memberIds: number[];
  assignedMembers: {
    id: number;
    fullName: string;
    email: string;
    gradeName?: string;
    avatarUrl?: string;
  }[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  hasDesignRequest: boolean;
}