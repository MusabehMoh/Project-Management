import { Router } from "express";

import { RolesController } from "../controllers/rolesController.js";

export const roleRoutes = Router();
const rolesController = new RolesController();

// GET /api/roles - Get all roles
roleRoutes.get("/", rolesController.getRoles.bind(rolesController));

// GET /api/roles/:id - Get role by ID
roleRoutes.get("/:id", rolesController.getRoleById.bind(rolesController));

// POST /api/roles - Create new role
roleRoutes.post("/", rolesController.createRole.bind(rolesController));

// PUT /api/roles/:id - Update role
roleRoutes.put("/:id", rolesController.updateRole.bind(rolesController));

// DELETE /api/roles/:id - Delete role
roleRoutes.delete("/:id", rolesController.deleteRole.bind(rolesController));

// POST /api/roles/:id/actions - Assign actions to role
roleRoutes.post(
  "/:id/actions",
  rolesController.assignActions.bind(rolesController),
);

// DELETE /api/roles/:id/actions - Remove actions from role
roleRoutes.delete(
  "/:id/actions",
  rolesController.removeActions.bind(rolesController),
);
