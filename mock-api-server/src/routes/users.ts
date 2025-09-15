import { Router } from "express";

import { UsersController } from "../controllers/usersController.js";

export const userRoutes = Router();
const usersController = new UsersController();

// GET /api/users/stats - Get user statistics
userRoutes.get("/stats", usersController.getUserStats.bind(usersController));

// GET /api/users/me/claims - Get current user claims
userRoutes.get(
  "/me/claims",
  usersController.getCurrentUserClaims.bind(usersController),
);

// GET /api/users/me/permissions/check - Check user permission
userRoutes.get(
  "/me/permissions/check",
  usersController.checkPermission.bind(usersController),
);

// GET /api/users/me - Get current user
userRoutes.get("/me", usersController.getCurrentUser.bind(usersController));

// GET /api/users - Get all users with pagination
userRoutes.get("/", usersController.getUsers.bind(usersController));

// GET /api/users/:id - Get user by ID
userRoutes.get("/:id", usersController.getUserById.bind(usersController));

// POST /api/users - Create new user
userRoutes.post("/", usersController.createUser.bind(usersController));

// PUT /api/users/:id - Update user
userRoutes.put("/:id", usersController.updateUser.bind(usersController));

// DELETE /api/users/:id - Delete user
userRoutes.delete("/:id", usersController.deleteUser.bind(usersController));

// POST /api/users/:id/roles - Assign roles to user
userRoutes.post(
  "/:id/roles",
  usersController.assignRoles.bind(usersController),
);

// DELETE /api/users/:id/roles - Remove roles from user
userRoutes.delete(
  "/:id/roles",
  usersController.removeRoles.bind(usersController),
);

// POST /api/users/:id/actions - Assign actions to user
userRoutes.post(
  "/:id/actions",
  usersController.assignActions.bind(usersController),
);

// DELETE /api/users/:id/actions - Remove actions from user
userRoutes.delete(
  "/:id/actions",
  usersController.removeActions.bind(usersController),
);
