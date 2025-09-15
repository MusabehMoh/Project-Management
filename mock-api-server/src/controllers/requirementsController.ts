import { Request, Response } from "express";

import { mockDelayHandler } from "../utils/mockDelay.js";
import { TimelineService } from "../services/timelineService.js";

export class RequirementsController {
  private timelineService: TimelineService;

  constructor() {
    this.timelineService = new TimelineService();
  }

  async getRequirementById(req: Request, res: Response) {
    await mockDelayHandler();

    return res.status(410).json({
      success: false,
      error: {
        message:
          "Timeline requirements have been removed from the system. Tasks now belong directly to sprints.",
        code: "FEATURE_DEPRECATED",
        suggestion:
          "Use /api/timelines/sprints/:sprintId/tasks endpoints instead",
      },
    });
  }

  async updateRequirement(req: Request, res: Response) {
    await mockDelayHandler();

    return res.status(410).json({
      success: false,
      error: {
        message:
          "Timeline requirements have been removed from the system. Tasks now belong directly to sprints.",
        code: "FEATURE_DEPRECATED",
        suggestion:
          "Use /api/timelines/sprints/:sprintId/tasks endpoints instead",
      },
    });
  }

  async deleteRequirement(req: Request, res: Response) {
    await mockDelayHandler();

    return res.status(410).json({
      success: false,
      error: {
        message:
          "Timeline requirements have been removed from the system. Tasks now belong directly to sprints.",
        code: "FEATURE_DEPRECATED",
        suggestion:
          "Use /api/timelines/sprints/:sprintId/tasks endpoints instead",
      },
    });
  }

  async getRequirementTasks(req: Request, res: Response) {
    await mockDelayHandler();

    return res.status(410).json({
      success: false,
      error: {
        message:
          "Timeline requirements have been removed from the system. Tasks now belong directly to sprints.",
        code: "FEATURE_DEPRECATED",
        suggestion:
          "Use /api/timelines/sprints/:sprintId/tasks endpoints instead",
      },
    });
  }

  async createTask(req: Request, res: Response) {
    await mockDelayHandler();

    return res.status(410).json({
      success: false,
      error: {
        message:
          "Timeline requirements have been removed from the system. Tasks now belong directly to sprints.",
        code: "FEATURE_DEPRECATED",
        suggestion:
          "Use POST /api/tasks (with sprintId in body) or POST /api/timelines/sprints/:sprintId/tasks instead",
        migration: {
          oldEndpoint: "POST /api/requirements/:requirementId/tasks",
          newEndpoints: [
            {
              endpoint: "POST /api/tasks",
              description: "Create task with sprintId in request body",
              example: {
                method: "POST",
                url: "/api/tasks",
                body: {
                  sprintId: "1",
                  name: "Task name",
                  description: "Task description",
                  startDate: "2025-09-07",
                  endDate: "2025-09-10",
                },
              },
            },
            {
              endpoint: "POST /api/timelines/sprints/:sprintId/tasks",
              description: "Create task for specific sprint",
              example: {
                method: "POST",
                url: "/api/timelines/sprints/1/tasks",
                body: {
                  name: "Task name",
                  description: "Task description",
                  startDate: "2025-09-07",
                  endDate: "2025-09-10",
                },
              },
            },
          ],
        },
      },
    });
  }
}
