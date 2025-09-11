import { Request, Response } from "express";

import { logger } from "../utils/logger.js";

// Mock actions data
export const mockActions = [
  {
    id: 1,
    name: "users.create",
    description: "Create new users",
    category: "User Management",
    resource: "users",
    action: "create",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 2,
    name: "users.read",
    description: "View user information",
    category: "User Management",
    resource: "users",
    action: "read",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 3,
    name: "users.update",
    description: "Update user information",
    category: "User Management",
    resource: "users",
    action: "update",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 4,
    name: "users.delete",
    description: "Delete users",
    category: "User Management",
    resource: "users",
    action: "delete",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 5,
    name: "projects.create",
    description: "Create new projects",
    category: "Project Management",
    resource: "projects",
    action: "create",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 6,
    name: "projects.read",
    description: "View project information",
    category: "Project Management",
    resource: "projects",
    action: "read",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
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
  {
    id: 10,
    name: "requirements.create",
    description: "Create new requirements",
    category: "Requirements Management",
    resource: "requirements",
    action: "create",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 11,
    name: "requirements.read",
    description: "View requirements",
    category: "Requirements Management",
    resource: "requirements",
    action: "read",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 12,
    name: "requirements.update",
    description: "Update requirements",
    category: "Requirements Management",
    resource: "requirements",
    action: "update",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 13,
    name: "requirements.delete",
    description: "Delete requirements",
    category: "Requirements Management",
    resource: "requirements",
    action: "delete",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 14,
    name: "requirements.send",
    description: "Send requirements to development",
    category: "Requirements Management",
    resource: "requirements",
    action: "send",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 15,
    name: "requirements.attachments.upload",
    description: "Upload attachments to requirements",
    category: "Requirements Management",
    resource: "requirements.attachments",
    action: "upload",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 16,
    name: "requirements.attachments.delete",
    description: "Delete attachments from requirements",
    category: "Requirements Management",
    resource: "requirements.attachments",
    action: "delete",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 17,
    name: "requirements.attachments.download",
    description: "Download attachments from requirements",
    category: "Requirements Management",
    resource: "requirements.attachments",
    action: "download",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 18,
    name: "projects.requirements.view",
    description: "View project requirements",
    category: "Requirements Management",
    resource: "projects.requirements",
    action: "view",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 19,
    name: "requirements.tasks.create",
    description: "Create tasks for requirements",
    category: "Requirements Management",
    resource: "requirements.tasks",
    action: "create",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 20,
    name: "requirements.tasks.update",
    description: "Update tasks for requirements",
    category: "Requirements Management",
    resource: "requirements.tasks",
    action: "update",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 21,
    name: "requirements.timelines.create",
    description: "Create timelines for requirements",
    category: "Requirements Management",
    resource: "requirements.timelines",
    action: "create",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 22,
    name: "requirements.timelines.read",
    description: "View timelines for requirements",
    category: "Requirements Management",
    resource: "requirements.timelines",
    action: "read",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 23,
    name: "requirements.development.view",
    description: "View development requirements",
    category: "Requirements Management",
    resource: "requirements.development",
    action: "view",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 24,
    name: "timelines.view",
    description: "View timelines",
    category: "Timeline Management",
    resource: "timelines",
    action: "view",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 25,
    name: "timelines.update",
    description: "Update timelines",
    category: "Timeline Management",
    resource: "timelines",
    action: "update",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 26,
    name: "sprints.create",
    description: "Create sprints",
    category: "Timeline Management",
    resource: "sprints",
    action: "create",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 27,
    name: "sprints.read",
    description: "View sprints",
    category: "Timeline Management",
    resource: "sprints",
    action: "read",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 28,
    name: "sprints.update",
    description: "Update sprints",
    category: "Timeline Management",
    resource: "sprints",
    action: "update",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 29,
    name: "sprints.delete",
    description: "Delete sprints",
    category: "Timeline Management",
    resource: "sprints",
    action: "delete",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 30,
    name: "timelines.requirements.create",
    description: "Create timeline requirements",
    category: "Timeline Management",
    resource: "timelines.requirements",
    action: "create",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 31,
    name: "timelines.requirements.read",
    description: "View timeline requirements",
    category: "Timeline Management",
    resource: "timelines.requirements",
    action: "read",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 32,
    name: "timelines.requirements.update",
    description: "Update timeline requirements",
    category: "Timeline Management",
    resource: "timelines.requirements",
    action: "update",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 33,
    name: "timelines.requirements.delete",
    description: "Delete timeline requirements",
    category: "Timeline Management",
    resource: "timelines.requirements",
    action: "delete",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 34,
    name: "timelines.requirements.move",
    description: "Move timeline requirements",
    category: "Timeline Management",
    resource: "timelines.requirements",
    action: "move",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 35,
    name: "timelines.tasks.create",
    description: "Create timeline tasks",
    category: "Timeline Management",
    resource: "timelines.tasks",
    action: "create",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 36,
    name: "timelines.tasks.read",
    description: "View timeline tasks",
    category: "Timeline Management",
    resource: "timelines.tasks",
    action: "read",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 37,
    name: "timelines.tasks.update",
    description: "Update timeline tasks",
    category: "Timeline Management",
    resource: "timelines.tasks",
    action: "update",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 38,
    name: "timelines.tasks.delete",
    description: "Delete timeline tasks",
    category: "Timeline Management",
    resource: "timelines.tasks",
    action: "delete",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 39,
    name: "timelines.tasks.move",
    description: "Move timeline tasks",
    category: "Timeline Management",
    resource: "timelines.tasks",
    action: "move",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 40,
    name: "subtasks.create",
    description: "Create subtasks",
    category: "Timeline Management",
    resource: "subtasks",
    action: "create",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 41,
    name: "subtasks.read",
    description: "View subtasks",
    category: "Timeline Management",
    resource: "subtasks",
    action: "read",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 42,
    name: "subtasks.update",
    description: "Update subtasks",
    category: "Timeline Management",
    resource: "subtasks",
    action: "update",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 43,
    name: "subtasks.delete",
    description: "Delete subtasks",
    category: "Timeline Management",
    resource: "subtasks",
    action: "delete",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 44,
    name: "departments.read",
    description: "View departments",
    category: "Department Management",
    resource: "departments",
    action: "read",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 45,
    name: "departments.update",
    description: "Update departments",
    category: "Department Management",
    resource: "departments",
    action: "update",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 46,
    name: "departments.delete",
    description: "Delete departments",
    category: "Department Management",
    resource: "departments",
    action: "delete",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 47,
    name: "departments.members.read",
    description: "View department members",
    category: "Department Management",
    resource: "departments.members",
    action: "read",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 48,
    name: "departments.members.create",
    description: "Add members to departments",
    category: "Department Management",
    resource: "departments.members",
    action: "create",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 49,
    name: "departments.members.delete",
    description: "Remove members from departments",
    category: "Department Management",
    resource: "departments.members",
    action: "delete",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 50,
    name: "employees.search",
    description: "Search employees",
    category: "User Management",
    resource: "employees",
    action: "search",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
];

export class ActionsController {
  /**
   * Get all actions grouped by category
   */
  async getActions(req: Request, res: Response) {
    try {
      const { category } = req.query;

      let filteredActions = mockActions;

      if (category && typeof category === "string") {
        filteredActions = mockActions.filter(
          (action) => (action.category || action.categoryName)?.toLowerCase() === category.toLowerCase(),
        );
      }

      logger.info(
        `Retrieved ${filteredActions.length} actions${category ? ` for category: ${category}` : ""}`,
      );

      res.json({
        success: true,
        data: filteredActions,
      });
    } catch (error) {
      logger.error("Error getting actions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get action by ID
   */
  async getActionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const action = mockActions.find((a) => a.id === Number(id));

      if (!action) {
        return res.status(404).json({
          success: false,
          message: "Action not found",
        });
      }

      logger.info(`Retrieved action ${id}: ${action.name}`);

      res.json({
        success: true,
        data: action,
      });
    } catch (error) {
      logger.error("Error getting action by ID:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create new action
   */
  async createAction(req: Request, res: Response) {
    try {
      const actionData = req.body;
      const newAction = {
        id: Math.max(...mockActions.map((a) => a.id)) + 1,
        ...actionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockActions.push(newAction);
      logger.info(`Created new action: ${newAction.name}`);

      res.status(201).json({
        success: true,
        data: newAction,
      });
    } catch (error) {
      logger.error("Error creating action:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update action
   */
  async updateAction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const actionIndex = mockActions.findIndex((a) => a.id === Number(id));

      if (actionIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Action not found",
        });
      }

      mockActions[actionIndex] = {
        ...mockActions[actionIndex],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      logger.info(`Updated action ${id}: ${mockActions[actionIndex].name}`);

      res.json({
        success: true,
        data: mockActions[actionIndex],
      });
    } catch (error) {
      logger.error("Error updating action:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delete action
   */
  async deleteAction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const actionIndex = mockActions.findIndex((a) => a.id === Number(id));

      if (actionIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Action not found",
        });
      }

      const deletedAction = mockActions.splice(actionIndex, 1)[0];

      logger.info(`Deleted action ${id}: ${deletedAction.name}`);

      res.json({
        success: true,
        message: "Action deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting action:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
