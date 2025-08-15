import { v4 as uuidv4 } from 'uuid';
import { apiClient } from "./client";
import { ApiResponse } from "@/types/project";
import { 
  Timeline, 
  Sprint,
  Task, 
  Subtask, 
  Resource, 
  Department,
  TaskStatus,
  TaskPriority,
  CreateTimelineRequest,
  CreateSprintRequest,
  CreateTaskRequest,
  CreateSubtaskRequest,
  UpdateTimelineRequest,
  UpdateSprintRequest,
  UpdateTaskRequest,
  UpdateSubtaskRequest,
  TimelineFilters
} from '@/types/timeline';
import { differenceInDays, parseISO, format } from 'date-fns';

// Timeline API endpoints
const ENDPOINTS = {
  TIMELINES: "/timelines",
  TIMELINE_BY_ID: (id: string) => `/timelines/${id}`,
  PROJECT_TIMELINES: (projectId: number) => `/projects/${projectId}/timelines`,
  SPRINTS: (timelineId: string) => `/timelines/${timelineId}/sprints`,
  TASKS: (sprintId: string) => `/sprints/${sprintId}/tasks`,
  SUBTASKS: (taskId: string) => `/tasks/${taskId}/subtasks`,
  DEPARTMENTS: "/timeline/departments",
  RESOURCES: "/timeline/resources",
} as const;

// Timeline API Service Class
export class TimelineApiService {
  /**
   * Get all timelines for a project
   */
  async getProjectTimelines(projectId: number): Promise<ApiResponse<Timeline[]>> {
    return apiClient.get<Timeline[]>(ENDPOINTS.PROJECT_TIMELINES(projectId));
  }

  /**
   * Get all projects that have timelines
   */
  async getProjectsWithTimelines(): Promise<ApiResponse<Array<{ projectId: number; timelineCount: number; timelines: Timeline[] }>>> {
    return apiClient.get<Array<{ projectId: number; timelineCount: number; timelines: Timeline[] }>>('/projects/with-timelines');
  }

  /**
   * Create a new timeline
   */
  async createTimeline(data: CreateTimelineRequest): Promise<ApiResponse<Timeline>> {
    return apiClient.post<Timeline>(ENDPOINTS.TIMELINES, data);
  }

  /**
   * Get timeline by ID
   */
  async getTimeline(id: string): Promise<ApiResponse<Timeline>> {
    return apiClient.get<Timeline>(ENDPOINTS.TIMELINE_BY_ID(id));
  }

  /**
   * Update timeline
   */
  async updateTimeline(id: string, data: UpdateTimelineRequest): Promise<ApiResponse<Timeline>> {
    return apiClient.put<Timeline>(ENDPOINTS.TIMELINE_BY_ID(id), data);
  }

  /**
   * Delete timeline
   */
  async deleteTimeline(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(ENDPOINTS.TIMELINE_BY_ID(id));
  }

  /**
   * Get departments
   */
  async getDepartments(): Promise<ApiResponse<Department[]>> {
    return apiClient.get<Department[]>(ENDPOINTS.DEPARTMENTS);
  }

  /**
   * Get resources
   */
  async getResources(): Promise<ApiResponse<Resource[]>> {
    return apiClient.get<Resource[]>(ENDPOINTS.RESOURCES);
  }

  // Sprint operations
  async createSprint(data: CreateSprintRequest): Promise<ApiResponse<Sprint>> {
    return apiClient.post<Sprint>(ENDPOINTS.SPRINTS(data.timelineId), data);
  }

  async updateSprint(id: string, data: UpdateSprintRequest): Promise<ApiResponse<Sprint>> {
    return apiClient.put<Sprint>(`/sprints/${id}`, data);
  }

