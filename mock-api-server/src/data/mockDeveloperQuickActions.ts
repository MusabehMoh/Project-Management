export interface UnassignedTask {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "todo" | "in-progress" | "review" | "testing" | "done";
  projectId: string;
  projectName: string;
  estimatedHours: number;
  dueDate: string;
  type: "feature" | "bug" | "improvement" | "refactor";
  complexity: "simple" | "medium" | "complex";
  tags: string[];
  owningUnit?: string;
}

export interface AlmostCompletedTask {
  id: number;
  treeId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number;
  projectName: string;
  sprintName: string;
  assigneeName?: string;
  statusId: number;
  priorityId: number;
  progress?: number;
  daysUntilDeadline: number;
  isOverdue: boolean;
  estimatedHours?: number;
  actualHours?: number;
  departmentName?: string;
}

export interface AvailableDeveloper {
  userId: string;
  fullName: string;
  department: string;
  gradeName: string;
  totalTasks: number;
  currentWorkload: "low" | "medium" | "high";
  skills: string[];
  availability: "available" | "busy" | "away";
}

export const mockUnassignedTasks: UnassignedTask[] = [
  {
    id: "task-1",
    title: "Implement user authentication system",
    description: "Create JWT-based authentication with refresh tokens",
    priority: "high",
    status: "todo",
    projectId: "proj-1",
    projectName: "E-Commerce Platform",
    estimatedHours: 16,
    dueDate: "2025-09-30",
    type: "feature",
    complexity: "medium",
    tags: ["authentication", "security"],
    owningUnit: "Development Team A",
  },
  {
    id: "task-2",
    title: "Fix payment gateway timeout issues",
    description: "Resolve timeout issues with Stripe payment processing",
    priority: "critical",
    status: "todo",
    projectId: "proj-1",
    projectName: "E-Commerce Platform",
    estimatedHours: 8,
    dueDate: "2025-09-26",
    type: "bug",
    complexity: "medium",
    tags: ["payment", "stripe", "timeout"],
    owningUnit: "Development Team B",
  },
  {
    id: "task-3",
    title: "Optimize database queries for product search",
    description:
      "Improve search performance by optimizing SQL queries and adding indexes",
    priority: "medium",
    status: "todo",
    projectId: "proj-2",
    projectName: "Product Catalog System",
    estimatedHours: 12,
    dueDate: "2025-10-05",
    type: "improvement",
    complexity: "complex",
    tags: ["database", "performance", "search"],
    owningUnit: "Development Team A",
  },
  {
    id: "task-4",
    title: "Create responsive mobile layout",
    description:
      "Design and implement mobile-first responsive layout for the dashboard",
    priority: "high",
    status: "todo",
    projectId: "proj-1",
    projectName: "E-Commerce Platform",
    estimatedHours: 20,
    dueDate: "2025-10-01",
    type: "feature",
    complexity: "medium",
    tags: ["frontend", "responsive", "mobile"],
    owningUnit: "Development Team C",
  },
  {
    id: "task-5",
    title: "Setup automated testing pipeline",
    description:
      "Configure CI/CD pipeline with automated unit and integration tests",
    priority: "medium",
    status: "todo",
    projectId: "proj-3",
    projectName: "DevOps Infrastructure",
    estimatedHours: 24,
    dueDate: "2025-10-10",
    type: "improvement",
    complexity: "complex",
    tags: ["testing", "ci/cd", "automation"],
    owningUnit: "DevOps Team",
  },
];

