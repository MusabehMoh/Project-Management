import { Router } from "express";
import { Request, Response } from "express";

import { mockDelayHandler } from "../utils/mockDelay.js";
import { TimelineService } from "../services/timelineService.js";
import { ProjectsController } from "../controllers/projectsController.js";

const router = Router();
const timelineService = new TimelineService();
const projectsController = new ProjectsController();

// Projects stats endpoint
router.get(
  "/stats",
  projectsController.getProjectStats.bind(projectsController),
);

// Send project for review
router.post("/:id/send", projectsController.sendProject.bind(projectsController));

// Project search endpoint
router.get(
  "/search",
  projectsController.searchProjects.bind(projectsController),
);

// Get projects with timelines (must be before /:id route)
router.get("/with-timelines", async (req: Request, res: Response) => {
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
});

// Get all projects (use controller for proper pagination)
router.get("/", projectsController.getProjects.bind(projectsController));

// Create a new project
router.post("/", projectsController.createProject.bind(projectsController));

// Get project by ID
router.get("/:id", projectsController.getProjectById.bind(projectsController));

// Update project by ID
router.put("/:id", projectsController.updateProject.bind(projectsController));

// Delete project by ID
router.delete("/:id", projectsController.deleteProject.bind(projectsController));

// Get timelines for a specific project
router.get("/:id/timelines", async (req: Request, res: Response) => {
  await mockDelayHandler();

  try {
    const projectId = parseInt(req.params.id);

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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch project timelines",
        code: "FETCH_ERROR",
      },
    });
  }
});

export { router as projectRoutes };
