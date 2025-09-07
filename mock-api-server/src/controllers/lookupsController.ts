import { Request, Response } from "express";

import { logger } from "../utils/logger.js";

// Mock lookups data
const mockLookups = {
  projectStatus: [
    { id: 1, value: "planning", label: "Planning", isActive: true },
    { id: 2, value: "active", label: "Active", isActive: true },
    { id: 3, value: "completed", label: "Completed", isActive: true },
    { id: 4, value: "cancelled", label: "Cancelled", isActive: true },
    { id: 5, value: "on-hold", label: "On Hold", isActive: true },
  ],
  priority: [
    { id: 1, value: "low", label: "Low", color: "#6B7280", isActive: true },
    {
      id: 2,
      value: "medium",
      label: "Medium",
      color: "#3B82F6",
      isActive: true,
    },
    { id: 3, value: "high", label: "High", color: "#F59E0B", isActive: true },
    {
      id: 4,
      value: "critical",
      label: "Critical",
      color: "#EF4444",
      isActive: true,
    },
  ],
  taskStatus: [
    {
      id: 1,
      value: "not-started",
      label: "Not Started2",
      color: "#6B7280",
      isActive: true,
    },
    {
      id: 2,
      value: "in-progress",
      label: "In Progress",
      color: "#3B82F6",
      isActive: true,
    },
    {
      id: 3,
      value: "on-hold",
      label: "On Hold",
      color: "#F59E0B",
      isActive: true,
    },
    {
      id: 4,
      value: "completed",
      label: "Completed",
      color: "#10B981",
      isActive: true,
    },
    {
      id: 5,
      value: "cancelled",
      label: "Cancelled",
      color: "#EF4444",
      isActive: true,
    },
  ],
  grades: [
    { id: 1, value: "colonel", label: "Colonel", isActive: true },
    { id: 2, value: "major", label: "Major", isActive: true },
    { id: 3, value: "captain", label: "Captain", isActive: true },
    { id: 4, value: "lieutenant", label: "Lieutenant", isActive: true },
    { id: 5, value: "sergeant", label: "Sergeant", isActive: true },
  ],
};

  // Mock project status data matching the interface from frontend
const mockProjectStatuses = [
  {
    id: 1,
    nameEn: "New",
    nameAr: "جديد",
    code: 1,
    isActive: true,
    order: 1,
  },
  {
    id: 2,
    nameEn: "Delayed",
    nameAr: "مؤجل",
    code: 2,
    isActive: true,
    order: 2,
  },
  {
    id: 3,
    nameEn: "Under Review",
    nameAr: "قيد الدراسة",
    code: 3,
    isActive: true,
    order: 3,
  },
  {
    id: 4,
    nameEn: "Under Development",
    nameAr: "قيد التطوير",
    code: 4,
    isActive: true,
    order: 4,
  },
  {
    id: 5,
    nameEn: "Production Environment",
    nameAr: "بيئة الانتاج",
    code: 5,
    isActive: true,
    order: 5,
  },
];

 
export class LookupsController {
  /**
   * Get all lookups
   */
  async getAllLookups(req: Request, res: Response) {
    try {
      logger.info("Retrieved all lookups");

      res.json({
        success: true,
        data: mockLookups,
      });
    } catch (error) {
      logger.error("Error getting lookups:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get lookup by type
   */
  async getLookupByType(req: Request, res: Response) {
    try {
      const { type } = req.params;

      const lookup = mockLookups[type as keyof typeof mockLookups];

      if (!lookup) {
        return res.status(404).json({
          success: false,
          message: `Lookup type '${type}' not found`,
        });
      }

      logger.info(`Retrieved lookup type: ${type}`);

      res.json({
        success: true,
        data: lookup,
      });
    } catch (error) {
      logger.error("Error getting lookup by type:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
  /**
   * Get all project statuses
   */
  async getStatuses(req: Request, res: Response) {
    try {
      logger.info("[ProjectStatusController] Getting all project statuses");
      
      res.json({
        success: true,
        data: mockProjectStatuses
      });
    } catch (error) {
      logger.error("[ProjectStatusController] Error getting project statuses:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch project statuses",
          code: "FETCH_ERROR"
        }
      });
    }
  }


}

