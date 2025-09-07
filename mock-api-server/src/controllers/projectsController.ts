import { Request, Response } from "express";

import { logger } from "../utils/logger.js";
import { mockProjects } from "../data/mockProjects.js";
import { mockUsers } from "../data/mockUsers.js";
import { sendNotification } from "../signalR/notificationHub.js";

// Mock project stats
const mockProjectStats = {
  total: mockProjects.length,
  new: mockProjects.filter((p) => p.status === 1).length, // New (جديد)
  delayed: mockProjects.filter((p) => p.status === 2).length, // Delayed (مؤجل)
  underReview: mockProjects.filter((p) => p.status === 3).length, // Under Review (قيد الدراسة)
  underDevelopment: mockProjects.filter((p) => p.status === 4).length, // Under Development (قيد التطوير)
  production: mockProjects.filter((p) => p.status === 5).length, // Production Environment (بيئة الانتاج)
};

export class ProjectsController {
  /**
   * Get all projects with pagination and filtering
   */
  async getProjects(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, search, status, priority } = req.query;

      let filteredProjects = [...mockProjects];

      // Apply search filter
      if (search) {
        const searchTerm = (search as string).toLowerCase();

        filteredProjects = filteredProjects.filter(
          (project) =>
            project.applicationName.toLowerCase().includes(searchTerm) ||
            project.description?.toLowerCase().includes(searchTerm) ||
            project.projectOwner?.toLowerCase().includes(searchTerm),
        );
      }

      // Apply status filter (convert string to number)
      if (status) {
        const statusNumber = Number(status);

        filteredProjects = filteredProjects.filter(
          (project) => project.status === statusNumber,
        );
      }

      // Apply priority filter
      if (priority) {
        filteredProjects = filteredProjects.filter(
          (project) => project.priority === priority,
        );
      }

      // Apply pagination
      const startIndex = ((page as number) - 1) * (limit as number);
      const endIndex = startIndex + (limit as number);
      const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

      logger.info(
        `Retrieved ${paginatedProjects.length} projects (page ${page}, limit ${limit})`,
      );

