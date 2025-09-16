import { Router } from "express";

import { QuickActionsController } from "../controllers/quickActionsController.js";

const router = Router();
const quickActionsController = new QuickActionsController();

// Get all quick actions data
router.get("/", quickActionsController.getQuickActions.bind(quickActionsController));

// Get quick action statistics
router.get("/stats", quickActionsController.getQuickActionStats.bind(quickActionsController));

// Get overdue items
router.get("/overdue", quickActionsController.getOverdueItems.bind(quickActionsController));

// Get pending approvals
router.get("/pending-approvals", quickActionsController.getPendingApprovals.bind(quickActionsController));

// Get team members
router.get("/team-members", quickActionsController.getTeamMembers.bind(quickActionsController));

// Get unassigned projects
router.get("/unassigned-projects", quickActionsController.getUnassignedProjects.bind(quickActionsController));

// Assign analyst to project
router.post("/assign-analyst", quickActionsController.assignAnalyst.bind(quickActionsController));

// Approve status change
router.post("/approve/:id", quickActionsController.approveStatusChange.bind(quickActionsController));

// Assign task
router.post("/assign-task/:taskId", quickActionsController.assignTask.bind(quickActionsController));

// Dismiss action
router.post("/:actionId/dismiss", quickActionsController.dismissAction.bind(quickActionsController));

// Refresh actions
router.post("/refresh", quickActionsController.refreshActions.bind(quickActionsController));

export default router;