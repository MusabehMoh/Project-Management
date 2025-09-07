import {
  Timeline,
  Sprint,
  Department,
  Resource,
  ProjectWithTimelines,
  MemberSearchResult,
  WorkItem,
} from "../types/timeline.js";
import { mockProjects } from "../data/mockProjects.js";
import { mockTimelines } from "../data/mockTimelines.js";
import {
  mockDepartments,
  mockResources,
  mockMembers,
} from "../data/mockData.js";

export class TimelineService {
  // Static data shared across all instances
  private static timelines: Timeline[] = [...mockTimelines];

  async getByProjectId(projectId: number): Promise<Timeline[]> {
    return TimelineService.timelines.filter(
      (timeline) => timeline.projectId === projectId,
    );
  }

  async getById(id: string): Promise<Timeline | null> {
    const timelineId = parseInt(id, 10);
    const timeline = TimelineService.timelines.find((t) => t.id === timelineId);

    return timeline || null;
  }

  async getProjectsWithTimelines(): Promise<ProjectWithTimelines[]> {
    const projects = mockProjects;

    return projects.map((project) => {
      const projectTimelines = TimelineService.timelines.filter(
        (timeline) => timeline.projectId === project.id,
      );

      return {
        projectId: project.id,
        projectName: project.applicationName,
        timelineCount: projectTimelines.length,
        timelines: projectTimelines,
      };
    });
  }

  async create(timeline: Timeline): Promise<Timeline> {
    TimelineService.timelines.push(timeline);

    return timeline;
  }

  async update(
    id: string,
    updates: Partial<Timeline>,
  ): Promise<Timeline | null> {
    const timelineId = typeof id === "string" ? parseInt(id, 10) : id;
    const index = TimelineService.timelines.findIndex(
      (timeline) => timeline.id === timelineId,
    );

    if (index === -1) {
      return null;
    }

    TimelineService.timelines[index] = {
      ...TimelineService.timelines[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return TimelineService.timelines[index];
  }

  async delete(id: string): Promise<boolean> {
    const timelineId = typeof id === "string" ? parseInt(id, 10) : id;
    const index = TimelineService.timelines.findIndex(
      (timeline) => timeline.id === timelineId,
    );

    if (index === -1) {
      return false;
    }

    TimelineService.timelines.splice(index, 1);

    return true;
  }

  async getDepartments(): Promise<Department[]> {
    return mockDepartments;
  }

  async getResources(): Promise<Resource[]> {
    return mockResources;
  }

  async createSprint(
    timelineId: string,
    sprintData: Partial<Sprint>,
  ): Promise<Sprint | null> {
    const timelineIdNum = parseInt(timelineId, 10);
    const timeline = TimelineService.timelines.find(
      (t) => t.id === timelineIdNum,
    );

    if (!timeline) {
      return null;
    }

    // Generate a new sprint ID
    const newSprintId =
      Math.max(
        0,
        ...TimelineService.timelines.flatMap(
          (t) => t.sprints?.map((s) => s.id) || [],
        ),
      ) + 1;

    const newSprint: Sprint = {
      id: newSprintId,
      treeId: `sprint-${newSprintId}`,
      timelineId: timelineIdNum,
      name: sprintData.name || "",
      description: sprintData.description || "",
      startDate: sprintData.startDate || new Date().toISOString(),
      endDate: sprintData.endDate || new Date().toISOString(),
      duration: this.calculateDuration(
        sprintData.startDate || new Date().toISOString(),
        sprintData.endDate || new Date().toISOString(),
      ),
      statusId: sprintData.statusId || 1,
      departmentId: sprintData.departmentId,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!timeline.sprints) {
      timeline.sprints = [];
    }

    timeline.sprints.push(newSprint);
    timeline.updatedAt = new Date().toISOString();

    return newSprint;
  }

  async createTaskForSprint(
    sprintId: string,
    taskData: any,
  ): Promise<any | null> {
    const sprintIdNum = parseInt(sprintId, 10);

    // Find the sprint across all timelines
    let targetSprint = null;

    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        targetSprint = timeline.sprints.find((s) => s.id === sprintIdNum);
        if (targetSprint) break;
      }
    }

    if (!targetSprint) {
      return null;
    }

    // Generate a new task ID
    const newTaskId =
      Math.max(
        0,
        ...TimelineService.timelines.flatMap(
          (t) =>
            t.sprints?.flatMap((s) => s.tasks?.map((task) => task.id) || []) ||
            [],
        ),
      ) + 1;

    const newTask = {
      id: newTaskId,
      treeId: `task-${newTaskId}`,
      sprintId: sprintIdNum,
      name: taskData.name || "",
      description: taskData.description || "",
      startDate: taskData.startDate || new Date().toISOString(),
      endDate: taskData.endDate || new Date().toISOString(),
      duration: this.calculateDuration(
        taskData.startDate || new Date().toISOString(),
        taskData.endDate || new Date().toISOString(),
      ),
      statusId: taskData.statusId || 1,
      priorityId: taskData.priorityId || 2,
      departmentId: taskData.departmentId,
      assigneeId: taskData.assigneeId,
      assigneeName: taskData.assigneeName,
      estimatedHours: taskData.estimatedHours || 0,
      actualHours: taskData.actualHours || 0,
      dependencies: taskData.dependencies || [],
      progress: taskData.progress || 0,
      subtasks: [],
      dependentTasks: [],
      members: [],
      depTasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!targetSprint.tasks) {
      targetSprint.tasks = [];
    }

    targetSprint.tasks.push(newTask);
    targetSprint.updatedAt = new Date().toISOString();

    return newTask;
  }

