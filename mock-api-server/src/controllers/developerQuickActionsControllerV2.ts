import { Request, Response } from "express";

import { mockDelayHandler } from "../utils/mockDelay.js";
import { logger } from "../utils/logger.js";
import {
  mockUnassignedTasks,
  mockAlmostCompletedTasks,
  mockAvailableDevelopers,
  getAlmostCompletedTasks,
  mockOverdueTasks,
  getOverdueTasks,
  type UnassignedTask,
  type AlmostCompletedTask,
  type AvailableDeveloper,
} from "../data/mockDeveloperQuickActions.js";

export interface DeveloperQuickActionsResponse {
  unassignedTasks: UnassignedTask[];
  almostCompletedTasks: AlmostCompletedTask[];
  overdueTasks: AlmostCompletedTask[];
  availableDevelopers: AvailableDeveloper[];
}

export interface TaskExtensionRequest {
  taskId: number;
  newEndDate: string;
  extensionReason: string;
  additionalHours?: number;
}

export class DeveloperQuickActionsControllerV2 {
  /**
   * Get all developer quick actions data
   */
  async getQuickActions(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const response: DeveloperQuickActionsResponse = {
        unassignedTasks: mockUnassignedTasks,
        almostCompletedTasks: getAlmostCompletedTasks(),
        overdueTasks: getOverdueTasks(),
        availableDevelopers: mockAvailableDevelopers,
      };

      logger.info("Successfully fetched developer quick actions", {
        unassignedTasksCount: response.unassignedTasks.length,
        almostCompletedTasksCount: response.almostCompletedTasks.length,
        overdueTasksCount: response.overdueTasks.length,
        availableDevelopersCount: response.availableDevelopers.length,
      });

      return res.status(200).json({
        success: true,
        data: response,
        message: "Developer quick actions fetched successfully",
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

  /**
   * Get unassigned tasks only
   */
  async getUnassignedTasks(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      logger.info(`Fetching ${mockUnassignedTasks.length} unassigned tasks`);

      return res.status(200).json({
        success: true,
        data: mockUnassignedTasks,
        message: "Unassigned tasks fetched successfully",
        meta: {
          total: mockUnassignedTasks.length,
        },
      });
    } catch (error) {
      logger.error("Error fetching unassigned tasks:", error);

      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch unassigned tasks",
          code: "INTERNAL_ERROR",
        },
      });
    }
  }

  /**
   * Get almost completed tasks only
   */
  async getAlmostCompletedTasks(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const almostCompletedTasks = getAlmostCompletedTasks();

      logger.info(
        `Fetching ${almostCompletedTasks.length} almost completed tasks`,
        {
          overdue: almostCompletedTasks.filter((task) => task.isOverdue).length,
          dueSoon: almostCompletedTasks.filter((task) => !task.isOverdue)
            .length,
        },
      );

      return res.status(200).json({
        success: true,
        data: almostCompletedTasks,
        message: "Almost completed tasks fetched successfully",
        meta: {
          total: almostCompletedTasks.length,
          overdue: almostCompletedTasks.filter((task) => task.isOverdue).length,
          dueSoon: almostCompletedTasks.filter((task) => !task.isOverdue)
            .length,
        },
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

  /**
   * Get available developers only
   */
  async getAvailableDevelopers(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      logger.info(
        `Fetching ${mockAvailableDevelopers.length} available developers`,
      );

      return res.status(200).json({
        success: true,
        data: mockAvailableDevelopers,
        message: "Available developers fetched successfully",
        meta: {
          total: mockAvailableDevelopers.length,
          available: mockAvailableDevelopers.filter(
            (dev) => dev.availability === "available",
          ).length,
          busy: mockAvailableDevelopers.filter(
            (dev) => dev.availability === "busy",
          ).length,
          away: mockAvailableDevelopers.filter(
            (dev) => dev.availability === "away",
          ).length,
        },
      });
    } catch (error) {
      logger.error("Error fetching available developers:", error);

      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch available developers",
          code: "INTERNAL_ERROR",
        },
      });
    }
  }

  /**
   * Get overdue tasks only
   */
  async getOverdueTasks(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const overdueTasks = getOverdueTasks();

      logger.info(`Fetching ${overdueTasks.length} overdue tasks`);

      return res.status(200).json({
        success: true,
        data: overdueTasks,
        message: "Overdue tasks fetched successfully",
        meta: {
          total: overdueTasks.length,
          critical: overdueTasks.filter((task) => task.priorityId === 3).length,
          high: overdueTasks.filter((task) => task.priorityId === 2).length,
          medium: overdueTasks.filter((task) => task.priorityId === 1).length,
        },
      });
    } catch (error) {
      logger.error("Error fetching overdue tasks:", error);

      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch overdue tasks",
          code: "INTERNAL_ERROR",
        },
      });
    }
  }

  /**
   * Extend task deadline
   */
  async extendTask(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const {
        taskId,
        newEndDate,
        extensionReason,
        additionalHours,
      }: TaskExtensionRequest = req.body;

      // Validate required fields
      if (!taskId || !newEndDate || !extensionReason?.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            message:
              "Missing required fields: taskId, newEndDate, extensionReason",
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

      // Validate new date is in the future
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (newDate < today) {
        return res.status(400).json({
          success: false,
          error: {
            message: "New end date must be today or in the future",
            code: "VALIDATION_ERROR",
          },
        });
      }

      // Find the task
      const taskIndex = mockAlmostCompletedTasks.findIndex(
        (task) => task.id === taskId,
      );

      if (taskIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Task with ID ${taskId} not found`,
            code: "NOT_FOUND",
          },
        });
      }

      const originalTask = { ...mockAlmostCompletedTasks[taskIndex] };

      // Update the task with new deadline
      const updatedTask = {
        ...originalTask,
        endDate: newEndDate,
        isOverdue: false,
        daysUntilDeadline: Math.ceil(
          (newDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        ),
      };

      if (additionalHours) {
        updatedTask.estimatedHours =
          (updatedTask.estimatedHours || 0) + additionalHours;
      }

      // Update the task in the mock data
      mockAlmostCompletedTasks[taskIndex] = updatedTask;

      // Log the extension for audit purposes
      logger.info("Task deadline extended", {
        taskId,
        taskName: updatedTask.name,
        originalEndDate: originalTask.endDate,
        newEndDate,
        extensionReason,
        additionalHours,
        extendedAt: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        data: updatedTask,
        message: `Task deadline extended successfully to ${newEndDate}`,
        meta: {
          originalEndDate: originalTask.endDate,
          newEndDate,
          extensionReason,
          additionalHours,
        },
      });
    } catch (error) {
      logger.error("Error extending task deadline:", error);

      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to extend task deadline",
          code: "INTERNAL_ERROR",
        },
      });
    }
  }

  /**
   * Assign developer to task
   */
  async assignDeveloper(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const { taskId, developerId } = req.body;

      if (!taskId || !developerId) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Missing required fields: taskId and developerId",
            code: "VALIDATION_ERROR",
          },
        });
      }

      // Find the task
      const taskIndex = mockUnassignedTasks.findIndex(
        (task) => task.id === taskId,
      );

      if (taskIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Task with ID ${taskId} not found`,
            code: "NOT_FOUND",
          },
        });
      }

      // Find the developer
      const developer = mockAvailableDevelopers.find(
        (dev) => dev.userId === developerId,
      );

      if (!developer) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Developer with ID ${developerId} not found`,
            code: "NOT_FOUND",
          },
        });
      }

      // Update task status
      const updatedTask = {
        ...mockUnassignedTasks[taskIndex],
        status: "in-progress" as const,
      };

      // Remove from unassigned tasks (simulate assignment)
      mockUnassignedTasks.splice(taskIndex, 1);

      logger.info("Task assigned to developer", {
        taskId,
        taskTitle: updatedTask.title,
        developerId,
        developerName: developer.fullName,
        assignedAt: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        data: {
          task: updatedTask,
          assignedDeveloper: developer,
        },
        message: `Task assigned to ${developer.fullName} successfully`,
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
}

export const developerQuickActionsControllerV2 =
  new DeveloperQuickActionsControllerV2();
