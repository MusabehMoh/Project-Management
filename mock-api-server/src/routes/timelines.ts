import { Router } from "express";

import { TimelineController } from "../controllers/timelineController.js";

const router = Router();
const timelineController = new TimelineController();

// Timeline routes
router.get(
  "/departments",
  timelineController.getDepartments.bind(timelineController),
);
router.get(
  "/resources",
  timelineController.getResources.bind(timelineController),
);

// Project timeline routes
router.get(
  "/projects/:projectId",
  timelineController.getProjectTimelines.bind(timelineController),
);
router.get(
  "/projects-with-timelines",
  timelineController.getProjectsWithTimelines.bind(timelineController),
);

// CRUD routes for timelines
router.get("/:id", timelineController.getTimelineById.bind(timelineController));
router.post("/", timelineController.createTimeline.bind(timelineController));
router.put("/:id", timelineController.updateTimeline.bind(timelineController));
router.delete(
  "/:id",
  timelineController.deleteTimeline.bind(timelineController),
);

// Sprint routes
router.post(
  "/:timelineId/sprints",
  timelineController.createSprint.bind(timelineController),
);

// Task routes for sprints
router.get(
  "/sprints/:sprintId/tasks",
  timelineController.getSprintTasks.bind(timelineController),
);
router.post(
  "/sprints/:sprintId/tasks",
  timelineController.createTaskForSprint.bind(timelineController),
);

export { router as timelineRoutes };
