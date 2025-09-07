import { Request, Response } from "express";

import { logger } from "../utils/logger.js";

// Mock units data - hierarchical structure
const mockUnits = [
  {
    id: 1,
    name: "Engineering Division",
    code: "ENG",
    description: "Main engineering department",
    parentId: null,
    level: 0,
    path: "ENG",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Software Engineering",
    code: "SW",
    description: "Software development unit",
    parentId: 1,
    level: 1,
    path: "ENG/SW",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    name: "Frontend Team",
    code: "FE",
    description: "Frontend development team",
    parentId: 2,
    level: 2,
    path: "ENG/SW/FE",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 4,
    name: "Backend Team",
    code: "BE",
    description: "Backend development team",
    parentId: 2,
    level: 2,
    path: "ENG/SW/BE",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 5,
    name: "Quality Assurance",
    code: "QA",
    description: "Quality assurance unit",
    parentId: 1,
    level: 1,
    path: "ENG/QA",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 6,
    name: "Operations Division",
    code: "OPS",
    description: "Operations and logistics",
    parentId: null,
    level: 0,
    path: "OPS",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 7,
    name: "Deployment Team",
    code: "DEPLOY",
    description: "Deployment and infrastructure",
    parentId: 6,
    level: 1,
    path: "OPS/DEPLOY",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 8,
    name: "Support Team",
    code: "SUPPORT",
    description: "Technical support team",
    parentId: 6,
    level: 1,
    path: "OPS/SUPPORT",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// Mock unit stats
const mockUnitStats = {
  total: mockUnits.length,
  active: mockUnits.filter((u) => u.isActive).length,
  inactive: mockUnits.filter((u) => !u.isActive).length,
  rootUnits: mockUnits.filter((u) => u.parentId === null).length,
  maxLevel: Math.max(...mockUnits.map((u) => u.level)),
};

export class UnitsController {
  /**
   * Get all units with filtering
   */
  async getUnits(req: Request, res: Response) {
    try {
      const { search, parentId, isActive } = req.query;

      let filteredUnits = [...mockUnits];

      // Apply search filter
      if (search) {
        const searchTerm = (search as string).toLowerCase();

        filteredUnits = filteredUnits.filter(
          (unit) =>
            unit.name.toLowerCase().includes(searchTerm) ||
            unit.code.toLowerCase().includes(searchTerm) ||
            unit.description?.toLowerCase().includes(searchTerm),
        );
      }

      // Apply parent filter
      if (parentId) {
        filteredUnits = filteredUnits.filter(
          (unit) => unit.parentId === Number(parentId),
        );
      }

      // Apply active filter
      if (isActive !== undefined) {
        filteredUnits = filteredUnits.filter(
          (unit) => unit.isActive === (isActive === "true"),
        );
      }

      logger.info(`Retrieved ${filteredUnits.length} units`);

      res.json({
        success: true,
        data: filteredUnits,
      });
    } catch (error) {
      logger.error("Error getting units:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get units tree structure
   */
  async getUnitsTree(req: Request, res: Response) {
    try {
      // Build tree structure
      const buildTree = (parentId: number | null): any[] => {
        return mockUnits
          .filter((unit) => unit.parentId === parentId)
          .map((unit) => ({
            ...unit,
            children: buildTree(unit.id),
          }));
      };

      const tree = buildTree(null);

      logger.info("Retrieved units tree structure");

      res.json({
        success: true,
        data: tree,
      });
    } catch (error) {
      logger.error("Error getting units tree:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get root units
   */
  async getRootUnits(req: Request, res: Response) {
    try {
      const rootUnits = mockUnits.filter((unit) => unit.parentId === null);

      logger.info(`Retrieved ${rootUnits.length} root units`);

      res.json({
        success: true,
        data: rootUnits,
      });
    } catch (error) {
      logger.error("Error getting root units:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get unit children
   */
  async getUnitChildren(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parentId = Number(id);

      const children = mockUnits.filter((unit) => unit.parentId === parentId);

      logger.info(`Retrieved ${children.length} children for unit ${id}`);

      res.json({
        success: true,
        data: children,
      });
    } catch (error) {
      logger.error("Error getting unit children:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get unit by ID
   */
  async getUnit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unit = mockUnits.find((u) => u.id === Number(id));

      if (!unit) {
        return res.status(404).json({
          success: false,
          message: "Unit not found",
        });
      }

      logger.info(`Retrieved unit ${id}`);

      res.json({
        success: true,
        data: unit,
      });
    } catch (error) {
      logger.error("Error getting unit by ID:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get unit path (breadcrumb)
   */
  async getUnitPath(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unitId = Number(id);

      const getPath = (currentId: number): any[] => {
        const unit = mockUnits.find((u) => u.id === currentId);

        if (!unit) return [];

        if (unit.parentId === null) {
          return [unit];
        } else {
          return [...getPath(unit.parentId), unit];
        }
      };

      const path = getPath(unitId);

      logger.info(`Retrieved path for unit ${id}: ${path.length} levels`);

      res.json({
        success: true,
        data: path,
      });
    } catch (error) {
      logger.error("Error getting unit path:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Search units
   */
  async searchUnits(req: Request, res: Response) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const searchTerm = (q as string).toLowerCase();
      const searchResults = mockUnits.filter(
        (unit) =>
          unit.name.toLowerCase().includes(searchTerm) ||
          unit.code.toLowerCase().includes(searchTerm) ||
          unit.description?.toLowerCase().includes(searchTerm) ||
          unit.path.toLowerCase().includes(searchTerm),
      );

      logger.info(
        `Search returned ${searchResults.length} units for query: ${q}`,
      );

      res.json({
        success: true,
        data: searchResults,
        searchQuery: q,
      });
    } catch (error) {
      logger.error("Error searching units:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get unit statistics
   */
  async getUnitStats(req: Request, res: Response) {
    try {
      logger.info("Retrieved unit statistics");

      res.json({
        success: true,
        data: mockUnitStats,
      });
    } catch (error) {
      logger.error("Error getting unit stats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
