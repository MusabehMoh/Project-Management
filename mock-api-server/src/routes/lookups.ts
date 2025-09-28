import { Router } from "express";

import { LookupsController } from "../controllers/lookupsController.js";

export const lookupRoutes = Router();
const lookupsController = new LookupsController();

// GET /api/lookups - Get all lookups
lookupRoutes.get("/", lookupsController.getAllLookups.bind(lookupsController));

// GET /api/lookups/statuses - Get project statuses
lookupRoutes.get(
  "/statuses",
  lookupsController.getStatuses.bind(lookupsController),
);

// GET /api/lookups/code/:code - Get lookup by code
lookupRoutes.get(
  "/code/:code",
  lookupsController.getLookupByCode.bind(lookupsController),
);

// GET /api/lookups/:type - Get lookup by type
lookupRoutes.get(
  "/:type",
  lookupsController.getLookupByType.bind(lookupsController),
);
