import { Router } from "express";

import { EmployeesController } from "../controllers/employeesController.js";
import { TimelineController } from "../controllers/timelineController.js";

export const employeeRoutes = Router();
const employeesController = new EmployeesController();
const timelineController = new TimelineController();

// GET /api/employees/search - Search employees
employeeRoutes.get(
  "/search",
  employeesController.searchEmployees.bind(employeesController),
);

// GET /api/employees/details - Get employee details
employeeRoutes.get(
  "/details",
  employeesController.getEmployeeDetails.bind(employeesController),
);

// GET /api/employees/searchUsers - Search all members
employeeRoutes.get(
  "/searchUsers",
  timelineController.searchAllMembers.bind(timelineController),
);

// GET /api/employees/searchTasks - Search tasks
employeeRoutes.get(
  "/searchTasks",
  timelineController.searchTasks.bind(timelineController),
);
