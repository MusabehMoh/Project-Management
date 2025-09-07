import { Router } from "express";

import { UnitsController } from "../controllers/unitsController.js";

export const unitRoutes = Router();
const unitsController = new UnitsController();

// GET /api/units/stats - Get unit statistics
unitRoutes.get("/stats", unitsController.getUnitStats.bind(unitsController));

// GET /api/units/search - Search units
unitRoutes.get("/search", unitsController.searchUnits.bind(unitsController));

// GET /api/units/tree - Get units tree structure
unitRoutes.get("/tree", unitsController.getUnitsTree.bind(unitsController));

// GET /api/units/tree/roots - Get root units
unitRoutes.get(
  "/tree/roots",
  unitsController.getRootUnits.bind(unitsController),
);

// GET /api/units/:id/children - Get unit children
unitRoutes.get(
  "/:id/children",
  unitsController.getUnitChildren.bind(unitsController),
);

// GET /api/units/:id/path - Get unit path (breadcrumb)
unitRoutes.get("/:id/path", unitsController.getUnitPath.bind(unitsController));

// GET /api/units/:id - Get unit by ID
unitRoutes.get("/:id", unitsController.getUnit.bind(unitsController));

// GET /api/units - Get all units with filtering
unitRoutes.get("/", unitsController.getUnits.bind(unitsController));
