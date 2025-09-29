import { Request, Response } from "express";

import { mockDelayHandler } from "../utils/mockDelay.js";
import { TimelineService } from "../services/timelineService.js";

const timelineService = new TimelineService();

export class TimelineController {
  async getProjectTimelines(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const projectId = parseInt(req.params.projectId);

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Invalid project ID",
            code: "INVALID_PROJECT_ID",
          },
        });
      }

      const timelines = await timelineService.getByProjectId(projectId);

      res.json({
        success: true,
        data: timelines,
        pagination: {
          total: timelines.length,
          page: 1,
          limit: 100,
        },
      });
    } catch {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch project timelines",
          code: "FETCH_ERROR",
        },
      });
    }
  }

  async getTimelineById(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const timelineId = req.params.id;

      if (!timelineId) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Timeline ID is required",
            code: "INVALID_TIMELINE_ID",
          },
        });
      }

      const timeline = await timelineService.getById(timelineId);

      if (!timeline) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Timeline not found",
            code: "NOT_FOUND",
          },
        });
      }

      res.json({
        success: true,
        data: timeline,
      });
    } catch {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch timeline",
          code: "FETCH_ERROR",
        },
      });
    }
  }

  async getProjectsWithTimelines(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const projectsWithTimelines =
        await timelineService.getProjectsWithTimelines();

      res.json({
        success: true,
        data: projectsWithTimelines,
        meta: {
          totalProjects: projectsWithTimelines.length,
          projectsWithTimelines: projectsWithTimelines.filter(
            (p) => p.timelines.length > 0,
          ).length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch projects with timelines",
          code: "FETCH_ERROR",
        },
      });
    }
  }

  async createTimeline(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const {
        projectId,
        projectRequirementId,
        name,
        description,
        startDate,
        endDate,
      } = req.body;

      if (!projectId || !name || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            message:
              "Missing required fields: projectId, name, startDate, endDate",
            code: "VALIDATION_ERROR",
          },
        });
      }
      const numericId = Math.floor(100000 + Math.random() * 900000);
      const timeline = await timelineService.create({
        id: numericId,
        treeId: "timeline-" + numericId,
        projectId,
        projectRequirementId,
        name,
        description: description || "",
        startDate,
        endDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sprints: [],
      });

      res.status(201).json({
        success: true,
        data: timeline,
        message: "Timeline created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to create timeline",
          code: "CREATE_ERROR",
        },
      });
    }
  }

  async updateTimeline(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const timelineId = req.params.id;
      const updates = req.body;

      const timeline = await timelineService.update(timelineId, updates);

      if (!timeline) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Timeline not found",
            code: "NOT_FOUND",
          },
        });
      }

      res.json({
        success: true,
        data: timeline,
        message: "Timeline updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to update timeline",
          code: "UPDATE_ERROR",
        },
      });
    }
  }

  async deleteTimeline(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const timelineId = req.params.id;

      const deleted = await timelineService.delete(timelineId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Timeline not found",
            code: "NOT_FOUND",
          },
        });
      }

      res.json({
        success: true,
        message: "Timeline deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to delete timeline",
          code: "DELETE_ERROR",
        },
      });
    }
  }

  async getDepartments(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const departments = await timelineService.getDepartments();

      res.json({
        success: true,
        data: departments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch departments",
          code: "FETCH_ERROR",
        },
      });
    }
  }

  async getResources(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const resources = await timelineService.getResources();

      res.json({
        success: true,
        data: resources,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch resources",
          code: "FETCH_ERROR",
        },
      });
    }
  }

  async createSprint(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const timelineId = req.params.timelineId;
      const { name, description, startDate, endDate, statusId, departmentId } =
        req.body;

      if (!name || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Missing required fields: name, startDate, endDate",
            code: "VALIDATION_ERROR",
          },
        });
      }

      const sprint = await timelineService.createSprint(timelineId, {
        name,
        description,
        startDate,
        endDate,
        statusId,
        departmentId,
      });

      if (!sprint) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Timeline not found",
            code: "NOT_FOUND",
          },
        });
      }

      res.status(201).json({
        success: true,
        data: sprint,
        message: "Sprint created successfully",
      });
    } catch {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to create sprint",
          code: "CREATE_ERROR",
        },
      });
    }
  }

  async getSprintTasks(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const sprintId = req.params.sprintId;

      if (!sprintId) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Sprint ID is required",
            code: "INVALID_SPRINT_ID",
          },
        });
      }

      const tasks = await timelineService.getTasksBySprintId(sprintId);

      if (tasks === null) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Sprint not found",
            code: "NOT_FOUND",
          },
        });
      }

      res.json({
        success: true,
        data: tasks,
        pagination: {
          total: tasks.length,
          page: 1,
          limit: 100,
        },
      });
    } catch {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch sprint tasks",
          code: "FETCH_ERROR",
        },
      });
    }
  }

  async createTaskForSprint(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const sprintId = req.params.sprintId;
      const {
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

      if (!name || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Missing required fields: name, startDate, endDate",
            code: "VALIDATION_ERROR",
          },
        });
      }

      const task = await timelineService.createTaskForSprint(sprintId, {
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

      res.status(201).json({
        success: true,
        data: task,
        message: "Task created successfully",
      });
    } catch {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to create task",
          code: "CREATE_ERROR",
        },
      });
    }
  }

  async searchAllMembers(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const query = req.query.q as string;

      const members = await timelineService.searchAllMembers(query || "");

      res.json({
        success: true,
        data: members,
        pagination: {
          total: members.length,
          page: 1,
          limit: 100,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to search members",
          code: "SEARCH_ERROR",
        },
      });
    }
  }

  async searchTasks(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const query = req.query.q as string;

      const tasks = await timelineService.searchTasks(query || "");

      res.json({
        success: true,
        data: tasks,
        pagination: {
          total: tasks.length,
          page: 1,
          limit: 100,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to search tasks",
          code: "SEARCH_ERROR",
        },
      });
    }
  }
}
