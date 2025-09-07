// Timeline requirement management types
export interface TimelineRequirement {
  id: number;
  requirementId: number;
  timelineId?: number;
  status: "pending" | "timeline_created" | "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  assignedManager?: number;
  // Related data
  requirement?: {
    id: number;
    name: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
    expectedCompletionDate: string;
    status: "draft" | "in-development" | "completed";
    project?: {
      id: number;
      applicationName: string;
      projectOwner: string;
      owningUnit: string;
    };
    createdBy: number;
    assignedAnalyst?: number;
  };
  timeline?: {
    id: number;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    projectId: number;
  };
}

export interface CreateTimelineFromRequirementRequest {
  requirementId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedManager?: number;
}

export interface UpdateTimelineRequirementRequest {
  id: number;
  status?: "pending" | "timeline_created" | "in_progress" | "completed";
  assignedManager?: number;
  timelineId?: number;
}
