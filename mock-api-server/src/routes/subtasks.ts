import { Router } from "express";

import { SubtasksController } from "../controllers/subtasksController.js";

export const subtaskRoutes = Router();
const subtasksController = new SubtasksController();

// PUT /api/subtasks/:id - Update subtask
subtaskRoutes.put(
  "/:id",
  subtasksController.updateSubtask.bind(subtasksController),
);

// GET /api/subtasks/:id - Get subtask by ID
subtaskRoutes.get(
  "/:id",
  subtasksController.getSubtaskById.bind(subtasksController),
);

// DELETE /api/subtasks/:id - Delete subtask
subtaskRoutes.delete(
  "/:id",
  subtasksController.deleteSubtask.bind(subtasksController),
);
