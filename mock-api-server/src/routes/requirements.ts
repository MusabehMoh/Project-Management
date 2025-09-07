import { Router } from "express";

import { RequirementsController } from "../controllers/requirementsController.js";

export const requirementRoutes = Router();
const requirementsController = new RequirementsController();

// GET /api/requirements/:id - Get requirement by ID
requirementRoutes.get(
  "/:id",
  requirementsController.getRequirementById.bind(requirementsController),
);

// PUT /api/requirements/:id - Update requirement
requirementRoutes.put(
  "/:id",
  requirementsController.updateRequirement.bind(requirementsController),
);

// DELETE /api/requirements/:id - Delete requirement
requirementRoutes.delete(
  "/:id",
  requirementsController.deleteRequirement.bind(requirementsController),
);

// GET /api/requirements/:id/tasks - Get tasks for a requirement
requirementRoutes.get(
  "/:id/tasks",
  requirementsController.getRequirementTasks.bind(requirementsController),
);

// POST /api/requirements/:id/tasks - Create task for a requirement
requirementRoutes.post(
  "/:id/tasks",
  requirementsController.createTask.bind(requirementsController),
);