export const mockAlmostCompletedTasks: AlmostCompletedTask[] = [
  {
    id: 101,
    treeId: "task-101",
    name: "Complete user dashboard implementation",
    description: "Finalize the user dashboard with all required components",
    startDate: "2025-09-20",
    endDate: "2025-09-25",
    duration: 5,
    projectName: "E-Commerce Platform",
    sprintName: "Sprint 3",
    assigneeName: "Ahmed Ali",
    statusId: 2, // in-progress
    priorityId: 2, // high
    progress: 85,
    daysUntilDeadline: 1,
    isOverdue: false,
    estimatedHours: 40,
    actualHours: 34,
    departmentName: "Frontend Team",
  },
  {
    id: 102,
    treeId: "task-102",
    name: "API integration testing",
    description: "Complete integration testing for payment API endpoints",
    startDate: "2025-09-18",
    endDate: "2025-09-24",
    duration: 6,
    projectName: "Payment Gateway",
    sprintName: "Sprint 2",
    assigneeName: "Sara Hassan",
    statusId: 3, // review
    priorityId: 3, // critical
    progress: 90,
    daysUntilDeadline: 0,
    isOverdue: true,
    estimatedHours: 24,
    actualHours: 26,
    departmentName: "Backend Team",
  },
  {
    id: 103,
    treeId: "task-103",
    name: "Database migration scripts",
    description: "Prepare and test database migration scripts for production",
    startDate: "2025-09-21",
    endDate: "2025-09-26",
    duration: 5,
    projectName: "System Upgrade",
    sprintName: "Sprint 1",
    assigneeName: "Omar Khalil",
    statusId: 2, // in-progress
    priorityId: 2, // high
    progress: 75,
    daysUntilDeadline: 2,
    isOverdue: false,
    estimatedHours: 32,
    actualHours: 28,
    departmentName: "DevOps Team",
  },
  {
    id: 104,
    treeId: "task-104",
    name: "Security vulnerability assessment",
    description:
      "Conduct comprehensive security audit and fix identified vulnerabilities",
    startDate: "2025-09-19",
    endDate: "2025-09-25",
    duration: 6,
    projectName: "Security Enhancement",
    sprintName: "Security Sprint",
    assigneeName: "Fatima Nasser",
    statusId: 2, // in-progress
    priorityId: 3, // critical
    progress: 60,
    daysUntilDeadline: 1,
    isOverdue: false,
    estimatedHours: 48,
    actualHours: 30,
    departmentName: "Security Team",
  },
  {
    id: 105,
    treeId: "task-105",
    name: "Performance optimization",
    description: "Optimize application performance and reduce load times",
    startDate: "2025-09-15",
    endDate: "2025-09-23",
    duration: 8,
    projectName: "Performance Improvement",
    sprintName: "Performance Sprint",
    assigneeName: "Hassan Ali",
    statusId: 2, // in-progress
    priorityId: 2, // high
    progress: 95,
    daysUntilDeadline: -1,
    isOverdue: true,
    estimatedHours: 36,
    actualHours: 38,
    departmentName: "Performance Team",
  },
];

export const mockAvailableDevelopers: AvailableDeveloper[] = [
  {
    userId: "dev-3",
    fullName: "Omar Khalil",
    department: "Frontend Development",
    gradeName: "Senior Developer",
    totalTasks: 3,
    currentWorkload: "medium",
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    availability: "available",
  },
  {
    userId: "dev-4",
    fullName: "Fatima Nasser",
    department: "Backend Development",
    gradeName: "Lead Developer",
    totalTasks: 2,
    currentWorkload: "low",
    skills: ["Node.js", "Python", "PostgreSQL", "Docker"],
    availability: "available",
  },
  {
    userId: "dev-5",
    fullName: "Hassan Ali",
    department: "Full Stack Development",
    gradeName: "Developer",
    totalTasks: 1,
    currentWorkload: "low",
    skills: ["Vue.js", "Express.js", "MongoDB", "AWS"],
    availability: "available",
  },
  {
    userId: "dev-6",
    fullName: "Layla Ahmed",
    department: "Mobile Development",
    gradeName: "Senior Developer",
    totalTasks: 2,
    currentWorkload: "medium",
    skills: ["React Native", "Flutter", "iOS", "Android"],
    availability: "available",
  },
  {
    userId: "dev-7",
    fullName: "Mahmoud Ibrahim",
    department: "DevOps",
    gradeName: "DevOps Engineer",
    totalTasks: 4,
    currentWorkload: "high",
    skills: ["Kubernetes", "Docker", "Jenkins", "Terraform"],
    availability: "busy",
  },
  {
    userId: "dev-8",
    fullName: "Nour Salim",
    department: "Quality Assurance",
    gradeName: "QA Lead",
    totalTasks: 3,
    currentWorkload: "medium",
    skills: ["Selenium", "Jest", "Cypress", "API Testing"],
    availability: "available",
  },
];

// Helper function to calculate days until deadline and overdue status
export const calculateTaskUrgency = (endDate: string) => {
  const now = new Date();
  const taskEndDate = new Date(endDate);
  const daysUntilDeadline = Math.ceil(
    (taskEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysUntilDeadline < 0;

  return {
    daysUntilDeadline: Math.abs(daysUntilDeadline),
    isOverdue,
  };
};

// Function to get tasks that are almost completed (due within 3 days or overdue)
export const getAlmostCompletedTasks = (): AlmostCompletedTask[] => {
  const DAYS_THRESHOLD = 3;
  const now = new Date();

  return mockAlmostCompletedTasks
    .map((task) => {
      const urgency = calculateTaskUrgency(task.endDate);

      return {
        ...task,
        daysUntilDeadline: urgency.daysUntilDeadline,
        isOverdue: urgency.isOverdue,
      };
    })
    .filter((task) => {
      const daysUntilDeadline = Math.ceil(
        (new Date(task.endDate).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return (
        (daysUntilDeadline <= DAYS_THRESHOLD || task.isOverdue) &&
        task.statusId !== 4
      ); // Not completed
    })
    .sort((a, b) => {
      // Sort by urgency - overdue first, then by days until deadline
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      return a.daysUntilDeadline - b.daysUntilDeadline;
    });
};
