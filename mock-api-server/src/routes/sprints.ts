import { Router } from "express";

import { SprintsController } from "../controllers/sprintsController.js";

export const sprintRoutes = Router();
const sprintsController = new SprintsController();

// PUT /api/sprints/:id - Update sprint
sprintRoutes.put(
  "/:id",
  sprintsController.updateSprint.bind(sprintsController),
);

// GET /api/sprints/:id - Get sprint by ID
sprintRoutes.get(
  "/:id",
  sprintsController.getSprintById.bind(sprintsController),
);

// DELETE /api/sprints/:id - Delete sprint
sprintRoutes.delete(
  "/:id",
  sprintsController.deleteSprint.bind(sprintsController),
);

// POST /api/sprints/tasks/:taskId/move - Move task to another sprint
sprintRoutes.post(
  "/tasks/:taskId/move",
  sprintsController.moveTask.bind(sprintsController),
);
