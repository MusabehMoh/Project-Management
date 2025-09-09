import { Router } from "express";

import { projectRoutes } from "./projects.js";
import { timelineRoutes } from "./timelines.js";
import { authRoutes } from "./auth.js";
import { userRoutes } from "./users.js";
import { owningUnitsRoutes } from "./owning-units.js";
import { departmentRoutes } from "./departments.js";
import { lookupRoutes } from "./lookups.js";
import { unitRoutes } from "./units.js";
import { employeeRoutes } from "./employees.js";
import { roleRoutes } from "./roles.js";
import { actionRoutes } from "./actions.js";
import { subtaskRoutes } from "./subtasks.js";
import { taskRoutes } from "./tasks.js";
import { sprintRoutes } from "./sprints.js";
import { requirementRoutes } from "./requirements.js";
import { projectRequirementRoutes } from "./projectRequirements.js";
import membersTasksRoutes from "./membersTasksRoutes.js";
import notificationsRoutes from "./notifications.js";
export const routes = Router();

// Health check for API
routes.get("/", (req, res) => {
  res.json({
    message: "PMA Mock API Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      projects: "/projects",
      timelines: "/timelines",
      auth: "/auth",
      users: "/users",
      "owning-units": "/owning-units",
      departments: "/departments",
      lookups: "/lookups",
      units: "/units",
      employees: "/employees",
      roles: "/roles",
      actions: "/actions",
      subtasks: "/subtasks",
      tasks: "/tasks",
      sprints: "/sprints",
      requirements: "/requirements",
      "project-requirements": "/project-requirements",
      "members-tasks": "/members-tasks",
      notifications: "/notifications",
      "task-plan": "/task-plan",
    },
  });
});

// Mount route modules
routes.use("/projects", projectRoutes);
routes.use("/timelines", timelineRoutes);
routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);
routes.use("/owning-units", owningUnitsRoutes);
routes.use("/departments", departmentRoutes);
routes.use("/lookups", lookupRoutes);
routes.use("/units", unitRoutes);
routes.use("/employees", employeeRoutes);
routes.use("/roles", roleRoutes);
routes.use("/actions", actionRoutes);
routes.use("/subtasks", subtaskRoutes);
routes.use("/tasks", taskRoutes);
routes.use("/sprints", sprintRoutes);
routes.use("/requirements", requirementRoutes);
routes.use("/project-requirements", projectRequirementRoutes);
routes.use("/members-tasks", membersTasksRoutes);
routes.use("/notifications", notificationsRoutes);
