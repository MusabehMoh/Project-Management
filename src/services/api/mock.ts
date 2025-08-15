import {
  Project,
  User,
  OwningUnit,
  ApiResponse,
  ProjectFilters,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectStats,
} from "@/types/project";

// Mock data for development
const mockProjects: Project[] = [
  {
    id: 1,
    applicationName: "Customer Portal Redesign",
    projectOwner: "Sarah Johnson",
    alternativeOwner: "Mike Chen",
    owningUnit: "Information Technology Division",
    startDate: "2025-01-15",
    expectedCompletionDate: "2025-08-30",
    description: "Complete redesign of the customer portal interface with modern UI/UX principles and improved functionality.",
    remarks: "High priority project with executive sponsorship",
    status: "active",
    createdAt: "2024-12-01T10:00:00Z",
    updatedAt: "2025-01-10T15:30:00Z",
    priority: "high",
    budget: 250000,
    progress: 35,
  },
  {
    id: 2,
    applicationName: "Mobile Banking App",
    projectOwner: "David Rodriguez",
    alternativeOwner: "Emily Zhang",
    owningUnit: "Finance and Budgeting",
    startDate: "2025-02-01",
    expectedCompletionDate: "2025-12-15",
    description: "Development of a new mobile banking application for iOS and Android platforms with advanced security features.",
    remarks: "Requires security audit before launch",
    status: "active",
    createdAt: "2024-11-15T09:00:00Z",
    updatedAt: "2025-01-08T11:20:00Z",
    priority: "high",
    budget: 500000,
    progress: 20,
  },
  {
    id: 3,
    applicationName: "ERP System Upgrade",
    projectOwner: "Lisa Wang",
    alternativeOwner: "John Smith",
    owningUnit: "Operations Department",
    startDate: "2025-03-01",
    expectedCompletionDate: "2025-11-30",
    description: "Upgrade of the existing ERP system to the latest version with enhanced reporting capabilities.",
    remarks: "Budget approved, waiting for vendor confirmation",
    status: "planning",
    createdAt: "2024-10-20T14:00:00Z",
    updatedAt: "2024-12-15T16:45:00Z",
    priority: "medium",
    budget: 750000,
    progress: 5,
  },
  {
    id: 4,
    applicationName: "Data Analytics Platform",
    projectOwner: "Ahmed Hassan",
    alternativeOwner: "Maria Garcia",
    owningUnit: "Information Technology Division",
    startDate: "2024-10-01",
    expectedCompletionDate: "2025-06-30",
    description: "Implementation of a comprehensive data analytics platform for business intelligence and reporting.",
    remarks: "Integration with existing systems completed",
    status: "active",
    createdAt: "2024-09-01T08:00:00Z",
    updatedAt: "2025-01-05T13:15:00Z",
    priority: "medium",
    budget: 300000,
    progress: 65,
  },
  {
    id: 5,
    applicationName: "Legacy System Migration",
    projectOwner: "Robert Kim",
    alternativeOwner: "Anna Petrov",
    owningUnit: "Engineering Corps",
    startDate: "2024-12-01",
    expectedCompletionDate: "2025-09-30",
    description: "Migration of legacy systems to cloud-based infrastructure with improved scalability and performance.",
    remarks: "Phase 1 completed successfully",
    status: "on-hold",
    createdAt: "2024-08-15T12:00:00Z",
    updatedAt: "2024-12-20T10:30:00Z",
    priority: "low",
    budget: 400000,
    progress: 25,
  },
  {
    id: 6,
    applicationName: "نظام إدارة الموارد البشرية",
    projectOwner: "أحمد محمد العلي",
    alternativeOwner: "فاطمة حسن الزهراء",
    owningUnit: "Human Resources Division",
    startDate: "2025-03-15",
    expectedCompletionDate: "2025-12-31",
    description: "تطوير نظام شامل لإدارة الموارد البشرية يشمل إدارة الموظفين والرواتب والإجازات والتقييمات الدورية مع واجهة سهلة الاستخدام.",
    remarks: "مشروع استراتيجي بدعم من الإدارة العليا",
    status: "planning",
    createdAt: "2024-11-01T09:30:00Z",
    updatedAt: "2025-01-03T14:20:00Z",
    priority: "high",
    budget: 350000,
    progress: 0,
  },
];

