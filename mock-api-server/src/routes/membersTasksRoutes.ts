import { Router } from "express";

import {
  getAllMembersTasks,
  getTaskFilters,
  exportMembersTasks,
} from "../controllers/membersTasksController.js";

const router = Router();

// GET /api/members-tasks - Get all tasks with pagination and filtering
router.get("/", getAllMembersTasks);

// GET /api/members-tasks/filters - Get filter options
router.get("/filters", getTaskFilters);

// GET /api/members-tasks/export - Export tasks data
router.get("/export", exportMembersTasks);

export default router;
