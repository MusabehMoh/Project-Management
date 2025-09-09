import { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { mockProjectRequirements, mockRequirementAttachments } from "../data/mockProjectRequirements.js";
import { mockProjects } from "../data/mockProjects.js";
import { mockUsers } from "../data/mockUsers.js";
import { sendNotification } from "../signalR/notificationHub.js";

export class ProjectRequirementsController {
  /**
   * Get projects assigned to current analyst (based on analystIds in projects)
   */
  async getAssignedProjects(req: Request, res: Response) {
    try {
      // In a real app, this would come from authentication
      const currentUserId = parseInt(req.query.userId as string) || 4; // Default to analyst user
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string)?.toLowerCase() || "";
      const filterProjectId = req.query.projectId
        ? parseInt(req.query.projectId as string)
        : undefined;

      // Find projects where current user is in analystIds array
      let allAssignedProjects = mockProjects
        .filter(
          (project) =>
            project.analystIds && project.analystIds.includes(currentUserId),
        )
        .map((project) => {
          // Count requirements for this project
          const projectRequirements = mockProjectRequirements.filter(
            (req) => req.projectId === project.id,
          );
          const completedRequirements = projectRequirements.filter(
            (req) => req.status === "completed",
          );

          return {
            id: project.id,
            applicationName: project.applicationName,
            projectOwner: project.projectOwner,
            owningUnit: project.owningUnit,
            status: project.status,
            requirementsCount: projectRequirements.length,
            completedRequirements: completedRequirements.length,
            lastActivity: project.updatedAt,
          };
        });

      // Optional filter by specific projectId
      if (filterProjectId) {
        allAssignedProjects = allAssignedProjects.filter(
          (p) => p.id === filterProjectId,
        );
      }

      // Optional search by applicationName (case-insensitive)
      if (search) {
        allAssignedProjects = allAssignedProjects.filter((p) =>
          p.applicationName.toLowerCase().includes(search),
        );
      }

      // Calculate pagination
      const total = allAssignedProjects.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedProjects = allAssignedProjects.slice(
        offset,
        offset + limit,
      );

      logger.info(
        `Retrieved ${paginatedProjects.length} of ${total} assigned projects for user ${currentUserId} (page ${page})`,
      );

      const responseData = {
        success: true,
        data: paginatedProjects,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      res.json(responseData);
    } catch (error) {
  logger.error("API DEBUG: Error:", error);
      logger.error("Error getting assigned projects:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get requirements for a specific project
   */
  async getProjectRequirements(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { page = 1, limit = 20, status, priority, search } = req.query;

      let filteredRequirements = mockProjectRequirements.filter(
        (req) => req.projectId === parseInt(projectId),
      );

      // Apply filters
      if (status) {
        filteredRequirements = filteredRequirements.filter(
          (req) => req.status === status,
        );
      }

      if (priority) {
        filteredRequirements = filteredRequirements.filter(
          (req) => req.priority === priority,
        );
      }

      if (search) {
        const searchTerm = (search as string).toLowerCase();
        filteredRequirements = filteredRequirements.filter(
          (req) =>
            req.name.toLowerCase().includes(searchTerm) ||
            req.description.toLowerCase().includes(searchTerm),
        );
      }

      // Apply pagination
      const startIndex = ((page as number) - 1) * (limit as number);
      const endIndex = startIndex + (limit as number);
      const paginatedRequirements = filteredRequirements.slice(
        startIndex,
        endIndex,
      );

      logger.info(
        `Retrieved ${paginatedRequirements.length} requirements for project ${projectId}`,
      );

      res.json({
        success: true,
        data: paginatedRequirements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredRequirements.length,
          totalPages: Math.ceil(
            filteredRequirements.length / (limit as number),
          ),
        },
      });
    } catch (error) {
      logger.error("Error getting project requirements:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create a new requirement for a project
   */
  async createRequirement(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { name, description, priority, type, expectedCompletionDate, attachments } = req.body;
      const currentUserId = parseInt(req.query.userId as string) || 1; // Default user

      // Validate required fields
      if (!name || !description || !priority || !type || !expectedCompletionDate) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Missing required fields",
            code: "VALIDATION_ERROR",
          },
        });
      }

      // Validate type field
      if (!["new", "change request"].includes(type)) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Invalid requirement type. Must be 'new' or 'change request'",
            code: "VALIDATION_ERROR",
          },
        });
      }

      // Find the project to get project info
      const project = mockProjects.find(p => p.id === parseInt(projectId));
      if (!project) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Project not found",
            code: "NOT_FOUND",
          },
        });
      }

      // Create new requirement
      const newRequirement = {
        id: Math.max(...mockProjectRequirements.map(r => r.id), 0) + 1,
        projectId: parseInt(projectId),
        name,
        description,
        priority,
        type,
        expectedCompletionDate,
        status: "draft" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUserId,
        assignedAnalyst: currentUserId,
        project: {
          id: project.id,
          applicationName: project.applicationName,
          projectOwner: project.projectOwner,
          owningUnit: project.owningUnit
        },
        attachments: []
      };

      mockProjectRequirements.push(newRequirement);

      logger.info(`Created new requirement: ${newRequirement.name} (type: ${type}) for project ${projectId}`);

      res.status(201).json({
        success: true,
        data: newRequirement,
        message: "Requirement created successfully",
      });
    } catch (error) {
      logger.error("Error creating requirement:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update an existing requirement
   */
  async updateRequirement(req: Request, res: Response) {
    try {
      const { requirementId } = req.params;
      const { name, description, priority, type, expectedCompletionDate, status } = req.body;

      const requirementIndex = mockProjectRequirements.findIndex(
        (r) => r.id === parseInt(requirementId),
      );

      if (requirementIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Requirement not found",
            code: "NOT_FOUND",
          },
        });
      }

      // Validate type field if provided
      if (type && !["new", "change request"].includes(type)) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Invalid requirement type. Must be 'new' or 'change request'",
            code: "VALIDATION_ERROR",
          },
        });
      }

      // Update requirement fields
      const requirement = mockProjectRequirements[requirementIndex];
      if (name !== undefined) requirement.name = name;
      if (description !== undefined) requirement.description = description;
      if (priority !== undefined) requirement.priority = priority;
      if (type !== undefined) requirement.type = type;
      if (expectedCompletionDate !== undefined) requirement.expectedCompletionDate = expectedCompletionDate;
      if (status !== undefined) requirement.status = status;
      
      requirement.updatedAt = new Date().toISOString();

      logger.info(`Updated requirement ${requirementId}: ${requirement.name} (type: ${requirement.type})`);

      res.json({
        success: true,
        data: requirement,
        message: "Requirement updated successfully",
      });
    } catch (error) {
      logger.error("Error updating requirement:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send requirement to development manager
   */
  async sendRequirement(req: Request, res: Response) {
    try {
      const { requirementId } = req.params;
      const requirement = mockProjectRequirements.find(r => r.id === parseInt(requirementId));

      if (!requirement) {
        return res.status(404).json({
          success: false,
          message: "Requirement not found",
        });
      }

      // Update requirement status to pending (sent to development manager)
      requirement.status = "in-development";
      requirement.updatedAt = new Date().toISOString();

      // Send notification to development managers and project stakeholders
      const targetUsernames: string[] = [];
      
      // Add project owner to notifications
      const project = mockProjects.find(p => p.id === requirement.projectId);
      if (project) {
        const projectOwner = mockUsers.find(user => user.id === project.projectOwnerId);
        if (projectOwner) {
          targetUsernames.push(projectOwner.userName);
        }
      }

      // Send notification
      sendNotification({
        type: "REQUIREMENT_SENT_FOR_DEVELOPMENT",
        message: `Requirement "${requirement.name}" has been sent for development review`,
        projectId: requirement.projectId,
        targetUsernames: targetUsernames.length > 0 ? targetUsernames : undefined,
      });

      logger.info(
        `Requirement ${requirementId} sent for development: ${requirement.name}. Notified users: ${targetUsernames.join(", ")}`
      );

      res.json({
        success: true,
        data: requirement,
        message: "Requirement sent for development successfully",
      });
    } catch (error) {
      logger.error("Error sending requirement for development:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delete a requirement
   */
  async deleteRequirement(req: Request, res: Response) {
    try {
      const { requirementId } = req.params;
      const requirementIndex = mockProjectRequirements.findIndex(
        r => r.id === parseInt(requirementId)
      );

      if (requirementIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Requirement not found",
        });
      }

      const deletedRequirement = mockProjectRequirements[requirementIndex];
      mockProjectRequirements.splice(requirementIndex, 1);

      logger.info(`Deleted requirement ${requirementId}: ${deletedRequirement.name}`);

      res.json({
        success: true,
        data: deletedRequirement,
        message: "Requirement deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting requirement:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get requirement statistics for a project
   */
  async getRequirementStats(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const projectRequirements = mockProjectRequirements.filter(
        req => req.projectId === parseInt(projectId)
      );

      const stats = {
        total: projectRequirements.length,
        draft: projectRequirements.filter(r => r.status === 'draft').length,
        inDevelopment: projectRequirements.filter(r => r.status === 'in-development').length,
        completed: projectRequirements.filter(r => r.status === 'completed').length,
      };

      logger.info(`Retrieved requirement statistics for project ${projectId}`);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error getting requirement stats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
