import { Router } from "express";

import { DepartmentsController } from "../controllers/departmentsController.js";

export const departmentRoutes = Router();
const departmentsController = new DepartmentsController();

// GET /api/departments - Get all departments
departmentRoutes.get(
  "/",
  departmentsController.getDepartments.bind(departmentsController),
);

// GET /api/departments/:id - Get department by ID
departmentRoutes.get(
  "/:id",
  departmentsController.getDepartmentById.bind(departmentsController),
);

// GET /api/departments/:id/members - Get department members
departmentRoutes.get(
  "/:id/members",
  departmentsController.getDepartmentMembers.bind(departmentsController),
);

// POST /api/departments/:id/members - Add department member
departmentRoutes.post(
  "/:id/members",
  departmentsController.addDepartmentMember.bind(departmentsController),
);

// PUT /api/departments/:id/members/:memberId - Update department member
departmentRoutes.put(
  "/:id/members/:memberId",
  departmentsController.updateDepartmentMember.bind(departmentsController),
);

// DELETE /api/departments/:id/members/:memberId - Remove department member
departmentRoutes.delete(
  "/:id/members/:memberId",
  departmentsController.removeDepartmentMember.bind(departmentsController),
);

// DELETE /api/departments/members/:memberId - Remove department member by member ID
departmentRoutes.delete(
  "/members/:memberId",
  departmentsController.removeMemberById.bind(departmentsController),
);
