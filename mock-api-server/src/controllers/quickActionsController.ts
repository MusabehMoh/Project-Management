import { Request, Response } from "express";

import { logger } from "../utils/logger.js";
import { mockDelayHandler } from "../utils/mockDelay.js";
import {
  mockQuickActionsData,
  mockQuickActionStats,
  mockOverdueItems,
  mockPendingApprovals,
  mockTeamMembers,
} from "../data/mockQuickActions.js";
import { mockProjects } from "../data/mockProjects.js";
import { sendNotification } from "../signalR/notificationHub.js";

export class QuickActionsController {
  /**
   * Get all quick actions data
   */
  async getQuickActions(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      logger.info("Fetching quick actions data");

      const responseData = {
        ...mockQuickActionsData,
        lastUpdated: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      logger.error("Error fetching quick actions:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch quick actions",
          code: "QUICK_ACTIONS_ERROR",
        },
      });
    }
  }

  /**
   * Get quick action statistics
   */
  async getQuickActionStats(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      logger.info("Fetching quick action statistics");

      res.status(200).json({
        success: true,
        data: mockQuickActionStats,
      });
    } catch (error) {
      logger.error("Error fetching quick action stats:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch statistics",
          code: "STATS_ERROR",
        },
      });
    }
  }

  /**
   * Get overdue items
   */
  async getOverdueItems(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      logger.info("Fetching overdue items");

      res.status(200).json({
        success: true,
        data: mockOverdueItems,
      });
    } catch (error) {
      logger.error("Error fetching overdue items:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch overdue items",
          code: "OVERDUE_ERROR",
        },
      });
    }
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      logger.info("Fetching pending approvals");

      res.status(200).json({
        success: true,
        data: mockPendingApprovals,
      });
    } catch (error) {
      logger.error("Error fetching pending approvals:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch pending approvals",
          code: "APPROVALS_ERROR",
        },
      });
    }
  }

  /**
   * Get team members
   */
  async getTeamMembers(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      logger.info("Fetching team members");

      res.status(200).json({
        success: true,
        data: mockTeamMembers,
      });
    } catch (error) {
      logger.error("Error fetching team members:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch team members",
          code: "TEAM_ERROR",
        },
      });
    }
  }

  /**
   * Get unassigned projects
   */
  async getUnassignedProjects(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      logger.info("Fetching unassigned projects");

      // Filter projects that have no analysts assigned
      const unassignedProjects = mockProjects
        .filter(project => !project.analystIds || project.analystIds.length === 0)
        .map(project => ({
          id: project.id,
          applicationName: project.applicationName,
          projectOwner: project.projectOwner,
          owningUnit: project.owningUnit,
          priority: project.priority,
          status: project.status,
        }));

      res.status(200).json({
        success: true,
        data: unassignedProjects,
      });
    } catch (error) {
      logger.error("Error fetching unassigned projects:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch unassigned projects",
          code: "UNASSIGNED_PROJECTS_ERROR",
        },
      });
    }
  }

  /**
   * Approve status change
   */
  async approveStatusChange(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const { id } = req.params;
      const { approved, comments } = req.body;

      logger.info(`Approving status change for ID: ${id}`, {
        approved,
        comments,
      });

      // Find the pending approval
      const approvalIndex = mockPendingApprovals.findIndex(
        (approval) => approval.id === parseInt(id),
      );

      if (approvalIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Approval request not found",
            code: "NOT_FOUND",
          },
        });
      }

      const approval = mockPendingApprovals[approvalIndex];

      if (approved) {
        // Remove from pending approvals
        mockPendingApprovals.splice(approvalIndex, 1);

        // Update stats
        mockQuickActionStats.pendingApprovals =
          Math.max(0, mockQuickActionStats.pendingApprovals - 1);

        // Send notification
        await sendNotification("approval_processed", {
          title: "Status Change Approved",
          message: `${approval.title} has been approved`,
          approvalId: id,
          approved: true,
          comments,
        });

        logger.info(`Status change approved for: ${approval.title}`);
      } else {
        // Send rejection notification
        await sendNotification("approval_processed", {
          title: "Status Change Rejected",
          message: `${approval.title} has been rejected`,
          approvalId: id,
          approved: false,
          comments,
        });

        logger.info(`Status change rejected for: ${approval.title}`);
      }

      res.status(200).json({
        success: true,
        data: {
          message: approved
            ? "Status change approved successfully"
            : "Status change rejected successfully",
        },
      });
    } catch (error) {
      logger.error("Error processing approval:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to process approval",
          code: "APPROVAL_ERROR",
        },
      });
    }
  }

  /**
   * Assign task to team member
   */
  async assignTask(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const { taskId } = req.params;
      const { assigneeId, priority } = req.body;

      logger.info(`Assigning task ${taskId} to user ${assigneeId}`, {
        priority,
      });

      // Find team member
      const teamMember = mockTeamMembers.find(
        (member) => member.id === assigneeId,
      );

      if (!teamMember) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Team member not found",
            code: "MEMBER_NOT_FOUND",
          },
        });
      }

      // Update team member workload
      teamMember.currentTasks += 1;
      if (teamMember.currentTasks >= 5) {
        teamMember.workload = "high";
        teamMember.availability = "busy";
      } else if (teamMember.currentTasks >= 3) {
        teamMember.workload = "medium";
      }

      // Update stats
      mockQuickActionStats.unassignedTasks =
        Math.max(0, mockQuickActionStats.unassignedTasks - 1);

      // Send notification
      await sendNotification("task_assigned", {
        title: "New Task Assigned",
        message: `A new task has been assigned to ${teamMember.name}`,
        taskId,
        assigneeId,
        assigneeName: teamMember.name,
        priority,
      });

      logger.info(`Task assigned successfully to: ${teamMember.name}`);

      res.status(200).json({
        success: true,
        data: {
          message: `Task assigned to ${teamMember.name} successfully`,
          assignee: teamMember,
        },
      });
    } catch (error) {
      logger.error("Error assigning task:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to assign task",
          code: "ASSIGNMENT_ERROR",
        },
      });
    }
  }

  /**
   * Dismiss an action
   */
  async dismissAction(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      const { actionId } = req.params;

      logger.info(`Dismissing action: ${actionId}`);

      // In a real implementation, you would mark the action as dismissed
      // For now, we'll just log it and return success

      res.status(200).json({
        success: true,
        data: {
          message: "Action dismissed successfully",
        },
      });
    } catch (error) {
      logger.error("Error dismissing action:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to dismiss action",
          code: "DISMISS_ERROR",
        },
      });
    }
  }

  /**
   * Refresh quick actions data
   */
  async refreshActions(req: Request, res: Response) {
    await mockDelayHandler();

    try {
      logger.info("Refreshing quick actions data");

      // Simulate data refresh by updating timestamp
      const responseData = {
        ...mockQuickActionsData,
        lastUpdated: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      logger.error("Error refreshing actions:", error);
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to refresh actions",
          code: "REFRESH_ERROR",
        },
      });
    }
  }
}