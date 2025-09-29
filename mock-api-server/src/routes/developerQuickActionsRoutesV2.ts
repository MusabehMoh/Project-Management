import express from "express";

import { developerQuickActionsControllerV2 } from "../controllers/developerQuickActionsControllerV2.js";

const router = express.Router();

/**
 * @route GET /api/developer-quick-actions
 * @description Get all developer quick actions (unassigned tasks, almost completed tasks, available developers)
 */
router.get(
  "/",
  developerQuickActionsControllerV2.getQuickActions.bind(
    developerQuickActionsControllerV2,
  ),
);

/**
 * @route GET /api/developer-quick-actions/unassigned-tasks
 * @description Get unassigned tasks only
 */
router.get(
  "/unassigned-tasks",
  developerQuickActionsControllerV2.getUnassignedTasks.bind(
    developerQuickActionsControllerV2,
  ),
);

/**
 * @route GET /api/developer-quick-actions/almost-completed-tasks
 * @description Get almost completed tasks (due within 3 days or overdue)
 */
router.get(
  "/almost-completed-tasks",
  developerQuickActionsControllerV2.getAlmostCompletedTasks.bind(
    developerQuickActionsControllerV2,
  ),
);

/**
 * @route GET /api/developer-quick-actions/available-developers
 * @description Get available developers
 */
router.get(
  "/available-developers",
  developerQuickActionsControllerV2.getAvailableDevelopers.bind(
    developerQuickActionsControllerV2,
  ),
);

/**
 * @route POST /api/developer-quick-actions/extend-task
 * @description Extend task deadline
 * @body {taskId: number, newEndDate: string, extensionReason: string, additionalHours?: number}
 */
router.post(
  "/extend-task",
  developerQuickActionsControllerV2.extendTask.bind(
    developerQuickActionsControllerV2,
  ),
);

/**
 * @route POST /api/developer-quick-actions/assign-developer
 * @description Assign developer to unassigned task
 * @body {taskId: string, developerId: string}
 */
router.post(
  "/assign-developer",
  developerQuickActionsControllerV2.assignDeveloper.bind(
    developerQuickActionsControllerV2,
  ),
);

export default router;
