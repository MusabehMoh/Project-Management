import express from "express";
import {
  getTimelineRequirements,
  getTimelineRequirementById,
  createTimelineFromRequirement,
  updateTimelineRequirement,
  deleteTimelineRequirement,
} from "../controllers/timelineRequirementController.js";

const router = express.Router();

// Get all timeline requirements with filters and pagination
router.get("/", getTimelineRequirements);

// Get timeline requirement by ID
router.get("/:id", getTimelineRequirementById);

// Create timeline from requirement
router.post("/create-timeline", createTimelineFromRequirement);

// Update timeline requirement
router.put("/:id", updateTimelineRequirement);

// Delete timeline requirement
router.delete("/:id", deleteTimelineRequirement);

export default router;
