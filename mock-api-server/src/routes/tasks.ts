import { Router } from "express";

import { TasksController } from "../controllers/tasksController.js";

export const taskRoutes = Router();
const tasksController = new TasksController();

// POST /api/tasks - Create task for a sprint
taskRoutes.post("/", tasksController.createTask.bind(tasksController));

// POST /api/tasks/:id/move - Move task by specified days
taskRoutes.post("/:id/move", tasksController.moveTask.bind(tasksController));

// POST /api/tasks/:id/move-to-sprint - Move task to another sprint
taskRoutes.post(
  "/:id/move-to-sprint",
  tasksController.moveTaskToSprint.bind(tasksController),
);

// PUT /api/tasks/:id - Update task
taskRoutes.put("/:id", tasksController.updateTask.bind(tasksController));

// GET /api/tasks/:id - Get task by ID
taskRoutes.get("/:id", tasksController.getTaskById.bind(tasksController));

// DELETE /api/tasks/:id - Delete task
taskRoutes.delete("/:id", tasksController.deleteTask.bind(tasksController));
