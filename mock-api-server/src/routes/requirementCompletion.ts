import { Router } from "express";
import { requirementCompletionController } from "../controllers/requirementCompletionController.js";

const router = Router();

// Get requirement completion analytics
router.get("/analytics", requirementCompletionController.getCompletionAnalytics.bind(requirementCompletionController));

// Get completion metrics for specific period/analyst
router.get("/metrics", requirementCompletionController.getCompletionMetrics.bind(requirementCompletionController));

export default router;