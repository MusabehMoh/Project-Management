import { Project } from "@/types/project";
import { Timeline, Sprint, Task, Subtask } from "@/types/timeline";
import { User } from "@/types/user";

// Global search result interface
export interface GlobalSearchResult {
  id: string;
  type: "project" | "user" | "timeline" | "sprint" | "task" | "subtask";
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
  metadata?: {
    status?: string;
    department?: string;
    progress?: number;
    priority?: string;
    startDate?: string;
    endDate?: string;
  };
  matchedFields: string[];
  score: number; // Relevance score for sorting
}

export interface SearchFilters {
  types?: ("project" | "user" | "timeline" | "sprint" | "task" | "subtask")[];
  status?: string[];
  departments?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export interface GlobalSearchOptions {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  includeInactive?: boolean;
}

export class GlobalSearchService {
  private static projects: Project[] = [];
  private static users: User[] = [];
  private static timelines: Timeline[] = [];
  private static initialized: boolean = false;

  /**
   * Initialize the search service with data
   */
  static initialize(data: {
    projects?: Project[];
    users?: User[];
    timelines?: Timeline[];
  }) {
    if (data.projects) this.projects = data.projects;
    if (data.users) this.users = data.users;
    if (data.timelines) this.timelines = data.timelines;
    this.initialized = true;
  }

  /**
   * Update specific data type
   */
  static updateData(type: "projects" | "users" | "timelines", data: any[]) {
    switch (type) {
      case "projects":
        this.projects = data as Project[];
        break;
      case "users":
        this.users = data as User[];
        break;
      case "timelines":
        this.timelines = data as Timeline[];
        break;
    }
  }