const mockUsers: User[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    militaryNumber: "MIL001234",
    username: "sarah.johnson",
    department: "IT Department",
    rank: "Captain",
    email: "sarah.johnson@organization.mil",
    phone: "+1-555-0101",
    isActive: true,
  },
  {
    id: 2,
    name: "Mike Chen",
    militaryNumber: "MIL001235",
    username: "mike.chen",
    department: "IT Department",
    rank: "Lieutenant",
    email: "mike.chen@organization.mil",
    phone: "+1-555-0102",
    isActive: true,
  },
  {
    id: 3,
    name: "David Rodriguez",
    militaryNumber: "MIL001236",
    username: "david.rodriguez",
    department: "Digital Banking",
    rank: "Major",
    email: "david.rodriguez@organization.mil",
    phone: "+1-555-0103",
    isActive: true,
  },
  {
    id: 4,
    name: "Emily Zhang",
    militaryNumber: "MIL001237",
    username: "emily.zhang",
    department: "Digital Banking",
    rank: "Captain",
    email: "emily.zhang@organization.mil",
    phone: "+1-555-0104",
    isActive: true,
  },
  {
    id: 5,
    name: "Lisa Wang",
    militaryNumber: "MIL001238",
    username: "lisa.wang",
    department: "Operations",
    rank: "Colonel",
    email: "lisa.wang@organization.mil",
    phone: "+1-555-0105",
    isActive: true,
  },
  {
    id: 6,
    name: "John Smith",
    militaryNumber: "MIL001239",
    username: "john.smith",
    department: "Operations",
    rank: "Lieutenant Colonel",
    email: "john.smith@organization.mil",
    phone: "+1-555-0106",
    isActive: true,
  },
  {
    id: 7,
    name: "Ahmed Hassan",
    militaryNumber: "MIL001240",
    username: "ahmed.hassan",
    department: "Data Science",
    rank: "Major",
    email: "ahmed.hassan@organization.mil",
    phone: "+1-555-0107",
    isActive: true,
  },
  {
    id: 8,
    name: "Maria Garcia",
    militaryNumber: "MIL001241",
    username: "maria.garcia",
    department: "Data Science",
    rank: "Captain",
    email: "maria.garcia@organization.mil",
    phone: "+1-555-0108",
    isActive: true,
  },
  {
    id: 9,
    name: "Robert Kim",
    militaryNumber: "MIL001242",
    username: "robert.kim",
    department: "Infrastructure",
    rank: "Lieutenant Colonel",
    email: "robert.kim@organization.mil",
    phone: "+1-555-0109",
    isActive: true,
  },
  {
    id: 10,
    name: "Anna Petrov",
    militaryNumber: "MIL001243",
    username: "anna.petrov",
    department: "Infrastructure",
    rank: "Major",
    email: "anna.petrov@organization.mil",
    phone: "+1-555-0110",
    isActive: true,
  },
  {
    id: 11,
    name: "أحمد محمد العلي",
    militaryNumber: "MIL001244",
    username: "ahmed.ali",
    department: "قسم تكنولوجيا المعلومات",
    rank: "عقيد",
    email: "ahmed.ali@organization.mil",
    phone: "+966-555-0111",
    isActive: true,
  },
  {
    id: 12,
    name: "فاطمة حسن الزهراء",
    militaryNumber: "MIL001245",
    username: "fatima.zahra",
    department: "قسم العمليات",
    rank: "رائد",
    email: "fatima.zahra@organization.mil",
    phone: "+966-555-0112",
    isActive: true,
  },
];

