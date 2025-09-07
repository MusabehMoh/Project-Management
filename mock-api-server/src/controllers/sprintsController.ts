import { Request, Response } from "express";

import { mockDelayHandler } from "../utils/mockDelay.js";
import { TimelineService } from "../services/timelineService.js";
import { logger } from "../utils/logger.js";

export class SprintsController {
  private timelineService: TimelineService;

  constructor() {
    this.timelineService = new TimelineService();
  }

  async updateSprint(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const sprintId = req.params.id;
      const updates = req.body;

      const result = await this.timelineService.findAndUpdateSprint(
        sprintId,
        updates,
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Sprint not found",
            code: "NOT_FOUND",
          },
        });
      }

      logger.info(`Updated sprint ${sprintId}`);

      res.json({
        success: true,
        data: result,
        message: "Sprint updated successfully",
      });
    } catch (error) {
      logger.error("Error updating sprint:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to update sprint",
          code: "UPDATE_ERROR",
        },
      });
    }
  }

  async getSprintById(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const sprintId = req.params.id;

      const sprint = await this.timelineService.findSprintById(sprintId);

      if (!sprint) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Sprint not found",
            code: "NOT_FOUND",
          },
        });
      }

      logger.info(`Retrieved sprint ${sprintId}`);

      res.json({
        success: true,
        data: sprint,
      });
    } catch (error) {
      logger.error("Error getting sprint:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to get sprint",
          code: "FETCH_ERROR",
        },
      });
    }
  }

  async deleteSprint(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const sprintId = req.params.id;

      const deleted = await this.timelineService.deleteSprint(sprintId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Sprint not found",
            code: "NOT_FOUND",
          },
        });
      }

      logger.info(`Deleted sprint ${sprintId}`);

      res.json({
        success: true,
        message: "Sprint deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting sprint:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to delete sprint",
          code: "DELETE_ERROR",
        },
      });
    }
  }

  async moveTask(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const taskId = req.params.taskId;
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

      const movedTask = await this.timelineService.moveTask(
        taskId,
        targetSprintId,
      );

      if (!movedTask) {
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
        data: movedTask,
        message: "Task moved successfully",
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
}
