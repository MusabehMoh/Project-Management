import { Router } from "express";

import { ProjectRequirementsController } from "../controllers/projectRequirementsController.js";

export const projectRequirementRoutes = Router();
const projectRequirementsController = new ProjectRequirementsController();

// GET /api/project-requirements/assigned-projects - Get projects assigned to current analyst
projectRequirementRoutes.get(
  "/assigned-projects",
  projectRequirementsController.getAssignedProjects.bind(
    projectRequirementsController,
  ),
);

// GET /api/project-requirements/projects/:projectId/requirements - Get requirements for a project
projectRequirementRoutes.get(
  "/projects/:projectId/requirements",
  projectRequirementsController.getProjectRequirements.bind(
    projectRequirementsController,
  ),
);

// POST /api/project-requirements/projects/:projectId/requirements - Create requirement for a project
projectRequirementRoutes.post(
  "/projects/:projectId/requirements",
  projectRequirementsController.createRequirement.bind(
    projectRequirementsController,
  ),
);

// PUT /api/project-requirements/requirements/:requirementId - Update requirement
projectRequirementRoutes.put(
  "/requirements/:requirementId",
  projectRequirementsController.updateRequirement.bind(
    projectRequirementsController,
  ),
);

// POST /api/project-requirements/requirements/:requirementId/send - Send requirement to development
projectRequirementRoutes.post(
  "/requirements/:requirementId/send",
  projectRequirementsController.sendRequirement.bind(
    projectRequirementsController,
  ),
);

// DELETE /api/project-requirements/requirements/:requirementId - Delete requirement
projectRequirementRoutes.delete(
  "/requirements/:requirementId",
  projectRequirementsController.deleteRequirement.bind(
    projectRequirementsController,
  ),
);

// POST /api/project-requirements/requirements/:requirementId/tasks - Create task for a requirement
projectRequirementRoutes.post(
  "/requirements/:requirementId/tasks",
  projectRequirementsController.createTask.bind(projectRequirementsController),
);

// GET /api/project-requirements/projects/:projectId/stats - Get requirement statistics for a project
projectRequirementRoutes.get(
  "/projects/:projectId/stats",
  projectRequirementsController.getRequirementStats.bind(
    projectRequirementsController,
  ),
);

// GET /api/project-requirements/development-requirements - Get all requirements with status "in development"
projectRequirementRoutes.get(
  "/development-requirements",
  projectRequirementsController.getDevelopmentRequirements.bind(
    projectRequirementsController,
  ),
);