  private calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  async updateSubtask(
    timelineId: string,
    sprintId: string,
    taskId: string,
    subtaskId: string,
    updates: { name?: string; description?: string; status?: string },
  ): Promise<any> {
    const timelineIdNum = parseInt(timelineId, 10);
    const sprintIdNum = parseInt(sprintId, 10);
    const taskIdNum = parseInt(taskId, 10);
    const subtaskIdNum = parseInt(subtaskId, 10);

    const timeline = TimelineService.timelines.find(
      (t) => t.id === timelineIdNum,
    );

    if (!timeline) {
      return null;
    }

    const sprint = timeline.sprints?.find((s) => s.id === sprintIdNum);

    if (!sprint) {
      return null;
    }

    const task = sprint.tasks?.find((t) => t.id === taskIdNum);

    if (!task) {
      return null;
    }

    const subtask = task.subtasks?.find((st) => st.id === subtaskIdNum);

    if (!subtask) {
      return null;
    }

    // Update the subtask
    Object.assign(subtask, updates);
    subtask.updatedAt = new Date().toISOString();

    return subtask;
  }

  async findAndUpdateSubtask(
    subtaskId: string,
    updates: { name?: string; description?: string; status?: string },
  ): Promise<any> {
    const subtaskIdNum = parseInt(subtaskId, 10);

    // Find subtask across all timelines
    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        for (const sprint of timeline.sprints) {
          if (sprint.tasks) {
            for (const task of sprint.tasks) {
              if (task.subtasks) {
                const subtask = task.subtasks.find(
                  (st) => st.id === subtaskIdNum,
                );

                if (subtask) {
                  // Update the subtask
                  Object.assign(subtask, updates);
                  subtask.updatedAt = new Date().toISOString();

                  return subtask;
                }
              }
            }
          }
        }
      }
    }

    return null;
  }

  async findSubtaskById(subtaskId: string): Promise<any> {
    const subtaskIdNum = parseInt(subtaskId, 10);

    // Find subtask across all timelines
    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        for (const sprint of timeline.sprints) {
          if (sprint.tasks) {
            for (const task of sprint.tasks) {
              if (task.subtasks) {
                const subtask = task.subtasks.find(
                  (st) => st.id === subtaskIdNum,
                );

                if (subtask) {
                  return subtask;
                }
              }
            }
          }
        }
      }
    }

    return null;
  }

  async deleteSubtask(subtaskId: string): Promise<boolean> {
    const subtaskIdNum = parseInt(subtaskId, 10);

    // Find and delete subtask across all timelines
    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        for (const sprint of timeline.sprints) {
          if (sprint.tasks) {
            for (const task of sprint.tasks) {
              if (task.subtasks) {
                const subtaskIndex = task.subtasks.findIndex(
                  (st) => st.id === subtaskIdNum,
                );

                if (subtaskIndex !== -1) {
                  task.subtasks.splice(subtaskIndex, 1);

                  return true;
                }
              }
            }
          }
        }
      }
    }

    return false;
  }

  async findAndUpdateTask(taskId: string, updates: any): Promise<any | null> {
    const taskIdNum = parseInt(taskId, 10);

    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        for (const sprint of timeline.sprints) {
          if (sprint.tasks) {
            const taskIndex = sprint.tasks.findIndex(
              (t) => t.id === taskIdNum,
            );

            if (taskIndex !== -1) {
              const task = sprint.tasks[taskIndex];

              // Handle date movements
              if (updates.moveDays !== undefined) {
                const moveDays = parseInt(updates.moveDays, 10);
                const startDate = new Date(task.startDate || "");
                const endDate = new Date(task.endDate || "");

                startDate.setDate(startDate.getDate() + moveDays);
                endDate.setDate(endDate.getDate() + moveDays);

                updates.startDate = startDate.toISOString().split("T")[0];
                updates.endDate = endDate.toISOString().split("T")[0];

                // Remove moveDays from updates as it's not a direct task property
                delete updates.moveDays;
              }

              // Update the task
              sprint.tasks[taskIndex] = {
                ...task,
                ...updates,
                updatedAt: new Date().toISOString(),
              };

              return sprint.tasks[taskIndex];
            }
          }
        }
      }
    }

    return null;
  }

  async findTaskById(taskId: string): Promise<any> {
    const taskIdNum = parseInt(taskId, 10);

    // Find task across all timelines and sprints
    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        for (const sprint of timeline.sprints) {
          if (sprint.tasks) {
            const task = sprint.tasks.find((t) => t.id === taskIdNum);

            if (task) {
              return task;
            }
          }
        }
      }
    }

    return null;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const taskIdNum = parseInt(taskId, 10);

    // Find and delete task across all timelines and sprints
    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        for (const sprint of timeline.sprints) {
          if (sprint.tasks) {
            const taskIndex = sprint.tasks.findIndex(
              (t) => t.id === taskIdNum,
            );

            if (taskIndex !== -1) {
              sprint.tasks.splice(taskIndex, 1);
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  async findAndUpdateSprint(
    sprintId: string,
    updates: { name?: string; description?: string; status?: string },
  ): Promise<any> {
    const sprintIdNum = parseInt(sprintId, 10);

    // Find sprint across all timelines
    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        const sprint = timeline.sprints.find((s) => s.id === sprintIdNum);

        if (sprint) {
          // Update the sprint
          Object.assign(sprint, updates);
          sprint.updatedAt = new Date().toISOString();

          return sprint;
        }
      }
    }

    return null;
  }

  async findSprintById(sprintId: string): Promise<any> {
    const sprintIdNum = parseInt(sprintId, 10);

    // Find sprint across all timelines
    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        const sprint = timeline.sprints.find((s) => s.id === sprintIdNum);

        if (sprint) {
          return sprint;
        }
      }
    }

    return null;
  }

  async deleteSprint(sprintId: string): Promise<boolean> {
    const sprintIdNum = parseInt(sprintId, 10);

    // Find and delete sprint across all timelines
    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        const sprintIndex = timeline.sprints.findIndex(
          (s) => s.id === sprintIdNum,
        );

        if (sprintIndex !== -1) {
          timeline.sprints.splice(sprintIndex, 1);

          return true;
        }
      }
    }

    return false;
  }

  async getTasksBySprintId(sprintId: string): Promise<any[] | null> {
    const sprintIdNum = parseInt(sprintId, 10);

    // Find sprint and return its tasks
    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        const sprint = timeline.sprints.find((s) => s.id === sprintIdNum);

        if (sprint) {
          return sprint.tasks || [];
        }
      }
    }

    return null; // Sprint not found
  }

  async searchAllMembers(query: string): Promise<MemberSearchResult[]> {
    if (!query || query.trim() === "") {
      return mockMembers;
    }

    const searchTerm = query.toLowerCase().trim();

    return mockMembers.filter((member) => {
      return (
        member.userName.toLowerCase().includes(searchTerm) ||
        member.militaryNumber.toLowerCase().includes(searchTerm) ||
        member.fullName.toLowerCase().includes(searchTerm) ||
        member.gradeName.toLowerCase().includes(searchTerm) ||
        member.department.toLowerCase().includes(searchTerm)
      );
    });
  }

  async searchTasks(query: string): Promise<WorkItem[]> {
    if (!query || query.trim() === "") {
      return this.getAllTasks();
    }

    const searchTerm = query.toLowerCase().trim();
    const allTasks = this.getAllTasks();

    return allTasks.filter((task) => {
      return (
        task.name.toLowerCase().includes(searchTerm) ||
        (task.description &&
          task.description.toLowerCase().includes(searchTerm)) ||
        (task.department &&
          task.department.toLowerCase().includes(searchTerm)) ||
        task.members.some(
          (member) =>
            member.fullName.toLowerCase().includes(searchTerm) ||
            member.userName.toLowerCase().includes(searchTerm),
        )
      );
    });
  }

  private getAllTasks(): WorkItem[] {
    const allTasks: WorkItem[] = [];

    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        for (const sprint of timeline.sprints) {
          if (sprint.tasks) {
            for (const task of sprint.tasks) {
              // Convert task to WorkItem format
              const workItem: WorkItem = {
                id: task.id.toString(),
                sprintId: sprint.treeId || sprint.id.toString(),
                name: task.name,
                description: task.description,
                startDate: task.startDate,
                endDate: task.endDate,
                duration: task.duration,
                department: mockDepartments.find(
                  (d) => d.id === task.departmentId,
                )?.name,
                status: this.mapTaskStatus(task.statusId),
                priority: this.mapTaskPriority(task.priorityId),
                progress:
                  ((task.actualHours || 0) / (task.estimatedHours || 1)) * 100,
                members: task.assigneeId
                  ? mockMembers.filter((m) => m.id === task.assigneeId)
                  : [],
              };

              allTasks.push(workItem);
            }
          }
        }
      }
    }

    return allTasks;
  }

  private mapTaskStatus(
    statusId: number,
  ): "todo" | "in_progress" | "review" | "done" | "blocked" {
    switch (statusId) {
      case 1:
        return "todo";
      case 2:
        return "in_progress";
      case 3:
        return "review";
      case 4:
        return "done";
      case 5:
        return "blocked";
      default:
        return "todo";
    }
  }

  private mapTaskPriority(
    priorityId: number,
  ): "low" | "medium" | "high" | "critical" {
    switch (priorityId) {
      case 1:
        return "low";
      case 2:
        return "medium";
      case 3:
        return "high";
      case 4:
        return "critical";
      default:
        return "medium";
    }
  }

  async moveTask(
    taskId: string,
    targetSprintId: string,
  ): Promise<any | null> {
    const taskIdNum = parseInt(taskId, 10);
    const targetSprintIdNum = parseInt(targetSprintId, 10);

    // Find the task and its current sprint
    let sourceTask: any | null = null;
    let sourceSprint: Sprint | null = null;
    let targetSprint: Sprint | null = null;

    // Find source task and sprint
    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        for (const sprint of timeline.sprints) {
          if (sprint.tasks) {
            const taskIndex = sprint.tasks.findIndex(
              (t) => t.id === taskIdNum,
            );

            if (taskIndex !== -1) {
              sourceTask = sprint.tasks[taskIndex];
              sourceSprint = sprint;
              break;
            }
          }
        }

        if (sourceTask) break;
      }
    }

    // Find target sprint
    for (const timeline of TimelineService.timelines) {
      if (timeline.sprints) {
        const sprint = timeline.sprints.find((s) => s.id === targetSprintIdNum);
        if (sprint) {
          targetSprint = sprint;
          break;
        }
      }
    }

    if (!sourceTask || !sourceSprint || !targetSprint) {
      return null;
    }

    // Don't move if it's the same sprint
    if (sourceSprint.id === targetSprint.id) {
      return sourceTask;
    }

    // Remove from source sprint
    const taskIndex = sourceSprint.tasks!.findIndex(
      (t) => t.id === taskIdNum,
    );

    sourceSprint.tasks!.splice(taskIndex, 1);

    // Update task's sprintId
    sourceTask.sprintId = targetSprintIdNum;
    sourceTask.updatedAt = new Date().toISOString();

    // Add to target sprint
    if (!targetSprint.tasks) {
      targetSprint.tasks = [];
    }

    targetSprint.tasks.push(sourceTask);

    // Update both sprints' timestamps
    sourceSprint.updatedAt = new Date().toISOString();
    targetSprint.updatedAt = new Date().toISOString();

    return sourceTask;
  }
}
