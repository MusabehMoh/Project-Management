import { Request, Response } from "express";

import { logger } from "../utils/logger.js";

// Mock roles data
const mockRoles = [
  {
    id: 1,
    name: "Administrator",
    description: "Full system access and user management",
    isActive: true,
    permissions: [
      "users.create",
      "users.read",
      "users.update",
      "users.delete",
      "roles.manage",
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 2,
    name: "Project Manager",
    description: "Project creation and management access",
    isActive: true,
    permissions: [
      "projects.create",
      "projects.read",
      "projects.update",
      "timelines.manage",
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 3,
    name: "Viewer",
    description: "Read-only access to projects and data",
    isActive: true,
    permissions: ["projects.read", "users.read", "timelines.read"],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 4,
    name: "Unit Manager",
    description: "Manage units and departments",
    isActive: true,
    permissions: [
      "units.create",
      "units.read",
      "units.update",
      "departments.manage",
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
];

export class RolesController {
  /**
   * Get all roles
   */
  async getRoles(req: Request, res: Response) {
    try {
      logger.info(`Retrieved ${mockRoles.length} roles`);

      res.json({
        success: true,
        data: mockRoles,
      });
    } catch (error) {
      logger.error("Error getting roles:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get role by ID with actions
   */
  async getRoleById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const role = mockRoles.find((r) => r.id === Number(id));

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      logger.info(`Retrieved role ${id}: ${role.name}`);

      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      logger.error("Error getting role by ID:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create new role
   */
  async createRole(req: Request, res: Response) {
    try {
      const roleData = req.body;
      const newRole = {
        id: Math.max(...mockRoles.map((r) => r.id)) + 1,
        ...roleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRoles.push(newRole);
      logger.info(`Created new role: ${newRole.name}`);

      res.status(201).json({
        success: true,
        data: newRole,
      });
    } catch (error) {
      logger.error("Error creating role:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update role
   */
  async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const roleIndex = mockRoles.findIndex((r) => r.id === Number(id));

      if (roleIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      mockRoles[roleIndex] = {
        ...mockRoles[roleIndex],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      logger.info(`Updated role ${id}: ${mockRoles[roleIndex].name}`);

      res.json({
        success: true,
        data: mockRoles[roleIndex],
      });
    } catch (error) {
      logger.error("Error updating role:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delete role
   */
  async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const roleIndex = mockRoles.findIndex((r) => r.id === Number(id));

      if (roleIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      const deletedRole = mockRoles.splice(roleIndex, 1)[0];

      logger.info(`Deleted role ${id}: ${deletedRole.name}`);

      res.json({
        success: true,
        message: "Role deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting role:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Assign actions to role
   */
  async assignActions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { actionIds } = req.body;
      const role = mockRoles.find((r) => r.id === Number(id));

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      // In a real implementation, you would add the actions to the role
      logger.info(`Assigned ${actionIds.length} actions to role ${id}`);

      res.json({
        success: true,
        message: "Actions assigned successfully",
      });
    } catch (error) {
      logger.error("Error assigning actions to role:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Remove actions from role
   */
  async removeActions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { actionIds } = req.body;
      const role = mockRoles.find((r) => r.id === Number(id));

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      // In a real implementation, you would remove the actions from the role
      logger.info(`Removed ${actionIds?.length || 0} actions from role ${id}`);

      res.json({
        success: true,
        message: "Actions removed successfully",
      });
    } catch (error) {
      logger.error("Error removing actions from role:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