  async deleteSprint(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/sprints/${id}`);
  }

  // Task operations
  async createTask(data: CreateTaskRequest): Promise<ApiResponse<Task>> {
    return apiClient.post<Task>(ENDPOINTS.TASKS(data.sprintId), data);
  }

  async updateTask(id: string, data: UpdateTaskRequest): Promise<ApiResponse<Task>> {
    return apiClient.put<Task>(`/tasks/${id}`, data);
  }

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/tasks/${id}`);
  }

  // Subtask operations
  async createSubtask(data: CreateSubtaskRequest): Promise<ApiResponse<Subtask>> {
    return apiClient.post<Subtask>(ENDPOINTS.SUBTASKS(data.taskId), data);
  }

  async updateSubtask(id: string, data: UpdateSubtaskRequest): Promise<ApiResponse<Subtask>> {
    return apiClient.put<Subtask>(`/subtasks/${id}`, data);
  }

  async deleteSubtask(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/subtasks/${id}`);
  }
}

// Create and export timeline API instance
export const timelineApi = new TimelineApiService();

// Mock departments
export const mockDepartments: Department[] = [
  { id: '1', name: 'Engineering', color: '#3B82F6', description: 'Software Engineering Department' },
  { id: '2', name: 'Design', color: '#8B5CF6', description: 'UI/UX Design Department' },
  { id: '3', name: 'QA', color: '#10B981', description: 'Quality Assurance Department' },
  { id: '4', name: 'DevOps', color: '#F59E0B', description: 'DevOps and Infrastructure' },
  { id: '5', name: 'Product', color: '#EF4444', description: 'Product Management' },
  { id: '6', name: 'Research', color: '#6366F1', description: 'Research and Development' },
];

// Mock resources
export const mockResources: Resource[] = [
  { id: '1', name: 'John Smith', type: 'person', department: 'Engineering', isAvailable: true, skills: ['React', 'TypeScript', 'Node.js'] },
  { id: '2', name: 'Sarah Johnson', type: 'person', department: 'Design', isAvailable: true, skills: ['Figma', 'Adobe XD', 'UI Design'] },
  { id: '3', name: 'Mike Davis', type: 'person', department: 'QA', isAvailable: true, skills: ['Test Automation', 'Selenium', 'Jest'] },
  { id: '4', name: 'Lisa Chen', type: 'person', department: 'DevOps', isAvailable: true, skills: ['AWS', 'Docker', 'Kubernetes'] },
  { id: '5', name: 'Alex Wilson', type: 'person', department: 'Engineering', isAvailable: true, skills: ['Python', 'FastAPI', 'PostgreSQL'] },
  { id: '6', name: 'Emily Brown', type: 'person', department: 'Product', isAvailable: true, skills: ['Product Strategy', 'Analytics', 'User Research'] },
  { id: '7', name: 'Development Server', type: 'equipment', department: 'DevOps', isAvailable: true },
  { id: '8', name: 'Testing Environment', type: 'equipment', department: 'QA', isAvailable: true },
];

// Helper function to calculate duration
const calculateDuration = (startDate: string, endDate: string): number => {
  return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
};

// Helper function to recalculate parent dates based on children
const recalculateParentDates = (items: any[]): { startDate: string; endDate: string } => {
  if (items.length === 0) {
    return { startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd') };
  }

  const dates = items.map(item => ({
    start: parseISO(item.startDate),
    end: parseISO(item.endDate)
  }));

  const earliestStart = new Date(Math.min(...dates.map(d => d.start.getTime())));
  const latestEnd = new Date(Math.max(...dates.map(d => d.end.getTime())));

  return {
    startDate: format(earliestStart, 'yyyy-MM-dd'),
    endDate: format(latestEnd, 'yyyy-MM-dd')
  };
};

// Mock data - Updated to match actual project IDs
let mockTimelines: Timeline[] = [
  {
    id: 'timeline-1',
    projectId: 1, // This should match actual project IDs from your projects data
    name: 'Mobile App Development Timeline',
    description: 'Complete development timeline for the mobile application project',
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    sprints: [
      {
        id: 'sprint-101',
        timelineId: 'timeline-1',
        name: 'Planning & Design Sprint',
        description: 'Initial planning and UI/UX design phase',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        duration: 31,
        department: 'Design',
        resources: ['2', '6'],
        notes: 'Focus on user research and wireframing',
        tasks: [
          {
            id: 'task-101',
            sprintId: 'sprint-101',
            name: 'User Research',
            description: 'Conduct user interviews and surveys',
            startDate: '2025-01-01',
            endDate: '2025-01-15',
            duration: 15,
            department: 'Product',
            resources: ['6'],
            status: 'completed' as TaskStatus,
            priority: 'high' as TaskPriority,
            progress: 100,
            notes: 'Completed with 50 user interviews',
            subtasks: [
              {
                id: 'subtask-101',
                taskId: 'task-101',
                name: 'Prepare Interview Questions',
                description: 'Create comprehensive interview guide',
                startDate: '2025-01-01',
                endDate: '2025-01-03',
                duration: 3,
                department: 'Product',
                resources: ['6'],
                status: 'completed' as TaskStatus,
                priority: 'medium' as TaskPriority,
                progress: 100,
                notes: 'Questions reviewed and approved'
              },
              {
                id: 'subtask-102',
                taskId: 'task-101',
                name: 'Conduct Interviews',
                description: 'Interview 50 potential users',
                startDate: '2025-01-04',
                endDate: '2025-01-12',
                duration: 9,
                department: 'Product',
                resources: ['6'],
                status: 'completed' as TaskStatus,
                priority: 'high' as TaskPriority,
                progress: 100,
                notes: 'All interviews completed successfully'
              },
              {
                id: 'subtask-103',
                taskId: 'task-101',
                name: 'Analyze Results',
                description: 'Analyze interview data and create insights',
                startDate: '2025-01-13',
                endDate: '2025-01-15',
                duration: 3,
                department: 'Product',
                resources: ['6'],
                status: 'completed' as TaskStatus,
                priority: 'medium' as TaskPriority,
                progress: 100,
                notes: 'Key insights documented'
              }
            ]
          },
          {
            id: 'task-102',
            sprintId: 'sprint-101',
            name: 'Wireframe Design',
            description: 'Create initial wireframes for key screens',
            startDate: '2025-01-16',
            endDate: '2025-01-31',
            duration: 16,
            department: 'Design',
            resources: ['2'],
            status: 'completed' as TaskStatus,
            priority: 'high' as TaskPriority,
            progress: 100,
            notes: 'All major screens wireframed',
            subtasks: [
              {
                id: 'subtask-104',
                taskId: 'task-102',
                name: 'Login Flow Wireframes',
                description: 'Design wireframes for authentication flow',
                startDate: '2025-01-16',
                endDate: '2025-01-20',
                duration: 5,
                department: 'Design',
                resources: ['2'],
                status: 'completed' as TaskStatus,
                priority: 'high' as TaskPriority,
                progress: 100,
                notes: 'Includes social login options'
              },
              {
                id: 'subtask-5',
                taskId: 'task-2',
                name: 'Dashboard Wireframes',
                description: 'Design main dashboard wireframes',
                startDate: '2025-01-21',
                endDate: '2025-01-27',
                duration: 7,
                department: 'Design',
                resources: ['2'],
                status: 'completed' as TaskStatus,
                priority: 'medium' as TaskPriority,
                progress: 100,
                notes: 'Multiple layout options provided'
              },
              {
                id: 'subtask-6',
                taskId: 'task-2',
                name: 'Settings Wireframes',
                description: 'Design settings and profile wireframes',
                startDate: '2025-01-28',
                endDate: '2025-01-31',
                duration: 4,
                department: 'Design',
                resources: ['2'],
                status: 'completed' as TaskStatus,
                priority: 'low' as TaskPriority,
                progress: 100,
                notes: 'Comprehensive settings structure'
              }
            ]
          }
        ]
      },
      {
        id: 'sprint-102',
        timelineId: 'timeline-1',
        name: 'Development Sprint 1',
        description: 'Core functionality development',
        startDate: '2025-02-01',
        endDate: '2025-03-15',
        duration: 43,
        department: 'Engineering',
        resources: ['1', '5'],
        notes: 'Focus on backend API and basic frontend',
        tasks: [
          {
            id: 'task-3',
            sprintId: '2',
            name: 'Backend API Development',
            description: 'Develop core REST API endpoints',
            startDate: '2025-02-01',
            endDate: '2025-02-28',
            duration: 28,
            department: 'Engineering',
            resources: ['5'],
            status: 'in-progress' as TaskStatus,
            priority: 'critical' as TaskPriority,
            progress: 75,
            notes: 'Authentication and user management complete',
            subtasks: [
              {
                id: '7',
                taskId: '3',
                name: 'User Authentication API',
                description: 'Implement JWT-based authentication',
                startDate: '2025-02-01',
                endDate: '2025-02-07',
                duration: 7,
                department: 'Engineering',
                resources: ['5'],
                status: 'completed' as TaskStatus,
                priority: 'critical' as TaskPriority,
                progress: 100,
                notes: 'JWT implementation with refresh tokens'
              },
              {
                id: '8',
                taskId: '3',
                name: 'User Management API',
                description: 'CRUD operations for user profiles',
                startDate: '2025-02-08',
                endDate: '2025-02-14',
                duration: 7,
                department: 'Engineering',
                resources: ['5'],
                status: 'completed' as TaskStatus,
                priority: 'high' as TaskPriority,
                progress: 100,
                notes: 'Including profile picture upload'
              },
              {
                id: '9',
                taskId: '3',
                name: 'Data Models API',
                description: 'Core business logic endpoints',
                startDate: '2025-02-15',
                endDate: '2025-02-28',
                duration: 14,
                department: 'Engineering',
                resources: ['5'],
                status: 'in-progress' as TaskStatus,
                priority: 'high' as TaskPriority,
                progress: 60,
                notes: 'Main entities implemented, working on relationships'
              }
            ]
          },
          {
            id: '4',
            sprintId: '2',
            name: 'Frontend Setup',
            description: 'Setup React application and routing',
            startDate: '2025-03-01',
            endDate: '2025-03-15',
            duration: 15,
            department: 'Engineering',
            resources: ['1'],
            status: 'in-progress' as TaskStatus,
            priority: 'high' as TaskPriority,
            progress: 35,
            notes: 'Basic setup completed, working on components',
            subtasks: [
              {
                id: '10',
                taskId: '4',
                name: 'Project Setup',
                description: 'Initialize React project with TypeScript',
                startDate: '2025-03-01',
                endDate: '2025-03-03',
                duration: 3,
                department: 'Engineering',
                resources: ['1'],
                status: 'in-progress' as TaskStatus,
                priority: 'high' as TaskPriority,
                progress: 15,
                notes: 'Initial setup started, facing dependency issues'
              },
              {
                id: '11',
                taskId: '4',
                name: 'Routing Setup',
                description: 'Configure React Router and navigation',
                startDate: '2025-03-04',
                endDate: '2025-03-08',
                duration: 5,
                department: 'Engineering',
                resources: ['1'],
                status: 'not-started' as TaskStatus,
                priority: 'medium' as TaskPriority,
                progress: 0,
                notes: 'Protected routes for authenticated users'
              },
              {
                id: '12',
                taskId: '4',
                name: 'Basic Components',
                description: 'Create reusable UI components',
                startDate: '2025-03-09',
                endDate: '2025-03-15',
                duration: 7,
                department: 'Engineering',
                resources: ['1'],
                status: 'not-started' as TaskStatus,
                priority: 'medium' as TaskPriority,
                progress: 0,
                notes: 'Focus on form components and layouts'
              }
            ]
          }
        ]
      },
      {
        id: 'sprint-103',
        timelineId: 'timeline-1',
        name: 'Testing & QA Sprint',
        description: 'Comprehensive testing and quality assurance',
        startDate: '2025-05-01',
        endDate: '2025-06-30',
        duration: 61,
        department: 'QA',
        resources: ['3', '8'],
        notes: 'Full testing cycle including automation',
        tasks: [
          {
            id: 'task-103',
            sprintId: 'sprint-103',
            name: 'Test Planning',
            description: 'Create comprehensive test strategy',
            startDate: '2025-05-01',
            endDate: '2025-05-15',
            duration: 15,
            department: 'QA',
            resources: ['3'],
            status: 'not-started' as TaskStatus,
            priority: 'high' as TaskPriority,
            progress: 0,
            notes: 'Include manual and automated testing approaches',
            subtasks: [
              {
                id: '13',
                taskId: '5',
                name: 'Test Strategy Document',
                description: 'Create overall testing strategy',
                startDate: '2025-05-01',
                endDate: '2025-05-07',
                duration: 7,
                department: 'QA',
                resources: ['3'],
                status: 'not-started' as TaskStatus,
                priority: 'high' as TaskPriority,
                progress: 0,
                notes: 'Cover all testing types and methodologies'
              },
              {
                id: '14',
                taskId: '5',
                name: 'Test Cases Creation',
                description: 'Write detailed test cases for all features',
                startDate: '2025-05-08',
                endDate: '2025-05-15',
                duration: 8,
                department: 'QA',
                resources: ['3'],
                status: 'not-started' as TaskStatus,
                priority: 'medium' as TaskPriority,
                progress: 0,
                notes: 'Include positive and negative test scenarios'
              }
            ]
          }
        ]
      }
    ]
  }
];

// Service class for timeline operations
export class TimelineService {
  // Timeline CRUD operations
  static async getTimelines(projectId?: number): Promise<Timeline[]> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    return projectId 
      ? mockTimelines.filter(t => t.projectId === projectId)
      : mockTimelines;
  }

  // Get all projects that have timelines
  static async getProjectsWithTimelines(): Promise<Array<{ projectId: number; timelineCount: number; timelines: Timeline[] }>> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
    
    const projectMap = new Map<number, Timeline[]>();
    
    mockTimelines.forEach(timeline => {
      if (!projectMap.has(timeline.projectId)) {
        projectMap.set(timeline.projectId, []);
      }
      projectMap.get(timeline.projectId)!.push(timeline);
    });

    return Array.from(projectMap.entries()).map(([projectId, timelines]) => ({
      projectId,
      timelineCount: timelines.length,
      timelines
    }));
  }

  static async getTimelineById(id: string): Promise<Timeline | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockTimelines.find(t => t.id === id) || null;
  }

  static async createTimeline(data: CreateTimelineRequest): Promise<Timeline> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newTimeline: Timeline = {
      id: uuidv4(),
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      sprints: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockTimelines.push(newTimeline);
    return newTimeline;
  }

  static async updateTimeline(data: UpdateTimelineRequest): Promise<Timeline | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const timelineIndex = mockTimelines.findIndex(t => t.id === data.id);
    if (timelineIndex === -1) return null;

    const updatedTimeline = {
      ...mockTimelines[timelineIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };

    mockTimelines[timelineIndex] = updatedTimeline;
    return updatedTimeline;
  }

  static async deleteTimeline(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const initialLength = mockTimelines.length;
    mockTimelines = mockTimelines.filter(t => t.id !== id);
    return mockTimelines.length < initialLength;
  }

  // Sprint CRUD operations
  static async createSprint(data: CreateSprintRequest): Promise<Sprint | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const timeline = mockTimelines.find(t => t.id === data.timelineId);
    if (!timeline) return null;

    const newSprint: Sprint = {
      id: uuidv4(),
      timelineId: data.timelineId,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      duration: calculateDuration(data.startDate, data.endDate),
      department: data.department,
      resources: data.resources || [],
      notes: data.notes,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    timeline.sprints.push(newSprint);
    
    // Recalculate timeline dates
    const { startDate, endDate } = recalculateParentDates(timeline.sprints);
    timeline.startDate = startDate;
    timeline.endDate = endDate;
    timeline.updatedAt = new Date().toISOString();

    return newSprint;
  }

  static async updateSprint(data: UpdateSprintRequest): Promise<Sprint | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const timeline = mockTimelines.find(t => t.sprints.some(s => s.id === data.id));
    if (!timeline) return null;

    const sprintIndex = timeline.sprints.findIndex(s => s.id === data.id);
    if (sprintIndex === -1) return null;

    const updatedSprint = {
      ...timeline.sprints[sprintIndex],
      ...data,
      duration: data.startDate && data.endDate 
        ? calculateDuration(data.startDate, data.endDate)
        : timeline.sprints[sprintIndex].duration,
      updatedAt: new Date().toISOString()
    };

    timeline.sprints[sprintIndex] = updatedSprint;

    // Recalculate timeline dates
    const { startDate, endDate } = recalculateParentDates(timeline.sprints);
    timeline.startDate = startDate;
    timeline.endDate = endDate;
    timeline.updatedAt = new Date().toISOString();

    return updatedSprint;
  }

  static async deleteSprint(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const timeline = mockTimelines.find(t => t.sprints.some(s => s.id === id));
    if (!timeline) return false;

    const initialLength = timeline.sprints.length;
    timeline.sprints = timeline.sprints.filter(s => s.id !== id);
    
    if (timeline.sprints.length < initialLength) {
      // Recalculate timeline dates
      if (timeline.sprints.length > 0) {
        const { startDate, endDate } = recalculateParentDates(timeline.sprints);
        timeline.startDate = startDate;
        timeline.endDate = endDate;
      }
      timeline.updatedAt = new Date().toISOString();
      return true;
    }

    return false;
  }

  // Task CRUD operations
  static async createTask(data: CreateTaskRequest): Promise<Task | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const timeline = mockTimelines.find(t => t.sprints.some(s => s.id === data.sprintId));
    if (!timeline) return null;

    const sprint = timeline.sprints.find(s => s.id === data.sprintId);
    if (!sprint) return null;

    const newTask: Task = {
      id: uuidv4(),
      sprintId: data.sprintId,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      duration: calculateDuration(data.startDate, data.endDate),
      department: data.department,
      resources: data.resources || [],
      notes: data.notes,
      status: data.status,
      priority: data.priority,
      progress: data.progress,
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sprint.tasks.push(newTask);
    
    // Recalculate sprint and timeline dates
    const { startDate: sprintStart, endDate: sprintEnd } = recalculateParentDates(sprint.tasks);
    sprint.startDate = sprintStart;
    sprint.endDate = sprintEnd;
    sprint.duration = calculateDuration(sprintStart, sprintEnd);
    sprint.updatedAt = new Date().toISOString();

    const { startDate: timelineStart, endDate: timelineEnd } = recalculateParentDates(timeline.sprints);
    timeline.startDate = timelineStart;
    timeline.endDate = timelineEnd;
    timeline.updatedAt = new Date().toISOString();

    return newTask;
  }

  static async updateTask(data: UpdateTaskRequest): Promise<Task | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const timeline = mockTimelines.find(t => 
      t.sprints.some(s => s.tasks.some(task => task.id === data.id))
    );
    if (!timeline) return null;

    const sprint = timeline.sprints.find(s => s.tasks.some(task => task.id === data.id));
    if (!sprint) return null;

    const taskIndex = sprint.tasks.findIndex(task => task.id === data.id);
    if (taskIndex === -1) return null;

    const updatedTask = {
      ...sprint.tasks[taskIndex],
      ...data,
      duration: data.startDate && data.endDate 
        ? calculateDuration(data.startDate, data.endDate)
        : sprint.tasks[taskIndex].duration,
      updatedAt: new Date().toISOString()
    };

    sprint.tasks[taskIndex] = updatedTask;

    // Recalculate sprint and timeline dates
    const { startDate: sprintStart, endDate: sprintEnd } = recalculateParentDates(sprint.tasks);
    sprint.startDate = sprintStart;
    sprint.endDate = sprintEnd;
    sprint.duration = calculateDuration(sprintStart, sprintEnd);
    sprint.updatedAt = new Date().toISOString();

    const { startDate: timelineStart, endDate: timelineEnd } = recalculateParentDates(timeline.sprints);
    timeline.startDate = timelineStart;
    timeline.endDate = timelineEnd;
    timeline.updatedAt = new Date().toISOString();

    return updatedTask;
  }

  static async deleteTask(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const timeline = mockTimelines.find(t => 
      t.sprints.some(s => s.tasks.some(task => task.id === id))
    );
    if (!timeline) return false;

    const sprint = timeline.sprints.find(s => s.tasks.some(task => task.id === id));
    if (!sprint) return false;

    const initialLength = sprint.tasks.length;
    sprint.tasks = sprint.tasks.filter(task => task.id !== id);
    
    if (sprint.tasks.length < initialLength) {
      // Recalculate sprint and timeline dates
      if (sprint.tasks.length > 0) {
        const { startDate: sprintStart, endDate: sprintEnd } = recalculateParentDates(sprint.tasks);
        sprint.startDate = sprintStart;
        sprint.endDate = sprintEnd;
        sprint.duration = calculateDuration(sprintStart, sprintEnd);
      }
      sprint.updatedAt = new Date().toISOString();

      if (timeline.sprints.length > 0) {
        const { startDate: timelineStart, endDate: timelineEnd } = recalculateParentDates(timeline.sprints);
        timeline.startDate = timelineStart;
        timeline.endDate = timelineEnd;
      }
      timeline.updatedAt = new Date().toISOString();

      return true;
    }

    return false;
  }

  // Subtask CRUD operations
  static async createSubtask(data: CreateSubtaskRequest): Promise<Subtask | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const timeline = mockTimelines.find(t => 
      t.sprints.some(s => s.tasks.some(task => task.id === data.taskId))
    );
    if (!timeline) return null;

    const sprint = timeline.sprints.find(s => s.tasks.some(task => task.id === data.taskId));
    if (!sprint) return null;

    const task = sprint.tasks.find(task => task.id === data.taskId);
    if (!task) return null;

    const newSubtask: Subtask = {
      id: uuidv4(),
      taskId: data.taskId,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      duration: calculateDuration(data.startDate, data.endDate),
      department: data.department,
      resources: data.resources || [],
      notes: data.notes,
      status: data.status,
      priority: data.priority,
      progress: data.progress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    task.subtasks.push(newSubtask);
    
    // Recalculate task, sprint, and timeline dates
    const { startDate: taskStart, endDate: taskEnd } = recalculateParentDates(task.subtasks);
    task.startDate = taskStart;
    task.endDate = taskEnd;
    task.duration = calculateDuration(taskStart, taskEnd);
    task.updatedAt = new Date().toISOString();

    const { startDate: sprintStart, endDate: sprintEnd } = recalculateParentDates(sprint.tasks);
    sprint.startDate = sprintStart;
    sprint.endDate = sprintEnd;
    sprint.duration = calculateDuration(sprintStart, sprintEnd);
    sprint.updatedAt = new Date().toISOString();

    const { startDate: timelineStart, endDate: timelineEnd } = recalculateParentDates(timeline.sprints);
    timeline.startDate = timelineStart;
    timeline.endDate = timelineEnd;
    timeline.updatedAt = new Date().toISOString();

    return newSubtask;
  }

  static async updateSubtask(data: UpdateSubtaskRequest): Promise<Subtask | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const timeline = mockTimelines.find(t => 
      t.sprints.some(s => 
        s.tasks.some(task => 
          task.subtasks.some(subtask => subtask.id === data.id)
        )
      )
    );
    if (!timeline) return null;

    const sprint = timeline.sprints.find(s => 
      s.tasks.some(task => 
        task.subtasks.some(subtask => subtask.id === data.id)
      )
    );
    if (!sprint) return null;

    const task = sprint.tasks.find(task => 
      task.subtasks.some(subtask => subtask.id === data.id)
    );
    if (!task) return null;

    const subtaskIndex = task.subtasks.findIndex(subtask => subtask.id === data.id);
    if (subtaskIndex === -1) return null;

    const updatedSubtask = {
      ...task.subtasks[subtaskIndex],
      ...data,
      duration: data.startDate && data.endDate 
        ? calculateDuration(data.startDate, data.endDate)
        : task.subtasks[subtaskIndex].duration,
      updatedAt: new Date().toISOString()
    };

    task.subtasks[subtaskIndex] = updatedSubtask;

    // Recalculate task, sprint, and timeline dates
    const { startDate: taskStart, endDate: taskEnd } = recalculateParentDates(task.subtasks);
    task.startDate = taskStart;
    task.endDate = taskEnd;
    task.duration = calculateDuration(taskStart, taskEnd);
    task.updatedAt = new Date().toISOString();

    const { startDate: sprintStart, endDate: sprintEnd } = recalculateParentDates(sprint.tasks);
    sprint.startDate = sprintStart;
    sprint.endDate = sprintEnd;
    sprint.duration = calculateDuration(sprintStart, sprintEnd);
    sprint.updatedAt = new Date().toISOString();

    const { startDate: timelineStart, endDate: timelineEnd } = recalculateParentDates(timeline.sprints);
    timeline.startDate = timelineStart;
    timeline.endDate = timelineEnd;
    timeline.updatedAt = new Date().toISOString();

    return updatedSubtask;
  }

  static async deleteSubtask(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const timeline = mockTimelines.find(t => 
      t.sprints.some(s => 
        s.tasks.some(task => 
          task.subtasks.some(subtask => subtask.id === id)
        )
      )
    );
    if (!timeline) return false;

    const sprint = timeline.sprints.find(s => 
      s.tasks.some(task => 
        task.subtasks.some(subtask => subtask.id === id)
      )
    );
    if (!sprint) return false;

    const task = sprint.tasks.find(task => 
      task.subtasks.some(subtask => subtask.id === id)
    );
    if (!task) return false;

    const initialLength = task.subtasks.length;
    task.subtasks = task.subtasks.filter(subtask => subtask.id !== id);
    
    if (task.subtasks.length < initialLength) {
      // Recalculate task, sprint, and timeline dates
      if (task.subtasks.length > 0) {
        const { startDate: taskStart, endDate: taskEnd } = recalculateParentDates(task.subtasks);
        task.startDate = taskStart;
        task.endDate = taskEnd;
        task.duration = calculateDuration(taskStart, taskEnd);
      }
      task.updatedAt = new Date().toISOString();

      if (sprint.tasks.length > 0) {
        const { startDate: sprintStart, endDate: sprintEnd } = recalculateParentDates(sprint.tasks);
        sprint.startDate = sprintStart;
        sprint.endDate = sprintEnd;
        sprint.duration = calculateDuration(sprintStart, sprintEnd);
      }
      sprint.updatedAt = new Date().toISOString();

      if (timeline.sprints.length > 0) {
        const { startDate: timelineStart, endDate: timelineEnd } = recalculateParentDates(timeline.sprints);
        timeline.startDate = timelineStart;
        timeline.endDate = timelineEnd;
      }
      timeline.updatedAt = new Date().toISOString();

      return true;
    }

    return false;
  }

  // Helper methods
  static getDepartments(): Department[] {
    return mockDepartments;
  }

  static getResources(): Resource[] {
    return mockResources;
  }

  static getResourcesByDepartment(department: string): Resource[] {
    return mockResources.filter(r => r.department === department);
  }
}

// Export singleton instance
export const timelineApiService = new TimelineService();
