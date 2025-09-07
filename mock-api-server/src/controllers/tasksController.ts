import { Request, Response } from "express";

import { mockDelayHandler } from "../utils/mockDelay.js";
import { TimelineService } from "../services/timelineService.js";
import { logger } from "../utils/logger.js";

export class TasksController {
  private timelineService: TimelineService;

  constructor() {
    this.timelineService = new TimelineService();
  }

  async createTask(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const {
        sprintId,
        name,
        description,
        startDate,
        endDate,
        statusId,
        priorityId,
        departmentId,
        assigneeId,
        assigneeName,
        estimatedHours,
        actualHours,
        dependencies,
        progress,
      } = req.body;

      if (!sprintId || !name || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Missing required fields: sprintId, name, startDate, endDate",
            code: "VALIDATION_ERROR",
          },
        });
      }

      const task = await this.timelineService.createTaskForSprint(sprintId, {
        name,
        description,
        startDate,
        endDate,
        statusId,
        priorityId,
        departmentId,
        assigneeId,
        assigneeName,
        estimatedHours,
        actualHours,
        dependencies,
        progress,
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Sprint not found",
            code: "NOT_FOUND",
          },
        });
      }

      logger.info(`Created task ${task.id} in sprint ${sprintId}`);

      res.status(201).json({
        success: true,
        data: task,
        message: "Task created successfully",
      });
    } catch (error) {
      logger.error("Error creating task:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to create task",
          code: "CREATE_ERROR",
        },
      });
    }
  }

  async moveTaskToSprint(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const taskId = req.params.id;
      const { targetSprintId } = req.body;

      if (!targetSprintId) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Missing required field: targetSprintId",
            code: "VALIDATION_ERROR",
          },
        });
      }

      const result = await this.timelineService.moveTask(taskId, targetSprintId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Task not found or invalid target sprint",
            code: "NOT_FOUND",
          },
        });
      }

      logger.info(`Moved task ${taskId} to sprint ${targetSprintId}`);

      res.json({
        success: true,
        data: result,
        message: "Task moved to sprint successfully",
      });
    } catch (error) {
      logger.error("Error moving task to sprint:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to move task to sprint",
          code: "MOVE_ERROR",
        },
      });
    }
  }

  async moveTask(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const taskId = req.params.id;
      const { moveDays } = req.body;

      if (moveDays === undefined || moveDays === null) {
        return res.status(400).json({
          success: false,
          error: {
            message: "moveDays parameter is required",
            code: "MISSING_PARAMETER",
          },
        });
      }

      const result = await this.timelineService.findAndUpdateTask(taskId, {
        moveDays,
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Task not found",
            code: "NOT_FOUND",
          },
        });
      }

      logger.info(`Moved task ${taskId} by ${moveDays} days`);

      res.json({
        success: true,
        data: result,
        message: `Task moved successfully by ${moveDays} days`,
      });
    } catch (error) {
      logger.error("Error moving task:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to move task",
          code: "MOVE_ERROR",
        },
      });
    }
  }

  async updateTask(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const taskId = req.params.id;
      const updates = req.body;

      const result = await this.timelineService.findAndUpdateTask(
        taskId,
        updates,
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Task not found",
            code: "NOT_FOUND",
          },
        });
      }

      logger.info(`Updated task ${taskId}`);

      res.json({
        success: true,
        data: result,
        message: "Task updated successfully",
      });
    } catch (error) {
      logger.error("Error updating task:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to update task",
          code: "UPDATE_ERROR",
        },
      });
    }
  }

  async getTaskById(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const taskId = req.params.id;

      const task = await this.timelineService.findTaskById(taskId);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Task not found",
            code: "NOT_FOUND",
          },
        });
      }

      logger.info(`Retrieved task ${taskId}`);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      logger.error("Error getting task:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to get task",
          code: "FETCH_ERROR",
        },
      });
    }
  }

  async deleteTask(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const taskId = req.params.id;

      const deleted = await this.timelineService.deleteTask(taskId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Task not found",
            code: "NOT_FOUND",
          },
        });
      }

      logger.info(`Deleted task ${taskId}`);

      res.json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting task:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to delete task",
          code: "DELETE_ERROR",
        },
      });
    }
  }
}
