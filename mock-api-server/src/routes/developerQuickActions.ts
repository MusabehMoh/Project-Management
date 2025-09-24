import { Router } from "express";
import { DeveloperQuickActionsController } from "../controllers/developerQuickActionsController.js";

export const developerQuickActionsRoutes = Router();
const controller = new DeveloperQuickActionsController();

// GET /api/developer-quick-actions - Get all developer quick actions
developerQuickActionsRoutes.get("/", controller.getQuickActions.bind(controller));

// GET /api/developer-quick-actions/almost-completed-tasks - Get tasks almost completed
developerQuickActionsRoutes.get("/almost-completed-tasks", controller.getAlmostCompletedTasks.bind(controller));

// POST /api/developer-quick-actions/extend-task - Extend task deadline
developerQuickActionsRoutes.post("/extend-task", controller.extendTask.bind(controller));

// POST /api/developer-quick-actions/assign - Assign developer to task
developerQuickActionsRoutes.post("/assign", controller.assignDeveloper.bind(controller));

// POST /api/developer-quick-actions/review - Assign reviewer to PR
developerQuickActionsRoutes.post("/review", controller.assignReviewer.bind(controller));