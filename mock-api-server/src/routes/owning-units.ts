import { Router } from "express";

import { UsersController } from "../controllers/usersController.js";

export const owningUnitsRoutes = Router();
const usersController = new UsersController();

// GET /api/owning-units - Get owning units
owningUnitsRoutes.get(
  "/",
  usersController.getOwningUnits.bind(usersController),
);