  /**
   * Perform global search across all data types
   */
  static async search(
    options: GlobalSearchOptions,
  ): Promise<GlobalSearchResult[]> {
    const { query, filters, limit = 50, includeInactive = false } = options;

    if (!query || query.trim().length < 2) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    const results: GlobalSearchResult[] = [];

    // Search projects
    if (!filters?.types || filters.types.includes("project")) {
      const projectResults = this.searchProjects(
        normalizedQuery,
        filters,
        includeInactive,
      );

      results.push(...projectResults);
    }

    // Search users
    if (!filters?.types || filters.types.includes("user")) {
      const userResults = this.searchUsers(
        normalizedQuery,
        filters,
        includeInactive,
      );

      results.push(...userResults);
    }

    // Search timelines and their components
    if (
      !filters?.types ||
      filters.types.some((t) =>
        ["timeline", "sprint", "task", "subtask"].includes(t),
      )
    ) {
      const timelineResults = this.searchTimelines(normalizedQuery, filters);

      results.push(...timelineResults);
    }

    // Sort by relevance score (higher is better)
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Search projects
   */
  private static searchProjects(
    query: string,
    filters?: SearchFilters,
    includeInactive = false,
  ): GlobalSearchResult[] {
    return this.projects
      .filter((project) => {
        if (!includeInactive && project.status === "cancelled") return false;
        if (filters?.status?.length && !filters.status.includes(project.status))
          return false;

        return this.matchesProjectQuery(project, query);
      })
      .map((project) => this.projectToSearchResult(project, query))
      .filter((result) => result.score > 0);
  }

  /**
   * Search users
   */
  private static searchUsers(
    query: string,
    filters?: SearchFilters,
    includeInactive = false,
  ): GlobalSearchResult[] {
    return this.users
      .filter((user) => {
        if (!includeInactive && !user.isVisible) return false;
        if (
          filters?.departments?.length &&
          !filters.departments.includes(user.department || "")
        )
          return false;

        return this.matchesUserQuery(user, query);
      })
      .map((user) => this.userToSearchResult(user, query))
      .filter((result) => result.score > 0);
  }

  /**
   * Search timelines and their components
   */
  private static searchTimelines(
    query: string,
    filters?: SearchFilters,
  ): GlobalSearchResult[] {
    const results: GlobalSearchResult[] = [];

    for (const timeline of this.timelines) {
      // Search timeline itself
      if (!filters?.types || filters.types.includes("timeline")) {
        if (this.matchesTimelineQuery(timeline, query)) {
          results.push(this.timelineToSearchResult(timeline, query));
        }
      }

      // Search sprints
      if (!filters?.types || filters.types.includes("sprint")) {
        for (const sprint of timeline.sprints || []) {
          if (this.matchesSprintQuery(sprint, query)) {
            results.push(this.sprintToSearchResult(sprint, timeline, query));
          }
        }
      }

      // Search tasks and subtasks
      if (
        !filters?.types ||
        filters.types.some((t) => ["task", "subtask"].includes(t))
      ) {
        for (const sprint of timeline.sprints || []) {
          for (const task of sprint.tasks || []) {
            // Search task
            if (!filters?.types || filters.types.includes("task")) {
              if (this.matchesTaskQuery(task, query)) {
                results.push(
                  this.taskToSearchResult(task, sprint, timeline, query),
                );
              }
            }

            // Search subtasks
            if (!filters?.types || filters.types.includes("subtask")) {
              for (const subtask of task.subtasks || []) {
                if (this.matchesSubtaskQuery(subtask, query)) {
                  results.push(
                    this.subtaskToSearchResult(
                      subtask,
                      task,
                      sprint,
                      timeline,
                      query,
                    ),
                  );
                }
              }
            }
          }
        }
      }
    }

    return results.filter((result) => result.score > 0);
  }

  /**
   * Check if project matches query
   */
  private static matchesProjectQuery(project: Project, query: string): boolean {
    const searchableText = [
      project.applicationName,
      project.projectOwner,
      project.alternativeOwner,
      project.owningUnit,
      project.description,
      project.remarks,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  }

  /**
   * Check if user matches query
   */
  private static matchesUserQuery(user: User, query: string): boolean {
    const searchableText = [
      user.fullName,
      user.militaryNumber,
      user.userName,
      user.email,
      user.department,
      user.gradeName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  }

  /**
   * Check if timeline matches query
   */
  private static matchesTimelineQuery(
    timeline: Timeline,
    query: string,
  ): boolean {
    const searchableText = [
      timeline.name,
      timeline.description,
      "timeline", // Add the word "timeline" to make timeline objects findable
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  }

  /**
   * Check if sprint matches query
   */
  private static matchesSprintQuery(sprint: Sprint, query: string): boolean {
    const searchableText = [
      sprint.name,
      sprint.description,
      sprint.department,
      sprint.notes,
      "sprint", // Add the word "sprint" to make sprint objects findable
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  }

  /**
   * Check if task matches query
   */
  private static matchesTaskQuery(task: Task, query: string): boolean {
    const searchableText = [
      task.name,
      task.description,
      task.department,
      task.notes,
      "task", // Add the word "task" to make task objects findable
      ...(task.resources || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  }

  /**
   * Check if subtask matches query
   */
  private static matchesSubtaskQuery(subtask: Subtask, query: string): boolean {
    const searchableText = [
      subtask.name,
      subtask.description,
      subtask.department,
      subtask.notes,
      "subtask", // Add the word "subtask" to make subtask objects findable
      ...(subtask.resources || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  }

  /**
   * Convert project to search result
   */
  private static projectToSearchResult(
    project: Project,
    query: string,
  ): GlobalSearchResult {
    const matchedFields = this.getMatchedFields(
      {
        name: project.applicationName,
        owner: project.projectOwner,
        unit: project.owningUnit,
        description: project.description,
      },
      query,
    );

    return {
      id: `project-${project.id}`,
      type: "project",
      title: project.applicationName,
      subtitle: `${project.projectOwner} • ${project.owningUnit}`,
      description: project.description,
      href: `/projects?id=${project.id}`,
      metadata: {
        status: project.status,
        progress: project.progress,
        startDate: project.startDate,
        endDate: project.expectedCompletionDate,
      },
      matchedFields,
      score: this.calculateScore(matchedFields, query, project.applicationName),
    };
  }

  /**
   * Convert user to search result
   */
  private static userToSearchResult(
    user: User,
    query: string,
  ): GlobalSearchResult {
    const matchedFields = this.getMatchedFields(
      {
        name: user.fullName,
        militaryNumber: user.militaryNumber,
        department: user.department,
        email: user.email,
      },
      query,
    );

    return {
      id: `user-${user.id}`,
      type: "user",
      title: user.fullName,
      subtitle: `${user.gradeName} • ${user.militaryNumber}`,
      description: `${user.department || ""}`,
      href: `/users?id=${user.id}`,
      metadata: {
        department: user.department,
        status: user.isVisible ? "active" : "inactive",
      },
      matchedFields,
      score: this.calculateScore(matchedFields, query, user.fullName),
    };
  }

  /**
   * Convert timeline to search result
   */
  private static timelineToSearchResult(
    timeline: Timeline,
    query: string,
  ): GlobalSearchResult {
    const matchedFields = this.getMatchedFields(
      {
        name: timeline.name,
        description: timeline.description,
      },
      query,
    );

    return {
      id: `timeline-${timeline.id}`,
      type: "timeline",
      title: timeline.name,
      subtitle: "Timeline",
      description: timeline.description,
      href: `/timeline?projectId=${timeline.projectId}&timelineId=${timeline.id}`,
      metadata: {
        startDate: timeline.startDate,
        endDate: timeline.endDate,
      },
      matchedFields,
      score: this.calculateScore(matchedFields, query, timeline.name),
    };
  }

  /**
   * Convert sprint to search result
   */
  private static sprintToSearchResult(
    sprint: Sprint,
    timeline: Timeline,
    query: string,
  ): GlobalSearchResult {
    const matchedFields = this.getMatchedFields(
      {
        name: sprint.name,
        description: sprint.description,
        department: sprint.department,
      },
      query,
    );

    return {
      id: `sprint-${sprint.id}`,
      type: "sprint",
      title: sprint.name,
      subtitle: `Sprint in ${timeline.name}`,
      description: sprint.description,
      href: `/timeline?projectId=${timeline.projectId}&timelineId=${timeline.id}&sprintId=${sprint.id}`,
      metadata: {
        department: sprint.department,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
      },
      matchedFields,
      score: this.calculateScore(matchedFields, query, sprint.name),
    };
  }

  /**
   * Convert task to search result
   */
  private static taskToSearchResult(
    task: Task,
    sprint: Sprint,
    timeline: Timeline,
    query: string,
  ): GlobalSearchResult {
    const matchedFields = this.getMatchedFields(
      {
        name: task.name,
        description: task.description,
        department: task.department,
      },
      query,
    );

    return {
      id: `task-${task.id}`,
      type: "task",
      title: task.name,
      subtitle: `Task in ${sprint.name}`,
      description: task.description,
      href: `/timeline?projectId=${timeline.projectId}&timelineId=${timeline.id}&sprintId=${sprint.id}&taskId=${task.id}`,
      metadata: {
        status: task.status,
        priority: task.priority,
        progress: task.progress,
        department: task.department,
        startDate: task.startDate,
        endDate: task.endDate,
      },
      matchedFields,
      score: this.calculateScore(matchedFields, query, task.name),
    };
  }

  /**
   * Convert subtask to search result
   */
  private static subtaskToSearchResult(
    subtask: Subtask,
    task: Task,
    sprint: Sprint,
    timeline: Timeline,
    query: string,
  ): GlobalSearchResult {
    const matchedFields = this.getMatchedFields(
      {
        name: subtask.name,
        description: subtask.description,
        department: subtask.department,
      },
      query,
    );

    return {
      id: `subtask-${subtask.id}`,
      type: "subtask",
      title: subtask.name,
      subtitle: `Subtask in ${task.name}`,
      description: subtask.description,
      href: `/timeline?projectId=${timeline.projectId}&timelineId=${timeline.id}&sprintId=${sprint.id}&taskId=${task.id}&subtaskId=${subtask.id}`,
      metadata: {
        status: subtask.status,
        priority: subtask.priority,
        progress: subtask.progress,
        department: subtask.department,
        startDate: subtask.startDate,
        endDate: subtask.endDate,
      },
      matchedFields,
      score: this.calculateScore(matchedFields, query, subtask.name),
    };
  }

  /**
   * Get matched fields for highlighting
   */
  private static getMatchedFields(
    fields: Record<string, string | undefined>,
    query: string,
  ): string[] {
    const matched: string[] = [];
    const normalizedQuery = query.toLowerCase();

    Object.entries(fields).forEach(([key, value]) => {
      if (value && value.toLowerCase().includes(normalizedQuery)) {
        matched.push(key);
      }
    });

    return matched;
  }

  /**
   * Calculate relevance score
   */
  private static calculateScore(
    matchedFields: string[],
    query: string,
    title: string,
  ): number {
    let score = 0;
    const normalizedQuery = query.toLowerCase();
    const normalizedTitle = title.toLowerCase();

    // Exact title match gets highest score
    if (normalizedTitle === normalizedQuery) {
      score += 100;
    } else if (normalizedTitle.startsWith(normalizedQuery)) {
      score += 80;
    } else if (normalizedTitle.includes(normalizedQuery)) {
      score += 60;
    }

    // Add points for each matched field
    score += matchedFields.length * 10;

    // Bonus for name field matches
    if (matchedFields.includes("name")) {
      score += 20;
    }

    return score;
  }

  /**
   * Get search suggestions based on existing data
   */
  static getSuggestions(query: string, limit = 10): string[] {
    if (!query || query.length < 2) return [];

    const normalizedQuery = query.toLowerCase();
    const suggestions = new Set<string>();

    // Get suggestions from projects
    this.projects.forEach((project) => {
      if (project.applicationName.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(project.applicationName);
      }
      if (project.projectOwner.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(project.projectOwner);
      }
      if (project.owningUnit.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(project.owningUnit);
      }
    });

    // Get suggestions from users
    this.users.forEach((user) => {
      if (user.fullName.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(user.fullName);
      }
      if (
        user.department &&
        user.department.toLowerCase().includes(normalizedQuery)
      ) {
        suggestions.add(user.department);
      }
    });

    // Get suggestions from timelines
    this.timelines.forEach((timeline) => {
      if (timeline.name.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(timeline.name);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Debug function to check current service state
   */
  static debug() {
    console.log("🔍 GlobalSearchService Debug Info:", {
      initialized: this.initialized,
      projects: this.projects.length,
      users: this.users.length,
      timelines: this.timelines.length,
      sampleProject: this.projects[0],
      sampleUser: this.users[0],
      sampleTimeline: this.timelines[0],
    });

    return {
      initialized: this.initialized,
      projectsCount: this.projects.length,
      usersCount: this.users.length,
      timelinesCount: this.timelines.length,
    };
  }
}

export default GlobalSearchService;
