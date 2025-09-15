import { Request, Response } from "express";

import { mockDelayHandler } from "../utils/mockDelay.js";
import { TimelineService } from "../services/timelineService.js";
import { logger } from "../utils/logger.js";

export class SubtasksController {
  private timelineService: TimelineService;

  constructor() {
    this.timelineService = new TimelineService();
  }

  async updateSubtask(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const subtaskId = req.params.id;
      const updates = req.body;

      // Since subtasks are nested, we need to find them by ID across all timelines
      const result = await this.timelineService.findAndUpdateSubtask(
        subtaskId,
        updates,
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Subtask not found",
            code: "NOT_FOUND",
          },
        });
      }

      logger.info(`Updated subtask ${subtaskId}`);

      res.json({
        success: true,
        data: result,
        message: "Subtask updated successfully",
      });
    } catch (error) {
      logger.error("Error updating subtask:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to update subtask",
          code: "UPDATE_ERROR",
        },
      });
    }
  }

  async getSubtaskById(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const subtaskId = req.params.id;

      const subtask = await this.timelineService.findSubtaskById(subtaskId);

      if (!subtask) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Subtask not found",
            code: "NOT_FOUND",
          },
        });
      }

      logger.info(`Retrieved subtask ${subtaskId}`);

      res.json({
        success: true,
        data: subtask,
      });
    } catch (error) {
      logger.error("Error getting subtask:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to get subtask",
          code: "FETCH_ERROR",
        },
      });
    }
  }

  async deleteSubtask(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const subtaskId = req.params.id;

      const deleted = await this.timelineService.deleteSubtask(subtaskId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Subtask not found",
            code: "NOT_FOUND",
          },
        });
      }

      logger.info(`Deleted subtask ${subtaskId}`);

      res.json({
        success: true,
        message: "Subtask deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting subtask:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to delete subtask",
          code: "DELETE_ERROR",
        },
      });
    }
  }
}