      res.json({
        success: true,
        data: paginatedProjects,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredProjects.length,
          totalPages: Math.ceil(filteredProjects.length / (limit as number)),
        },
      });
    } catch (error) {
      logger.error("Error getting projects:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const project = mockProjects.find((p) => p.id === Number(id));

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      logger.info(`Retrieved project ${id}`);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      logger.error("Error getting project by ID:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(req: Request, res: Response) {
    try {
      logger.info("Retrieved project statistics");

      res.json({
        success: true,
        data: mockProjectStats,
      });
    } catch (error) {
      logger.error("Error getting project stats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Search projects
   */
  async searchProjects(req: Request, res: Response) {
    try {
      const { q, status, priority, page = 1, limit = 20 } = req.query;

      let filteredProjects = [...mockProjects];

      // Apply search query
      if (q) {
        const searchTerm = (q as string).toLowerCase();

        filteredProjects = filteredProjects.filter(
          (project) =>
            project.applicationName.toLowerCase().includes(searchTerm) ||
            project.description?.toLowerCase().includes(searchTerm) ||
            project.projectOwner?.toLowerCase().includes(searchTerm),
        );
      }

      // Apply filters
      if (status) {
        const statusNumber = Number(status);

        filteredProjects = filteredProjects.filter(
          (project) => project.status === statusNumber,
        );
      }

      if (priority) {
        filteredProjects = filteredProjects.filter(
          (project) => project.priority === priority,
        );
      }

      // Apply pagination
      const startIndex = ((page as number) - 1) * (limit as number);
      const endIndex = startIndex + (limit as number);
      const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

      logger.info(
        `Search returned ${paginatedProjects.length} projects for query: ${q}`,
      );

      res.json({
        success: true,
        data: paginatedProjects,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredProjects.length,
          totalPages: Math.ceil(filteredProjects.length / (limit as number)),
        },
        searchQuery: q,
      });
    } catch (error) {
      logger.error("Error searching projects:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create a new project
   */
  async createProject(req: Request, res: Response) {
    try {
      const {
        applicationName,
        projectOwner,
        alternativeOwner,
        owningUnit,
        analysts,
        startDate,
        expectedCompletionDate,
        description,
        remarks,
        status = 1,
      } = req.body;

      // Validate required fields
      if (!applicationName || !projectOwner || !owningUnit || !startDate) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Missing required fields",
            code: "VALIDATION_ERROR",
          },
        });
      }

      // Generate analyst display names from IDs (mock implementation)
      let analystNames = "";
      if (analysts && analysts.length > 0) {
        analystNames = analysts.map((id: number) => `User #${id}`).join(", ");
      }

      // Create new project
      const newProject = {
        id: Math.max(...mockProjects.map((p) => p.id), 0) + 1,
        applicationName,
        projectOwner: `User #${projectOwner}`, // TODO: Get actual user name
        alternativeOwner: alternativeOwner ? `User #${alternativeOwner}` : "",
        owningUnit: `Unit #${owningUnit}`, // TODO: Get actual unit name
        projectOwnerId: projectOwner,
        alternativeOwnerId: alternativeOwner || 0,
        owningUnitId: owningUnit,
        analysts: analystNames,
        analystIds: analysts || [],
        startDate,
        expectedCompletionDate: expectedCompletionDate || "",
        description: description || "",
        remarks: remarks || "",
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: "medium",
        budget: 0,
        progress: 0,
      };

      mockProjects.push(newProject);

      logger.info(`Created new project: ${newProject.applicationName}`);

      res.status(201).json({
        success: true,
        data: newProject,
        message: "Project created successfully",
      });
    } catch (error) {
      logger.error("Error creating project:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update an existing project
   */
  async updateProject(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.id);
      const {
        applicationName,
        projectOwner,
        alternativeOwner,
        owningUnit,
        analysts,
        startDate,
        expectedCompletionDate,
        description,
        remarks,
        status,
      } = req.body;

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Invalid project ID",
            code: "INVALID_PROJECT_ID",
          },
        });
      }

      const projectIndex = mockProjects.findIndex((p) => p.id === projectId);

      if (projectIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Project not found",
            code: "NOT_FOUND",
          },
        });
      }

      // Update project fields
      const project = mockProjects[projectIndex];
      if (applicationName !== undefined) project.applicationName = applicationName;
      if (projectOwner !== undefined) {
        project.projectOwnerId = projectOwner;
        project.projectOwner = `User #${projectOwner}`; // TODO: Get actual user name
      }
      if (alternativeOwner !== undefined) {
        project.alternativeOwnerId = alternativeOwner;
        project.alternativeOwner = alternativeOwner ? `User #${alternativeOwner}` : "";
      }
      if (owningUnit !== undefined) {
        project.owningUnitId = owningUnit;
        project.owningUnit = `Unit #${owningUnit}`; // TODO: Get actual unit name
      }
      if (analysts !== undefined) {
        project.analystIds = analysts;
        project.analysts = analysts.length > 0 
          ? analysts.map((id: number) => `User #${id}`).join(", ")
          : "";
      }
      if (startDate !== undefined) project.startDate = startDate;
      if (expectedCompletionDate !== undefined) project.expectedCompletionDate = expectedCompletionDate;
      if (description !== undefined) project.description = description;
      if (remarks !== undefined) project.remarks = remarks;
      if (status !== undefined) project.status = status;
      
      project.updatedAt = new Date().toISOString();

      logger.info(`Updated project ${projectId}: ${project.applicationName}`);

      res.json({
        success: true,
        data: project,
        message: "Project updated successfully",
      });
    } catch (error) {
      logger.error("Error updating project:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.id);
      const index = mockProjects.findIndex((p) => p.id === projectId);

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const deletedProject = mockProjects[index];
      mockProjects.splice(index, 1);

      logger.info(`Deleted project ${projectId}: ${deletedProject.applicationName}`);

      res.json({
        success: true,
        data: deletedProject,
        message: "Project deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting project:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send project for review
   */
  async sendProject(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.id);
      const project = mockProjects.find((p) => p.id === projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      // Update project status to under review (3)
      project.status = 3;
      project.updatedAt = new Date().toISOString();

      // Get analyst usernames from the project's analystIds
      const analystUsernames: string[] = [];
      if (project.analystIds && project.analystIds.length > 0) {
        project.analystIds.forEach((analystId) => {
          const analyst = mockUsers.find((user) => user.id === analystId);
          if (analyst) {
            analystUsernames.push(analyst.userName);
          }
        });
      }

      // Send notification to specific analysts and project owner
      const targetUsernames = [...analystUsernames];
      
      // Also notify project owner if we have their info
      const projectOwner = mockUsers.find((user) => user.id === project.projectOwnerId);
      if (projectOwner) {
        targetUsernames.push(projectOwner.userName);
      }

      sendNotification({
        type: "PROJECT_SENT_FOR_REVIEW",
        message: `Project "${project.applicationName}" has been sent for review`,
        projectId: project.id,
        targetUsernames: targetUsernames.length > 0 ? targetUsernames : undefined,
      });

      logger.info(
        `Project ${projectId} sent for review: ${project.applicationName}. Notified users: ${targetUsernames.join(", ")}`
      );

      res.json({
        success: true,
        data: project,
        message: "Project sent for review successfully",
      });
    } catch (error) {
      logger.error("Error sending project for review:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
