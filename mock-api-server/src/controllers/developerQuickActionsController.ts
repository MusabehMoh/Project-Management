import { Request, Response } from "express";

import { mockDelayHandler } from "../utils/mockDelay.js";
import { logger } from "../utils/logger.js";
import {
  mockUnassignedTasks,
  mockAlmostCompletedTasks,
  mockAvailableDevelopers,
  getAlmostCompletedTasks,
  type UnassignedTask,
  type AlmostCompletedTask,
  type AvailableDeveloper,
} from "../data/mockDeveloperQuickActions.js";

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

export interface TaskExtensionRequest {
  taskId: number;
  newEndDate: string;
  extensionReason: string;
  additionalHours?: number;
}

export class DeveloperQuickActionsController {
  private timelineService: TimelineService;

  constructor() {
    this.timelineService = new TimelineService();
  }

  async getQuickActions(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      // This will return combined quick actions including almost completed tasks
      const almostCompletedTasks = await this.getAlmostCompletedTasksData();
      const unassignedTasks = await this.getUnassignedTasksData();
      const availableDevelopers = await this.getAvailableDevelopersData();

      return res.status(200).json({
        success: true,
        data: {
          almostCompletedTasks,
          unassignedTasks,
          availableDevelopers,
        },
      });
    } catch (error) {
      logger.error("Error fetching developer quick actions:", error);
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch developer quick actions",
          code: "INTERNAL_ERROR",
        },
      });
    }
  }

  async getAlmostCompletedTasks(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const tasks = await this.getAlmostCompletedTasksData();

      return res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      logger.error("Error fetching almost completed tasks:", error);
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch almost completed tasks",
          code: "INTERNAL_ERROR",
        },
      });
    }
  }

  async extendTask(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const { taskId, newEndDate, extensionReason, additionalHours }: TaskExtensionRequest = req.body;

      if (!taskId || !newEndDate || !extensionReason) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Missing required fields: taskId, newEndDate, extensionReason",
            code: "VALIDATION_ERROR",
          },
        });
      }

      // Validate date format
      const newDate = new Date(newEndDate);
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Invalid date format for newEndDate",
            code: "VALIDATION_ERROR",
          },
        });
      }

      // Update the task with new end date
      const updatedTask = await this.timelineService.updateTask(taskId, {
        endDate: newEndDate,
        estimatedHours: additionalHours ? undefined : undefined, // Will be handled in the service
      });

      // Log the extension for audit purposes
      logger.info(`Task ${taskId} extended to ${newEndDate}. Reason: ${extensionReason}`);

      return res.status(200).json({
        success: true,
        data: {
          task: updatedTask,
          message: "Task deadline extended successfully",
        },
      });
    } catch (error) {
      logger.error("Error extending task:", error);
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to extend task deadline",
          code: "INTERNAL_ERROR",
        },
      });
    }
  }

  async assignDeveloper(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const { taskId, developerId } = req.body;

      if (!taskId || !developerId) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Missing required fields: taskId, developerId",
            code: "VALIDATION_ERROR",
          },
        });
      }

      // This is a mock implementation - in real app would assign developer
      logger.info(`Assigning developer ${developerId} to task ${taskId}`);

      return res.status(200).json({
        success: true,
        data: {
          message: "Developer assigned successfully",
        },
      });
    } catch (error) {
      logger.error("Error assigning developer:", error);
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to assign developer",
          code: "INTERNAL_ERROR",
        },
      });
    }
  }

  async assignReviewer(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const { pullRequestId, reviewerId } = req.body;

      if (!pullRequestId || !reviewerId) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Missing required fields: pullRequestId, reviewerId",
            code: "VALIDATION_ERROR",
          },
        });
      }

      // This is a mock implementation - in real app would assign reviewer
      logger.info(`Assigning reviewer ${reviewerId} to PR ${pullRequestId}`);

      return res.status(200).json({
        success: true,
        data: {
          message: "Reviewer assigned successfully",
        },
      });
    } catch (error) {
      logger.error("Error assigning reviewer:", error);
      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to assign reviewer",
          code: "INTERNAL_ERROR",
        },
      });
    }
  }

  private async getAlmostCompletedTasksData(): Promise<AlmostCompletedTask[]> {
    const timelines = await this.timelineService.getAllTimelines();
    const now = new Date();
    const almostCompletedTasks: AlmostCompletedTask[] = [];

    // Define threshold for "almost completed" - tasks ending within 3 days or already overdue
    const DAYS_THRESHOLD = 3;

    for (const timeline of timelines) {
      for (const sprint of timeline.sprints) {
        for (const task of sprint.tasks) {
          const taskEndDate = new Date(task.endDate);
          const daysUntilDeadline = Math.ceil((taskEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysUntilDeadline < 0;
          
          // Include tasks that are:
          // 1. Due within DAYS_THRESHOLD days
          // 2. Already overdue
          // 3. Not already completed (statusId !== 4, assuming 4 = completed)
          if ((daysUntilDeadline <= DAYS_THRESHOLD || isOverdue) && task.statusId !== 4) {
            almostCompletedTasks.push({
              id: task.id,
              treeId: task.treeId,
              name: task.name,
              description: task.description,
              startDate: task.startDate,
              endDate: task.endDate,
              duration: task.duration,
              projectName: timeline.name,
              sprintName: sprint.name,
              assigneeName: task.assigneeName,
              statusId: task.statusId,
              priorityId: task.priorityId,
              progress: task.progress,
              daysUntilDeadline: Math.abs(daysUntilDeadline),
              isOverdue,
              estimatedHours: task.estimatedHours,
              actualHours: task.actualHours,
              departmentName: "Development Team", // Mock data
            });
          }
        }
      }
    }

    // Sort by urgency - overdue first, then by days until deadline
    almostCompletedTasks.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.daysUntilDeadline - b.daysUntilDeadline;
    });

    return almostCompletedTasks;
  }

  private async getUnassignedTasksData() {
    // Mock data for unassigned tasks
    return [
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
    ];
  }

  private async getAvailableDevelopersData() {
    // Mock data for available developers
    return [
      {
        userId: "dev-3",
        fullName: "Omar Khalil",
        department: "Frontend Development",
        gradeName: "Senior Developer",
        totalTasks: 3,
        currentWorkload: "medium",
        skills: ["React", "TypeScript", "Next.js"],
        availability: "available",
      },
    ];
  }
}