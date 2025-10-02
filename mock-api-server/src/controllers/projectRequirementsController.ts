import { Request, Response } from "express";

import { logger } from "../utils/logger.js";
import { mockProjectRequirements } from "../data/mockProjectRequirements.js";
import { mockProjects } from "../data/mockProjects.js";
import { mockUsers } from "../data/mockUsers.js";
import { sendNotification } from "../signalR/notificationHub.js";
import { mockTimelines } from "../data/mockTimelines.js";
import { mockRequirementTasks } from "../data/mockRequirementTasks.js";

export class ProjectRequirementsController {
  /**
   * Get team workload and performance metrics
   */
  async getTeamWorkloadPerformance(req: Request, res: Response) {
    try {
      // Calculate workload and performance for each user who has created requirements
      const teamMetrics = mockUsers
        .filter((user) => user.isVisible)
        .map((user) => {
          // Get requirements created by this user
          const userRequirements = mockProjectRequirements.filter(
            (req) => req.createdBy === user.id,
          );

          // Calculate metrics
          const totalRequirements = userRequirements.length;
          const draftRequirements = userRequirements.filter(
            (req) => req.status === "draft",
          ).length;
          const approvedRequirements = userRequirements.filter(
            (req) => req.status === "approved",
          ).length;
          const inProgressRequirements = userRequirements.filter(
            (req) => req.status === "in-development",
          ).length;
          const completedRequirements = userRequirements.filter(
            (req) => req.status === "completed",
          ).length;

          // Calculate performance score (completion rate + timeliness factor)
          const completionRate =
            totalRequirements > 0
              ? (completedRequirements / totalRequirements) * 100
              : 0;

          // Mock timeliness factor (in real app, this would be based on expected vs actual completion dates)
          const timelinessScore = Math.random() * 20 + 80; // Random score between 80-100

          // Overall performance (70% completion rate + 30% timeliness)
          const performanceScore = Math.round(
            completionRate * 0.7 + timelinessScore * 0.3,
          );

          // Calculate busy until date (if busy)
          const isBusy = inProgressRequirements > 2;
          let busyUntil;

          if (isBusy) {
            // Mock: Add 1-7 days from now based on workload
            const daysToAdd = Math.ceil(inProgressRequirements / 2); // More requirements = longer busy period

            busyUntil = new Date(
              Date.now() + daysToAdd * 24 * 60 * 60 * 1000,
            ).toISOString();
          }

          return {
            userId: user.id,
            fullName: user.fullName,
            department: user.department,
            gradeName: user.gradeName,
            busyStatus: isBusy ? "busy" : "available",
            busyUntil: busyUntil,
            metrics: {
              totalRequirements,
              draft: draftRequirements,
              approved: approvedRequirements,
              inProgress: inProgressRequirements,
              completed: completedRequirements,
              performance: Math.min(performanceScore, 100), // Cap at 100%
            },
          };
        })
        .filter((user) => user.metrics.totalRequirements > 0) // Only include users with requirements
        .sort((a, b) => b.metrics.performance - a.metrics.performance); // Sort by performance desc

      logger.info(
        `Retrieved team workload performance for ${teamMetrics.length} team members`,
      );

      res.json({
        success: true,
        data: teamMetrics,
        message: "Team workload performance retrieved successfully",
      });
    } catch (error) {
      logger.error("Error getting team workload performance:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

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
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        search,
        projectId: qProjectId,
      } = req.query;

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
      const {
        name,
        description,
        priority,
        type,
        expectedCompletionDate,
        attachments,
      } = req.body;
      const currentUserId = parseInt(req.query.userId as string) || 1; // Default user

      // Validate required fields
      if (
        !name ||
        !description ||
        !priority ||
        !type ||
        !expectedCompletionDate
      ) {
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
            message:
              "Invalid requirement type. Must be 'new' or 'change request'",
            code: "VALIDATION_ERROR",
          },
        });
      }

      // Find the project to get project info
      const project = mockProjects.find((p) => p.id === parseInt(projectId));

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
        id: Math.max(...mockProjectRequirements.map((r) => r.id), 0) + 1,
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
          owningUnit: project.owningUnit,
        },
        attachments: [],
      };

      mockProjectRequirements.push(newRequirement);

      logger.info(
        `Created new requirement: ${newRequirement.name} (type: ${type}) for project ${projectId}`,
      );

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
   * Create a task for a specific requirement (stores a lightweight RequirementTask)
   */
  async createTask(req: Request, res: Response) {
    try {
      const { requirementId } = req.params;
      const { developerId, qcId } = req.body as {
        developerId?: number;
        qcId?: number;
      };

      const requirement = mockProjectRequirements.find(
        (r) => r.id === parseInt(requirementId),
      );

      if (!requirement) {
        return res.status(404).json({
          success: false,
          error: { message: "Requirement not found", code: "NOT_FOUND" },
        });
      }

      // Create a simple RequirementTask object and attach to requirement
      const newTaskId =
        Math.max(
          0,
          ...mockProjectRequirements.flatMap((r) =>
            r.task ? [r.task.id] : [],
          ),
        ) + 1;

      const now = new Date().toISOString();

      const task = {
        id: newTaskId,
        requirementId: requirement.id,
        developerId: developerId || undefined,
        developerName: developerId
          ? requirement.project?.analysts
            ? undefined
            : undefined
          : undefined,
        qcId: qcId || undefined,
        qcName: qcId ? undefined : undefined,
        status: "not-started",
        createdAt: now,
        updatedAt: now,
        createdBy: parseInt(req.query.userId as string) || 1,
      };

      // Attach task to requirement
      (requirement as any).task = task;

      // Notify stakeholders (if any)
      try {
        sendNotification({
          type: "REQUIREMENT_TASK_CREATED",
          message: `Task created for requirement \"${requirement.name}\"`,
          projectId: requirement.projectId,
        });
      } catch (notifyErr) {
        logger.warn(
          "Failed to send notification for requirement task creation",
          notifyErr,
        );
      }

      logger.info(`Created task ${task.id} for requirement ${requirement.id}`);

      res
        .status(201)
        .json({ success: true, data: task, message: "Task created" });
    } catch (error) {
      logger.error("Error creating requirement task:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  /**
   * Update an existing requirement
   */
  async updateRequirement(req: Request, res: Response) {
    try {
      const { requirementId } = req.params;
      const {
        name,
        description,
        priority,
        type,
        expectedCompletionDate,
        status,
      } = req.body;

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
            message:
              "Invalid requirement type. Must be 'new' or 'change request'",
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
      if (expectedCompletionDate !== undefined)
        requirement.expectedCompletionDate = expectedCompletionDate;
      if (status !== undefined) requirement.status = status;

      requirement.updatedAt = new Date().toISOString();

      logger.info(
        `Updated requirement ${requirementId}: ${requirement.name} (type: ${requirement.type})`,
      );

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
   * Update requirement status only
   */
  async updateRequirementStatus(req: Request, res: Response) {
    try {
      const { requirementId } = req.params;
      const { status } = req.body;

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

      // Update only the status
      mockProjectRequirements[requirementIndex].status = status;
      mockProjectRequirements[requirementIndex].updatedAt =
        new Date().toISOString();

      const requirement = mockProjectRequirements[requirementIndex];

      res.status(200).json({
        success: true,
        data: requirement,
        message: "Requirement status updated successfully",
      });
    } catch (error) {
      logger.error("Error updating requirement status:", error);
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
      const requirement = mockProjectRequirements.find(
        (r) => r.id === parseInt(requirementId),
      );

      if (!requirement) {
        return res.status(404).json({
          success: false,
          message: "Requirement not found",
        });
      }

      // Update requirement status to approved (sent to development manager)
      requirement.status = "approved";
      requirement.updatedAt = new Date().toISOString();

      // Send notification to development managers and project stakeholders
      const targetUsernames: string[] = [];

      // Add project owner to notifications
      const project = mockProjects.find((p) => p.id === requirement.projectId);

      if (project) {
        const projectOwner = mockUsers.find(
          (user) => user.id === project.projectOwnerId,
        );

        if (projectOwner) {
          targetUsernames.push(projectOwner.userName);
        }
      }

      // Send notification
      sendNotification({
        type: "REQUIREMENT_SENT_FOR_DEVELOPMENT",
        message: `Requirement "${requirement.name}" has been sent for development review`,
        projectId: requirement.projectId,
        targetUsernames:
          targetUsernames.length > 0 ? targetUsernames : undefined,
      });

      logger.info(
        `Requirement ${requirementId} sent for development: ${requirement.name}. Notified users: ${targetUsernames.join(", ")}`,
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
   * Start development on an approved requirement
   */
  async startDevelopment(req: Request, res: Response): Promise<void> {
    try {
      const { requirementId } = req.params;

      // Find the requirement
      const requirement = mockProjectRequirements.find(
        (req) => req.id === parseInt(requirementId),
      );

      if (!requirement) {
        res.status(404).json({
          success: false,
          message: "Requirement not found",
        });

        return;
      }

      // Check if requirement is approved
      if (requirement.status !== "approved") {
        res.status(400).json({
          success: false,
          message: "Only approved requirements can be started for development",
        });

        return;
      }

      // Update requirement status to in-development
      requirement.status = "in-development";
      requirement.updatedAt = new Date().toISOString();

      // Send notification to project stakeholders
      const targetUsernames: string[] = [];

      // Add project owner to notifications
      const project = mockProjects.find((p) => p.id === requirement.projectId);

      if (project) {
        const projectOwner = mockUsers.find(
          (u) => u.userName === project.projectOwner,
        );

        if (projectOwner) {
          targetUsernames.push(projectOwner.userName);
        }

        // Add assigned analysts to notifications
        if (project.analystIds && project.analystIds.length > 0) {
          const analysts = mockUsers.filter((u) =>
            project.analystIds!.includes(u.id),
          );

          targetUsernames.push(...analysts.map((a) => a.userName));
        }
      }

      // Send notification
      sendNotification({
        type: "REQUIREMENT_DEVELOPMENT_STARTED",
        message: `Development has started for requirement "${requirement.name}"`,
        projectId: requirement.projectId,
        targetUsernames:
          targetUsernames.length > 0 ? targetUsernames : undefined,
      });

      logger.info(
        `Development started for requirement ${requirementId}: ${requirement.name}. Notified users: ${targetUsernames.join(", ")}`,
      );

      res.json({
        success: true,
        data: requirement,
        message: "Development started successfully",
      });
    } catch (error) {
      logger.error("Error starting development:", error);
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
        (r) => r.id === parseInt(requirementId),
      );

      if (requirementIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Requirement not found",
        });
      }

      const deletedRequirement = mockProjectRequirements[requirementIndex];

      mockProjectRequirements.splice(requirementIndex, 1);

      logger.info(
        `Deleted requirement ${requirementId}: ${deletedRequirement.name}`,
      );

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
        (req) => req.projectId === parseInt(projectId),
      );

      const stats = {
        total: projectRequirements.length,
        draft: projectRequirements.filter((r) => r.status === "draft").length,
        approved: projectRequirements.filter((r) => r.status === "approved")
          .length,
        inDevelopment: projectRequirements.filter(
          (r) => r.status === "in-development",
        ).length,
        completed: projectRequirements.filter((r) => r.status === "completed")
          .length,
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

  /**
   * Get all requirements with status "in development"
   */
  async getDevelopmentRequirements(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        search,
        projectId: qProjectId,
      } = req.query;

      // Filter requirements with status "in-development"
      let filteredRequirements = mockProjectRequirements.filter(
        (req) => req.status === "in-development" || req.status === "approved",
      );

      // Apply additional filters
      if (qProjectId) {
        const pid = Number(qProjectId);

        filteredRequirements = filteredRequirements.filter(
          (r) =>
            // support both top-level projectId and nested project object
            (r as any).projectId === pid || (r.project && r.project.id === pid),
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

      // Sort requirements: approved first, then in-development
      filteredRequirements.sort((a, b) => {
        if (a.status === "approved" && b.status !== "approved") return -1;
        if (a.status !== "approved" && b.status === "approved") return 1;

        // If both have same status priority, sort by creation date (newest first)
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      // Apply pagination
      const startIndex = ((page as number) - 1) * (limit as number);
      const endIndex = startIndex + (limit as number);
      const paginatedRequirements = filteredRequirements.slice(
        startIndex,
        endIndex,
      );

      // Add timeline and task information to each requirement
      const requirementsWithTimelines = paginatedRequirements.map(
        (requirement) => {
          // Find timeline for this requirement
          const timeline = mockTimelines.find(
            (t) => t.projectRequirementId === requirement.id,
          );

          // Find task for this requirement
          const task = mockRequirementTasks.find(
            (t) => t.requirementId === requirement.id,
          );

          return {
            ...requirement,
            timeline: timeline
              ? { id: timeline.id, name: timeline.name }
              : undefined,
            task: task || requirement.task,
          };
        },
      );

      logger.info(
        `Retrieved ${paginatedRequirements.length} development requirements`,
      );

      res.json({
        success: true,
        data: requirementsWithTimelines,
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
      logger.error("Error getting development requirements:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get all requirements with status "draft"
   */
  async getDraftRequirements(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        priority,
        search,
        projectId: qProjectId,
      } = req.query;

      // Filter requirements with status "draft"
      let filteredRequirements = mockProjectRequirements.filter(
        (req) => req.status === "draft",
      );

      // Apply additional filters
      if (qProjectId) {
        const pid = Number(qProjectId);

        filteredRequirements = filteredRequirements.filter(
          (r) =>
            (r as any).projectId === pid || (r.project && r.project.id === pid),
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

      // Sort requirements by creation date (newest first)
      filteredRequirements.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      // Apply pagination
      const startIndex = ((page as number) - 1) * (limit as number);
      const endIndex = startIndex + (limit as number);
      const paginatedRequirements = filteredRequirements.slice(
        startIndex,
        endIndex,
      );

      logger.info(
        `Retrieved ${paginatedRequirements.length} draft requirements`,
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
      logger.error("Error getting draft requirements:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Upload attachment for a requirement (mock implementation)
   */
  async uploadAttachment(req: Request, res: Response) {
    try {
      const { requirementId } = req.params;
      const currentUserId = parseInt(req.query.userId as string) || 1;

      // Find the requirement
      const requirement = mockProjectRequirements.find(
        (r) => r.id === parseInt(requirementId),
      );

      if (!requirement) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Requirement not found",
            code: "NOT_FOUND",
          },
        });
      }

      // Mock file processing - in real implementation, would handle multipart/form-data
      // For now, we'll simulate with dummy data based on body
      const { files } = req.body as {
        files: Array<{ name: string; size: number; type: string }>;
      };

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: "No files provided",
            code: "VALIDATION_ERROR",
          },
        });
      }

      const uploadedAttachments = files.map((file, index) => {
        const newAttachmentId =
          Math.max(
            ...mockProjectRequirements.flatMap(
              (r) => r.attachments?.map((a) => a.id) || [],
            ),
            0,
          ) +
          index +
          1;

        return {
          id: newAttachmentId,
          requirementId: parseInt(requirementId),
          fileName: `${Date.now()}_${file.name}`,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUserId,
        };
      });

      // Add attachments to requirement
      if (!requirement.attachments) {
        requirement.attachments = [];
      }
      requirement.attachments.push(...uploadedAttachments);

      logger.info(
        `Uploaded ${uploadedAttachments.length} attachments for requirement ${requirementId}`,
      );

      res.status(201).json({
        success: true,
        data: uploadedAttachments,
        message: "Files uploaded successfully",
      });
    } catch (error) {
      logger.error("Error uploading attachment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delete attachment from a requirement
   */
  async deleteAttachment(req: Request, res: Response) {
    try {
      const { requirementId, attachmentId } = req.params;

      // Find the requirement
      const requirement = mockProjectRequirements.find(
        (r) => r.id === parseInt(requirementId),
      );

      if (!requirement) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Requirement not found",
            code: "NOT_FOUND",
          },
        });
      }

      if (!requirement.attachments) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Attachment not found",
            code: "NOT_FOUND",
          },
        });
      }

      const attachmentIndex = requirement.attachments.findIndex(
        (a) => a.id === parseInt(attachmentId),
      );

      if (attachmentIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Attachment not found",
            code: "NOT_FOUND",
          },
        });
      }

      // Remove attachment
      const deletedAttachment = requirement.attachments.splice(
        attachmentIndex,
        1,
      )[0];

      logger.info(
        `Deleted attachment ${attachmentId} from requirement ${requirementId}`,
      );

      res.json({
        success: true,
        data: deletedAttachment,
        message: "Attachment deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting attachment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Download attachment (mock implementation)
   */
  async downloadAttachment(req: Request, res: Response) {
    try {
      const { requirementId, attachmentId } = req.params;

      // Find the requirement and attachment
      const requirement = mockProjectRequirements.find(
        (r) => r.id === parseInt(requirementId),
      );

      if (!requirement || !requirement.attachments) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Requirement or attachment not found",
            code: "NOT_FOUND",
          },
        });
      }

      const attachment = requirement.attachments.find(
        (a) => a.id === parseInt(attachmentId),
      );

      if (!attachment) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Attachment not found",
            code: "NOT_FOUND",
          },
        });
      }

      // Mock download - in real implementation, would stream file
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${attachment.originalName}"`,
      );
      res.setHeader("Content-Type", attachment.mimeType);
      res.setHeader("Content-Length", attachment.fileSize.toString());

      // Send mock file content
      res.send(`Mock file content for ${attachment.originalName}`);

      logger.info(
        `Downloaded attachment ${attachmentId} from requirement ${requirementId}`,
      );
    } catch (error) {
      logger.error("Error downloading attachment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getApprovedRequirements(req: Request, res: Response) {
    try {
      const { page = "1", limit = "5" } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      // Get all approved requirements first
      const allApprovedRequirements = mockProjectRequirements.filter(
        (req) => req.status === "approved",
      );

      // Apply pagination
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedRequirements = allApprovedRequirements.slice(
        startIndex,
        startIndex + limitNum,
      );

      const totalCount = allApprovedRequirements.length;
      const totalPages = Math.ceil(totalCount / limitNum);

      return res.json({
        success: true,
        data: paginatedRequirements, // Return requirements directly in data
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: totalPages,
        },
      });
    } catch (error) {
      logger.error("Error fetching approved requirements:", error);

      return res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch approved requirements",
          code: "INTERNAL_SERVER_ERROR",
        },
      });
    }
  }
}
