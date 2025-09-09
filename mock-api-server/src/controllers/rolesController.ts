import { Request, Response } from "express";

import { logger } from "../utils/logger.js";

// Mock roles data
export const mockRoles = [
  {
    id: 1,
    name: "System Admin",
    description: "Full system access and user management",
    isActive: true,
    actions: [
      {
        id: 1,
        name: "users.create",
        categoryName: "Create user information",
        categoryType: "System",
        description: "Create new user accounts",
        isActive: true,
        actionOrder: 1,
      },
      {
        id: 2,
        name: "users.read",
        categoryName: "View user information",
        categoryType: "System",
        description: "Modify existing user accounts",
        isActive: true,
        actionOrder: 2,
      },
      {
        id: 3,
        name: "users.delete",
        categoryName: "Delete user information",
        categoryType: "System",
        description: "Remove user accounts",
        isActive: true,
        actionOrder: 3,
      },
      {
        id: 4,
        name: "users.update",
        categoryName: "Update user information",
        categoryType: "System",
        description: "Create and modify user roles",
        isActive: true,
        actionOrder: 4,
      },
     {
        id: 5,
        name: "projects.create",
        categoryName: "System Administration",
        categoryType: "System",
        description: "Configure system settings",
        isActive: true,
        actionOrder: 5,
      },
      {
        id: 6,
        name: "projects.update",
        categoryName: "System Administration",
        categoryType: "System",
        description: "Configure system settings",
        isActive: true,
        actionOrder: 6,
      },
      {
        id: 7,
        name: "projects.delete",
        categoryName: "System Administration",
        categoryType: "System",
        description: "Configure system settings",
        isActive: true,
        actionOrder: 7,
      },
      {
        id: 8,
        name: "projects.sendToAnylsis",
        categoryName: "System Administration",
        categoryType: "System",
        description: "Configure system settings",
        isActive: true,
        actionOrder: 8,
      }
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 2,
    name: "Analyst Dept Mgr",
    description: "Manages analyst department and requirements",
    isActive: true,
    permissions: [
      "Project.ViewAll",
      "Project.EditDetails",
      "Project.AssignAnalystTeam",
      "Project.ChangeStatus",
      "Project.Archive/Delete",
      "Requirement.Create",
      "Requirement.ViewAll",
      "Requirement.ViewAssigned",
      "Requirement.EditDetails",
      "Requirement.AddAttachment",
      "Requirement.Delete",
      "Requirement.SubmitChangeRequest",
      "Requirement.Approve/Reject",
      "Requirement.EstimateEffort",
      "Requirement.AssignDeveloper",
      "Requirement.UpdateSmallTaskStatus",
      "Requirement.CreateQCTaskForSmall",
      "Requirement.AssignQCForSmall",
      "Task.ViewAll",
      "Task.ViewAssigned",
      "Task.EditDetails",
      "Task.AssignDeveloper",
      "Task.AssignQC",
      "Task.UpdateStatus",
      "Task.LogTime",
      "Task.AddComment",
      "Task.AddAttachment",
      "Task.Delete",
      "Sprint.ViewTimeline",
      "User.ViewAll",
      "User.EditDetails",
      "User.AssignRole",
      "User.Deactivate/Activate",
      "Role.Manage",
      "Report.ViewAll",
      "Report.ViewProjectSpecific",
      "Report.GenerateCustom",
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 3,
    name: "Analyst Team Member",
    description: "Works on requirements and tasks as assigned",
    isActive: true,
    permissions: [
      "Project.ViewAssigned",
      "Requirement.Create",
      "Requirement.ViewAssigned",
      "Requirement.EditDetails",
      "Requirement.AddAttachment",
      "Requirement.Delete",
      "Requirement.SubmitChangeRequest",
      "Requirement.Approve/Reject",
      "Requirement.EstimateEffort",
      "Requirement.AssignDeveloper",
      "Requirement.UpdateSmallTaskStatus",
      "Requirement.CreateQCTaskForSmall",
      "Requirement.AssignQCForSmall",
      "Task.ViewAssigned",
      "Task.EditDetails",
      "Task.AssignDeveloper",
      "Task.AssignQC",
      "Task.UpdateStatus",
      "Task.LogTime",
      "Task.AddComment",
      "Task.AddAttachment",
      "Task.Delete",
      "Sprint.ViewTimeline",
      "User.ViewAll",
      "User.EditDetails",
      "Report.ViewProjectSpecific",
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 4,
    name: "Dev Manager",
    description: "Manages development team and tasks",
    isActive: true,
    permissions: [
      "Project.ViewAll",
      "Project.EditDetails",
      "Project.AssignDevTeam",
      "Project.ChangeStatus",
      "Project.Archive/Delete",
      "Requirement.ViewAll",
      "Requirement.ViewAssigned",
      "Requirement.EditDetails",
      "Requirement.AddAttachment",
      "Requirement.Delete",
      "Task.ViewAll",
      "Task.ViewAssigned",
      "Task.EditDetails",
      "Task.AssignDeveloper",
      "Task.UpdateStatus",
      "Task.LogTime",
      "Task.AddComment",
      "Task.AddAttachment",
      "Task.Delete",
      "Sprint.ViewTimeline",
      "User.ViewAll",
      "User.EditDetails",
      "Report.ViewProjectSpecific",
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 5,
    name: "Developer",
    description: "Works on assigned development tasks",
    isActive: true,
    permissions: [
      "Project.ViewAssigned",
      "Requirement.ViewAssigned",
      "Requirement.EditDetails",
      "Requirement.AddAttachment",
      "Task.ViewAssigned",
      "Task.EditDetails",
      "Task.UpdateStatus",
      "Task.LogTime",
      "Task.AddComment",
      "Task.AddAttachment",
      "Sprint.ViewTimeline",
      "Report.ViewProjectSpecific",
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 6,
    name: "QC Manager",
    description: "Manages quality control team and tasks",
    isActive: true,
    permissions: [
      "Project.ViewAll",
      "Requirement.ViewAll",
      "Requirement.ViewAssigned",
      "Requirement.EditDetails",
      "Requirement.AddAttachment",
      "Task.ViewAll",
      "Task.ViewAssigned",
      "Task.EditDetails",
      "Task.AssignQC",
      "Task.UpdateStatus",
      "Task.LogTime",
      "Task.AddComment",
      "Task.AddAttachment",
      "Sprint.ViewTimeline",
      "User.ViewAll",
      "User.EditDetails",
      "Report.ViewProjectSpecific",
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 7,
    name: "QC Team Member",
    description: "Works on assigned QC tasks",
    isActive: true,
    permissions: [
      "Project.ViewAssigned",
      "Requirement.ViewAssigned",
      "Requirement.EditDetails",
      "Requirement.AddAttachment",
      "Task.ViewAssigned",
      "Task.EditDetails",
      "Task.UpdateStatus",
      "Task.LogTime",
      "Task.AddComment",
      "Task.AddAttachment",
      "Sprint.ViewTimeline",
      "Report.ViewProjectSpecific",
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