const mockOwningUnits: OwningUnit[] = [
  {
    id: 1,
    name: "Information Technology Division",
    code: "ITD",
    description: "Responsible for all IT infrastructure and digital transformation initiatives",
    isActive: true,
    commander: "Colonel Sarah Johnson",
  },
  {
    id: 2,
    name: "Operations Department",
    code: "OPS",
    description: "Manages daily operational activities and strategic planning",
    isActive: true,
    commander: "Major Mike Chen",
  },
  {
    id: 3,
    name: "Logistics Support Unit",
    code: "LSU",
    description: "Handles supply chain, procurement, and logistics coordination",
    isActive: true,
    commander: "Captain David Rodriguez",
  },
  {
    id: 4,
    name: "Human Resources Division",
    code: "HRD",
    description: "Personnel management, training, and organizational development",
    isActive: true,
    commander: "Lieutenant Colonel Emily Zhang",
  },
  {
    id: 5,
    name: "Security and Intelligence Unit",
    code: "SIU",
    description: "Security protocols, intelligence analysis, and threat assessment",
    isActive: true,
    commander: "Major Lisa Wang",
  },
  {
    id: 6,
    name: "Communications Center",
    code: "COMM",
    description: "Internal and external communications, media relations",
    isActive: true,
    commander: "Captain John Smith",
  },
  {
    id: 7,
    name: "Training and Development",
    code: "TND",
    description: "Professional development, skill enhancement, and education programs",
    isActive: true,
    commander: "Major Ahmed Hassan",
  },
  {
    id: 8,
    name: "Finance and Budgeting",
    code: "FIN",
    description: "Financial planning, budget management, and accounting",
    isActive: true,
    commander: "Captain Maria Garcia",
  },
  {
    id: 9,
    name: "Medical Support Unit",
    code: "MED",
    description: "Health services, medical support, and emergency response",
    isActive: true,
    commander: "Lieutenant Robert Kim",
  },
  {
    id: 10,
    name: "Engineering Corps",
    code: "ENG",
    description: "Infrastructure development, maintenance, and engineering projects",
    isActive: true,
    commander: "Major Anna Petrov",
  },
];

