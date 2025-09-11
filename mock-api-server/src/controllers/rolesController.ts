import { Request, Response } from "express";

import { logger } from "../utils/logger.js";

// Mock roles data
export const mockRoles = [
  {
    id: 1,
    name: "Administrator",
    description: "Full system access and user management",
    isActive: true,
    actions: [
      {
        id: 1,
        name: "users.create",
        categoryName: "User Management",
        categoryType: "System",
        description: "Create new users",
        isActive: true,
        actionOrder: 1,
      },
      {
        id: 2,
        name: "users.read",
        categoryName: "User Management",
        categoryType: "System",
        description: "View user information",
        isActive: true,
        actionOrder: 2,
      },
      {
        id: 3,
        name: "users.update",
        categoryName: "User Management",
        categoryType: "System",
        description: "Update user information",
        isActive: true,
        actionOrder: 3,
      },
      {
        id: 4,
        name: "users.delete",
        categoryName: "User Management",
        categoryType: "System",
        description: "Delete users",
        isActive: true,
        actionOrder: 4,
      },
      {
        id: 5,
        name: "projects.create",
        categoryName: "Project Management",
        categoryType: "Projects",
        description: "Create new projects",
        isActive: true,
        actionOrder: 5,
      },
      {
        id: 6,
        name: "projects.read",
        categoryName: "Project Management",
        categoryType: "Projects",
        description: "View project information",
        isActive: true,
        actionOrder: 6,
      },
      {
        id: 7,
        name: "projects.update",
        categoryName: "Project Management",
        categoryType: "Projects",
        description: "Update project information",
        isActive: true,
        actionOrder: 7,
      },
      {
        id: 8,
        name: "projects.delete",
        categoryName: "Project Management",
        categoryType: "Projects",
        description: "Delete projects",
        isActive: true,
        actionOrder: 8,
      },
      {
        id: 9,
        name: "projects.sendToAnylsis",
        categoryName: "Project Management",
        categoryType: "Projects",
        description: "Send projects to analysis",
        isActive: true,
        actionOrder: 9,
      },
      {
        id: 10,
        name: "requirements.create",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Create new requirements",
        isActive: true,
        actionOrder: 10,
      },
      {
        id: 11,
        name: "requirements.read",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "View requirements",
        isActive: true,
        actionOrder: 11,
      },
      {
        id: 12,
        name: "requirements.update",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Update requirements",
        isActive: true,
        actionOrder: 12,
      },
      {
        id: 13,
        name: "requirements.delete",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Delete requirements",
        isActive: true,
        actionOrder: 13,
      },
      {
        id: 14,
        name: "requirements.send",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Send requirements to development",
        isActive: true,
        actionOrder: 14,
      },
      {
        id: 15,
        name: "requirements.attachments.upload",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Upload attachments to requirements",
        isActive: true,
        actionOrder: 15,
      },
      {
        id: 16,
        name: "requirements.attachments.delete",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Delete attachments from requirements",
        isActive: true,
        actionOrder: 16,
      },
      {
        id: 17,
        name: "requirements.attachments.download",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Download attachments from requirements",
        isActive: true,
        actionOrder: 17,
      },
      {
        id: 18,
        name: "projects.requirements.view",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "View project requirements",
        isActive: true,
        actionOrder: 18,
      },
      {
        id: 19,
        name: "requirements.tasks.create",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Create tasks for requirements",
        isActive: true,
        actionOrder: 19,
      },
      {
        id: 20,
        name: "requirements.tasks.update",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Update tasks for requirements",
        isActive: true,
        actionOrder: 20,
      },
      {
        id: 21,
        name: "requirements.timelines.create",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "Create timelines for requirements",
        isActive: true,
        actionOrder: 21,
      },
      {
        id: 22,
        name: "requirements.timelines.read",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "View timelines for requirements",
        isActive: true,
        actionOrder: 22,
      },
      {
        id: 23,
        name: "requirements.development.view",
        categoryName: "Requirements Management",
        categoryType: "Requirements",
        description: "View development requirements",
        isActive: true,
        actionOrder: 23,
      },
      {
        id: 24,
        name: "timelines.view",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "View timelines",
        isActive: true,
        actionOrder: 24,
      },
      {
        id: 25,
        name: "timelines.update",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Update timelines",
        isActive: true,
        actionOrder: 25,
      },
      {
        id: 26,
        name: "sprints.create",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Create sprints",
        isActive: true,
        actionOrder: 26,
      },
      {
        id: 27,
        name: "sprints.read",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "View sprints",
        isActive: true,
        actionOrder: 27,
      },
      {
        id: 28,
        name: "sprints.update",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Update sprints",
        isActive: true,
        actionOrder: 28,
      },
      {
        id: 29,
        name: "sprints.delete",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Delete sprints",
        isActive: true,
        actionOrder: 29,
      },
      {
        id: 30,
        name: "timelines.requirements.create",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Create timeline requirements",
        isActive: true,
        actionOrder: 30,
      },
      {
        id: 31,
        name: "timelines.requirements.read",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "View timeline requirements",
        isActive: true,
        actionOrder: 31,
      },
      {
        id: 32,
        name: "timelines.requirements.update",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Update timeline requirements",
        isActive: true,
        actionOrder: 32,
      },
      {
        id: 33,
        name: "timelines.requirements.delete",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Delete timeline requirements",
        isActive: true,
        actionOrder: 33,
      },
      {
        id: 34,
        name: "timelines.requirements.move",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Move timeline requirements",
        isActive: true,
        actionOrder: 34,
      },
      {
        id: 35,
        name: "timelines.tasks.create",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Create timeline tasks",
        isActive: true,
        actionOrder: 35,
      },
      {
        id: 36,
        name: "timelines.tasks.read",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "View timeline tasks",
        isActive: true,
        actionOrder: 36,
      },
      {
        id: 37,
        name: "timelines.tasks.update",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Update timeline tasks",
        isActive: true,
        actionOrder: 37,
      },
      {
        id: 38,
        name: "timelines.tasks.delete",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Delete timeline tasks",
        isActive: true,
        actionOrder: 38,
      },
      {
        id: 39,
        name: "timelines.tasks.move",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Move timeline tasks",
        isActive: true,
        actionOrder: 39,
      },
      {
        id: 40,
        name: "subtasks.create",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Create subtasks",
        isActive: true,
        actionOrder: 40,
      },
      {
        id: 41,
        name: "subtasks.read",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "View subtasks",
        isActive: true,
        actionOrder: 41,
      },
      {
        id: 42,
        name: "subtasks.update",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Update subtasks",
        isActive: true,
        actionOrder: 42,
      },
      {
        id: 43,
        name: "subtasks.delete",
        categoryName: "Timeline Management",
        categoryType: "Timeline",
        description: "Delete subtasks",
        isActive: true,
        actionOrder: 43,
      },
      {
        id: 44,
        name: "departments.read",
        categoryName: "Department Management",
        categoryType: "Departments",
        description: "View departments",
        isActive: true,
        actionOrder: 44,
      },
      {
        id: 45,
        name: "departments.update",
        categoryName: "Department Management",
        categoryType: "Departments",
        description: "Update departments",
        isActive: true,
        actionOrder: 45,
      },
      {
        id: 46,
        name: "departments.delete",
        categoryName: "Department Management",
        categoryType: "Departments",
        description: "Delete departments",
        isActive: true,
        actionOrder: 46,
      },
      {
        id: 47,
        name: "departments.members.read",
        categoryName: "Department Management",
        categoryType: "Departments",
        description: "View department members",
        isActive: true,
        actionOrder: 47,
      },
      {
        id: 48,
        name: "departments.members.create",
        categoryName: "Department Management",
        categoryType: "Departments",
        description: "Add members to departments",
        isActive: true,
        actionOrder: 48,
      },
      {
        id: 49,
        name: "departments.members.delete",
        categoryName: "Department Management",
        categoryType: "Departments",
        description: "Remove members from departments",
        isActive: true,
        actionOrder: 49,
      },
      {
        id: 50,
        name: "employees.search",
        categoryName: "User Management",
        categoryType: "System",
        description: "Search employees",
        isActive: true,
        actionOrder: 50,
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 2,
    name: "Analyst Department Manager",
    description: "Manages analyst department and requirements",
    isActive: true,
    actions: [
      {
        id: 5,
        name: "projects.create",
        categoryName: "Projects Administration",
        categoryType: "Projects",
        description: "Configure system settings",
        isActive: true,
        actionOrder: 5,
      },
      {
        id: 6,
        name: "projects.read",
        categoryName: "Projects Administration",
        categoryType: "Projects",
        description: "Configure system settings",
        isActive: true,
        actionOrder: 6,
      },
      {
        id: 7,
        name: "projects.update",
        categoryName: "Projects Administration",
        categoryType: "Projects",
        description: "Configure system settings",
        isActive: true,
        actionOrder: 7,
      },
      {
        id: 8,
        name: "projects.delete",
        categoryName: "Projects Administration",
        categoryType: "Projects",
        description: "Configure system settings",
        isActive: true,
        actionOrder: 8,
      },
      {
        id: 9,
        name: "projects.sendToAnylsis",
        categoryName: "Projects Administration",
        categoryType: "Projects",
        description: "Configure system settings",
        isActive: true,
        actionOrder: 9,
      },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 3,
    name: "Analyst",
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
    name: "Development Manager",
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
    name: "Software Developer",
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
    name: "Quality Control Manager",
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
    name: "Quality Control Team Member",
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
