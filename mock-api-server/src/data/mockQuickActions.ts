// Mock data for quick actions
export const mockQuickActionStats = {
  pendingRequirements: 7,
  unassignedTasks: 12,
  unassignedProjects: 5,
  pendingApprovals: 4,
  overdueItems: 3,
  newNotifications: 8,
  activeProjects: 15,
};

export const mockOverdueItems = [
  {
    id: 1,
    title: "Security Assessment Review",
    type: "task" as const,
    dueDate: "2025-09-10T00:00:00Z",
    priority: "high" as const,
    assignee: "Ahmed Hassan",
    projectName: "Banking Portal Security",
  },
  {
    id: 2,
    title: "Database Migration Planning",
    type: "project" as const,
    dueDate: "2025-09-08T00:00:00Z",
    priority: "medium" as const,
    assignee: "Sarah Mohammed",
    projectName: "Legacy System Migration",
  },
  {
    id: 3,
    title: "API Documentation Requirements",
    type: "requirement" as const,
    dueDate: "2025-09-12T00:00:00Z",
    priority: "low" as const,
    assignee: "Omar Ali",
    projectName: "Mobile App Backend",
  },
];

export const mockPendingApprovals = [
  {
    id: 1,
    title: "Banking Portal Security - Move to Development",
    type: "project_status" as const,
    requestedBy: "Ahmed Hassan",
    requestedAt: "2025-09-14T10:30:00Z",
    currentStatus: "Under Review",
    requestedStatus: "Under Development",
    priority: "high" as const,
  },
  {
    id: 2,
    title: "User Authentication Requirements",
    type: "requirement" as const,
    requestedBy: "Sarah Mohammed",
    requestedAt: "2025-09-14T14:20:00Z",
    currentStatus: "Draft",
    requestedStatus: "Approved",
    priority: "medium" as const,
  },
  {
    id: 3,
    title: "Performance Testing Task Completion",
    type: "task_completion" as const,
    requestedBy: "Omar Ali",
    requestedAt: "2025-09-15T09:15:00Z",
    currentStatus: "In Progress",
    requestedStatus: "Completed",
    priority: "low" as const,
  },
  {
    id: 4,
    title: "Mobile App Backend - Deploy to Production",
    type: "project_status" as const,
    requestedBy: "Fatima Al-Zahra",
    requestedAt: "2025-09-15T11:45:00Z",
    currentStatus: "Under Development",
    requestedStatus: "Production Environment",
    priority: "high" as const,
  },
];

export const mockTeamMembers = [
  {
    id: 1,
    name: "Ahmed Hassan",
    role: "Senior Developer",
    department: "Development",
    currentTasks: 5,
    workload: "high" as const,
    availability: "busy" as const,
  },
  {
    id: 2,
    name: "Sarah Mohammed",
    role: "Business Analyst",
    department: "Analysis",
    currentTasks: 3,
    workload: "medium" as const,
    availability: "available" as const,
  },
  {
    id: 3,
    name: "Omar Ali",
    role: "QA Engineer",
    department: "Quality Assurance",
    currentTasks: 2,
    workload: "low" as const,
    availability: "available" as const,
  },
  {
    id: 4,
    name: "Fatima Al-Zahra",
    role: "DevOps Engineer",
    department: "Infrastructure",
    currentTasks: 4,
    workload: "medium" as const,
    availability: "busy" as const,
  },
  {
    id: 5,
    name: "Mohammed Salah",
    role: "Frontend Developer",
    department: "Development",
    currentTasks: 1,
    workload: "low" as const,
    availability: "available" as const,
  },
  {
    id: 6,
    name: "Aisha Ibrahim",
    role: "System Analyst",
    department: "Analysis",
    currentTasks: 6,
    workload: "high" as const,
    availability: "unavailable" as const,
  },
];

// Mock quick actions data
export const mockQuickActionsData = {
  stats: mockQuickActionStats,
  actions: [], // Actions will be generated dynamically based on permissions
  lastUpdated: new Date().toISOString(),
};

// Mock unassigned projects
export const mockUnassignedProjects = [
  {
    id: 1,
    name: "Banking Portal Security",
    description: "Comprehensive security audit and implementation",
    status: "Under Review",
    createdAt: "2025-09-10T00:00:00Z",
    priority: "high",
    analyst: null, // No analyst assigned
  },
  {
    id: 2,
    name: "Mobile App Backend",
    description: "API development for mobile application",
    status: "Under Review",
    createdAt: "2025-09-12T00:00:00Z",
    priority: "medium",
    analyst: null, // No analyst assigned
  },
  {
    id: 3,
    name: "Data Migration Tool",
    description: "Tool for migrating legacy database",
    status: "Under Review",
    createdAt: "2025-09-08T00:00:00Z",
    priority: "high",
    analyst: null, // No analyst assigned
  },
  {
    id: 4,
    name: "Customer Portal Redesign",
    description: "UI/UX improvements for customer portal",
    status: "Under Review",
    createdAt: "2025-09-14T00:00:00Z",
    priority: "low",
    analyst: null, // No analyst assigned
  },
  {
    id: 5,
    name: "Reporting Dashboard",
    description: "Analytics and reporting dashboard development",
    status: "Under Review",
    createdAt: "2025-09-11T00:00:00Z",
    priority: "medium",
    analyst: null, // No analyst assigned
  },
];
