import { Router } from "express";

import { ActionsController } from "../controllers/actionsController.js";

export const actionRoutes = Router();
const actionsController = new ActionsController();

// GET /api/actions - Get all actions (with optional category filter)
actionRoutes.get("/", actionsController.getActions.bind(actionsController));

// GET /api/actions/:id - Get action by ID
actionRoutes.get(
  "/:id",
  actionsController.getActionById.bind(actionsController),
);

// POST /api/actions - Create new action
actionRoutes.post("/", actionsController.createAction.bind(actionsController));

// PUT /api/actions/:id - Update action
actionRoutes.put(
  "/:id",
  actionsController.updateAction.bind(actionsController),
);

// DELETE /api/actions/:id - Delete action
actionRoutes.delete(
  "/:id",
  actionsController.deleteAction.bind(actionsController),
);
