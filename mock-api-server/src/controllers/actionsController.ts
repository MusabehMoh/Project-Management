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
    id: 7,
    name: "projects.update",
    description: "Update project information",
    category: "Project Management",
    resource: "projects",
    action: "update",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-08-30T07:30:00Z",
  },
  {
    id: 8,
    name: "roles.manage",
    description: "Manage roles and permissions",
    category: "Security",
    resource: "roles",
    action: "manage",
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
          (action) => action.category.toLowerCase() === category.toLowerCase(),
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