// Simulate API delays
const getRandomDelay = () => {
  const min = parseInt(import.meta.env.VITE_MOCK_DELAY_MIN || "200");
  const max = parseInt(import.meta.env.VITE_MOCK_DELAY_MAX || "800");
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const delay = (ms?: number) => new Promise(resolve => setTimeout(resolve, ms || getRandomDelay()));

// Mock API service
export class MockApiService {
  private projects: Project[] = [...mockProjects];
  private users: User[] = [...mockUsers];
  private owningUnits: OwningUnit[] = [...mockOwningUnits];
  private currentId: number = Math.max(...this.projects.map(p => p.id)) + 1;

  /**
   * Get all projects with filtering and pagination
   */
  async getProjects(
    filters?: ProjectFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<Project[]>> {
    await delay(); // Use dynamic delay

    let filteredProjects = [...this.projects];

    // Apply filters
    if (filters) {
      if (filters.status) {
        filteredProjects = filteredProjects.filter(p => p.status === filters.status);
      }
      if (filters.owningUnit) {
        filteredProjects = filteredProjects.filter(p => 
          p.owningUnit.toLowerCase().includes(filters.owningUnit!.toLowerCase())
        );
      }
      if (filters.projectOwner) {
        filteredProjects = filteredProjects.filter(p => 
          p.projectOwner.toLowerCase().includes(filters.projectOwner!.toLowerCase())
        );
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProjects = filteredProjects.filter(p => 
          p.applicationName.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.projectOwner.toLowerCase().includes(searchTerm)
        );
      }
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredProjects.length / limit);

    return {
      success: true,
      data: paginatedProjects,
      message: "Projects retrieved successfully",
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: filteredProjects.length,
        totalPages,
      },
    };
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: number): Promise<ApiResponse<Project>> {
    await delay();

    const project = this.projects.find(p => p.id === id);
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    return {
      success: true,
      data: project,
      message: "Project retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create new project
   */
  async createProject(projectData: CreateProjectRequest): Promise<ApiResponse<Project>> {
    await delay();

    const newProject: Project = {
      id: this.currentId++,
      ...projectData,
      alternativeOwner: projectData.alternativeOwner || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
    };

    this.projects.push(newProject);

    return {
      success: true,
      data: newProject,
      message: "Project created successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update project
   */
  async updateProject(projectData: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    await delay();

    const index = this.projects.findIndex(p => p.id === projectData.id);
    if (index === -1) {
      throw new Error(`Project with ID ${projectData.id} not found`);
    }

    const { id, ...updateData } = projectData;
    const updatedProject: Project = {
      ...this.projects[index],
      ...updateData,
      status: (updateData.status as Project["status"]) || this.projects[index].status,
      updatedAt: new Date().toISOString(),
    };

    this.projects[index] = updatedProject;

    return {
      success: true,
      data: updatedProject,
      message: "Project updated successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Delete project
   */
  async deleteProject(id: number): Promise<ApiResponse<void>> {
    await delay();

    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Project with ID ${id} not found`);
    }

    this.projects.splice(index, 1);

    return {
      success: true,
      data: undefined,
      message: "Project deleted successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get project statistics
   */
  async getProjectStats(): Promise<ApiResponse<ProjectStats>> {
    await delay();

    const stats: ProjectStats = {
      total: this.projects.length,
      active: this.projects.filter(p => p.status === "active").length,
      planning: this.projects.filter(p => p.status === "planning").length,
      completed: this.projects.filter(p => p.status === "completed").length,
      onHold: this.projects.filter(p => p.status === "on-hold").length,
      cancelled: this.projects.filter(p => p.status === "cancelled").length,
    };

    return {
      success: true,
      data: stats,
      message: "Statistics retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get users
   */
  async getUsers(): Promise<ApiResponse<User[]>> {
    await delay();

    return {
      success: true,
      data: this.users,
      message: "Users retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get owning units
   */
  async getOwningUnits(): Promise<ApiResponse<OwningUnit[]>> {
    await delay();

    return {
      success: true,
      data: this.owningUnits.filter(unit => unit.isActive),
      message: "Owning units retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get users for projects (returns project User type)
   */
  async getProjectUsers(): Promise<ApiResponse<User[]>> {
    await delay();

    return {
      success: true,
      data: this.users,
      message: "Project users retrieved successfully", 
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get timelines for a specific project (Timeline API methods)
   */
  async getProjectTimelines(projectId: number): Promise<ApiResponse<any[]>> {
    await delay(500); // Simulate API delay

    // Mock timeline data with sprints, tasks, and subtasks
    const mockTimelines = [
      {
        id: `timeline-${projectId}-1`,
        projectId: projectId,
        name: `${this.projects.find(p => p.id === projectId)?.applicationName || 'Project'} Timeline`,
        description: 'Development timeline for the project',
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        sprints: [
          {
            id: `sprint-${projectId}-1`,
            timelineId: `timeline-${projectId}-1`,
            name: 'Sprint 1: Planning & Setup',
            description: 'Initial project setup and planning phase',
            startDate: '2025-01-01',
            endDate: '2025-01-15',
            duration: 14,
            department: 'Engineering',
            resources: ['John Smith', 'Sarah Johnson'],
            tasks: [
              {
                id: `task-${projectId}-1-1`,
                sprintId: `sprint-${projectId}-1`,
                name: 'Project Setup',
                description: 'Initialize project structure and tools',
                startDate: '2025-01-01',
                endDate: '2025-01-05',
                duration: 4,
                status: 'completed',
                priority: 'high',
                progress: 100,
                department: 'Engineering',
                resources: ['John Smith'],
                subtasks: [
                  {
                    id: `subtask-${projectId}-1-1-1`,
                    taskId: `task-${projectId}-1-1`,
                    name: 'Setup development environment',
                    description: 'Configure development tools and environment',
                    startDate: '2025-01-01',
                    endDate: '2025-01-02',
                    duration: 1,
                    status: 'completed',
                    priority: 'high',
                    progress: 100,
                    department: 'Engineering',
                    resources: ['John Smith'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  },
                  {
                    id: `subtask-${projectId}-1-1-2`,
                    taskId: `task-${projectId}-1-1`,
                    name: 'Create project documentation',
                    description: 'Write initial project documentation',
                    startDate: '2025-01-03',
                    endDate: '2025-01-05',
                    duration: 2,
                    status: 'completed',
                    priority: 'medium',
                    progress: 100,
                    department: 'Engineering',
                    resources: ['Sarah Johnson'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              {
                id: `task-${projectId}-1-2`,
                sprintId: `sprint-${projectId}-1`,
                name: 'Requirements Analysis',
                description: 'Analyze and document project requirements',
                startDate: '2025-01-06',
                endDate: '2025-01-15',
                duration: 9,
                status: 'in-progress',
                priority: 'high',
                progress: 75,
                department: 'Design',
                resources: ['Sarah Johnson', 'Mike Davis'],
                subtasks: [
                  {
                    id: `subtask-${projectId}-1-2-1`,
                    taskId: `task-${projectId}-1-2`,
                    name: 'User research',
                    description: 'Conduct user interviews and surveys',
                    startDate: '2025-01-06',
                    endDate: '2025-01-10',
                    duration: 4,
                    status: 'completed',
                    priority: 'high',
                    progress: 100,
                    department: 'Design',
                    resources: ['Sarah Johnson'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  },
                  {
                    id: `subtask-${projectId}-1-2-2`,
                    taskId: `task-${projectId}-1-2`,
                    name: 'Create wireframes',
                    description: 'Design wireframes based on requirements',
                    startDate: '2025-01-11',
                    endDate: '2025-01-15',
                    duration: 4,
                    status: 'in-progress',
                    priority: 'medium',
                    progress: 50,
                    department: 'Design',
                    resources: ['Mike Davis'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: `sprint-${projectId}-2`,
            timelineId: `timeline-${projectId}-1`,
            name: 'Sprint 2: Development Phase 1',
            description: 'Core functionality development',
            startDate: '2025-01-16',
            endDate: '2025-02-15',
            duration: 30,
            department: 'Engineering',
            resources: ['John Smith', 'Lisa Chen'],
            tasks: [
              {
                id: `task-${projectId}-2-1`,
                sprintId: `sprint-${projectId}-2`,
                name: 'Backend API Development',
                description: 'Develop core backend APIs',
                startDate: '2025-01-16',
                endDate: '2025-02-05',
                duration: 20,
                status: 'pending',
                priority: 'high',
                progress: 0,
                department: 'Engineering',
                resources: ['John Smith'],
                subtasks: [
                  {
                    id: `subtask-${projectId}-2-1-1`,
                    taskId: `task-${projectId}-2-1`,
                    name: 'Database schema design',
                    description: 'Design and implement database schema',
                    startDate: '2025-01-16',
                    endDate: '2025-01-20',
                    duration: 4,
                    status: 'pending',
                    priority: 'high',
                    progress: 0,
                    department: 'Engineering',
                    resources: ['John Smith'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Only return timelines for projects 1 and 2 to simulate some projects having timelines
    const hasTimelines = projectId === 1 || projectId === 2;
    
    return {
      success: true,
      data: hasTimelines ? mockTimelines : [],
      message: `Timelines for project ${projectId} retrieved successfully`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a new timeline
   */
  async createTimeline(data: any): Promise<ApiResponse<any>> {
    await delay(300);

    const newTimeline = {
      id: `timeline-${Date.now()}`,
      ...data,
      sprints: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      success: true,
      data: newTimeline,
      message: "Timeline created successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get timeline by ID
   */
  async getTimeline(id: string): Promise<ApiResponse<any>> {
    await delay(200);

    const mockTimeline = {
      id: id,
      projectId: 1,
      name: 'Sample Timeline',
      description: 'Sample timeline description',
      startDate: '2025-01-01',
      endDate: '2025-06-30',
      sprints: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      success: true,
      data: mockTimeline,
      message: "Timeline retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get departments for timeline
   */
  async getDepartments(): Promise<ApiResponse<any[]>> {
    await delay(200);

    const mockDepartments = [
      { id: '1', name: 'Engineering', color: '#3B82F6', description: 'Software Engineering Department' },
      { id: '2', name: 'Design', color: '#8B5CF6', description: 'UI/UX Design Department' },
      { id: '3', name: 'QA', color: '#10B981', description: 'Quality Assurance Department' },
      { id: '4', name: 'DevOps', color: '#F59E0B', description: 'DevOps and Infrastructure' },
    ];

    return {
      success: true,
      data: mockDepartments,
      message: "Departments retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get resources for timeline
   */
  async getResources(): Promise<ApiResponse<any[]>> {
    await delay(200);

    const mockResources = [
      { id: '1', name: 'John Smith', type: 'person', department: 'Engineering', isAvailable: true },
      { id: '2', name: 'Sarah Johnson', type: 'person', department: 'Design', isAvailable: true },
      { id: '3', name: 'Mike Davis', type: 'person', department: 'QA', isAvailable: true },
      { id: '4', name: 'Lisa Chen', type: 'person', department: 'DevOps', isAvailable: true },
    ];

    return {
      success: true,
      data: mockResources,
      message: "Resources retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  }

  // Additional timeline methods
  async updateTimeline(id: string, data: any): Promise<ApiResponse<any>> {
    await delay(300);
    return {
      success: true,
      data: { id, ...data, updatedAt: new Date().toISOString() },
      message: "Timeline updated successfully",
      timestamp: new Date().toISOString(),
    };
  }

  async deleteTimeline(id: string): Promise<ApiResponse<void>> {
    await delay(300);
    return {
      success: true,
      data: undefined,
      message: "Timeline deleted successfully",
      timestamp: new Date().toISOString(),
    };
  }

  // Sprint methods
  async createSprint(data: any): Promise<ApiResponse<any>> {
    await delay(300);
    return {
      success: true,
      data: { id: `sprint-${Date.now()}`, ...data, createdAt: new Date().toISOString() },
      message: "Sprint created successfully",
      timestamp: new Date().toISOString(),
    };
  }

  async updateSprint(id: string, data: any): Promise<ApiResponse<any>> {
    await delay(300);
    return {
      success: true,
      data: { id, ...data, updatedAt: new Date().toISOString() },
      message: "Sprint updated successfully",
      timestamp: new Date().toISOString(),
    };
  }

  async deleteSprint(id: string): Promise<ApiResponse<void>> {
    await delay(300);
    return {
      success: true,
      data: undefined,
      message: "Sprint deleted successfully",
      timestamp: new Date().toISOString(),
    };
  }

  // Task methods
  async createTask(data: any): Promise<ApiResponse<any>> {
    await delay(300);
    return {
      success: true,
      data: { id: `task-${Date.now()}`, ...data, createdAt: new Date().toISOString() },
      message: "Task created successfully",
      timestamp: new Date().toISOString(),
    };
  }

  async updateTask(id: string, data: any): Promise<ApiResponse<any>> {
    await delay(300);
    return {
      success: true,
      data: { id, ...data, updatedAt: new Date().toISOString() },
      message: "Task updated successfully",
      timestamp: new Date().toISOString(),
    };
  }

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    await delay(300);
    return {
      success: true,
      data: undefined,
      message: "Task deleted successfully",
      timestamp: new Date().toISOString(),
    };
  }

  // Subtask methods
  async createSubtask(data: any): Promise<ApiResponse<any>> {
    await delay(300);
    return {
      success: true,
      data: { id: `subtask-${Date.now()}`, ...data, createdAt: new Date().toISOString() },
      message: "Subtask created successfully",
      timestamp: new Date().toISOString(),
    };
  }

  async updateSubtask(id: string, data: any): Promise<ApiResponse<any>> {
    await delay(300);
    return {
      success: true,
      data: { id, ...data, updatedAt: new Date().toISOString() },
      message: "Subtask updated successfully",
      timestamp: new Date().toISOString(),
    };
  }

  async deleteSubtask(id: string): Promise<ApiResponse<void>> {
    await delay(300);
    return {
      success: true,
      data: undefined,
      message: "Subtask deleted successfully",
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const mockApiService = new MockApiService();