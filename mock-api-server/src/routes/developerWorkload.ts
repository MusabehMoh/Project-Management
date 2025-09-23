import express from "express";

import { DeveloperWorkloadController } from "../controllers/developerWorkloadController";

const router = express.Router();
const developerWorkloadController = new DeveloperWorkloadController();

// GET /api/developer-workload/performance - Get workload performance data
router.get(
  "/performance",
  developerWorkloadController.getWorkloadPerformance.bind(
    developerWorkloadController,
  ),
);

// GET /api/developer-workload/performance/:developerId - Get individual developer performance
router.get(
  "/performance/:developerId",
  developerWorkloadController.getDeveloperPerformance.bind(
    developerWorkloadController,
  ),
);

// PATCH /api/developer-workload/:developerId - Update developer workload
router.patch(
  "/:developerId",
  developerWorkloadController.updateWorkload.bind(developerWorkloadController),
);

// GET /api/developer-workload/teams - Get team workload data
router.get(
  "/teams",
  developerWorkloadController.getTeamWorkload.bind(developerWorkloadController),
);

// GET /api/developer-workload/capacity-planning - Get capacity planning data
router.get(
  "/capacity-planning",
  developerWorkloadController.getCapacityPlanning.bind(developerWorkloadController),
);

// GET /api/developer-workload/burnout-analysis - Get burnout analysis
router.get(
  "/burnout-analysis",
  developerWorkloadController.getBurnoutAnalysis.bind(developerWorkloadController),
);

// POST /api/developer-workload/assign-task - Assign task to developer
router.post(
  "/assign-task",
  developerWorkloadController.assignTask.bind(developerWorkloadController),
);

// GET /api/developer-workload/skills-matrix - Get skills matrix
router.get(
  "/skills-matrix",
  developerWorkloadController.getSkillsMatrix.bind(developerWorkloadController),
);

// GET /api/developer-workload/productivity-trends - Get productivity trends
router.get(
  "/productivity-trends",
  developerWorkloadController.getProductivityTrends.bind(developerWorkloadController),
);

// GET /api/code-reviews/metrics - Get code review metrics
router.get(
  "/code-reviews/metrics",
  developerWorkloadController.getCodeReviewMetrics.bind(
    developerWorkloadController,
  ),
);

// GET /api/code-reviews/pending - Get pending code reviews
router.get(
  "/code-reviews/pending",
  developerWorkloadController.getPendingCodeReviews.bind(
    developerWorkloadController,
  ),
);

// POST /api/code-reviews/:reviewId/approve - Approve code review
router.post(
  "/code-reviews/:reviewId/approve",
  developerWorkloadController.approveCodeReview.bind(
    developerWorkloadController,
  ),
);

// POST /api/code-reviews/:reviewId/request-changes - Request changes in code review
router.post(
  "/code-reviews/:reviewId/request-changes",
  developerWorkloadController.requestChanges.bind(developerWorkloadController),
);

export default router;