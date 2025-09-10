import { Request, Response } from "express";

import { logger } from "../utils/logger.js";

// Mock notifications storage (in a real app, this would be a database)
const mockNotifications: Array<{
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
  projectId?: number;
  targetUsernames?: string[];
  userId?: number;
}> = [
  {
    id: "1",
    type: "PROJECT_SENT_FOR_REVIEW",
    message: "Project 'Sample Application' has been sent for review",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: false,
    projectId: 1,
    targetUsernames: ["john.doe", "jane.smith"],
    userId: 1,
  },
  {
    id: "2",
    type: "PROJECT_STATUS_UPDATED",
    message: "Project 'Mobile App' status updated to Under Development",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    read: false,
    projectId: 2,
    targetUsernames: ["john.doe"],
    userId: 1,
  },
  {
    id: "3",
    type: "PROJECT_ASSIGNED",
    message: "You have been assigned to project 'Web Portal'",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: true,
    projectId: 3,
    targetUsernames: ["john.doe"],
    userId: 1,
  },
];

export class NotificationsController {
  /**
   * Get notifications for the current user
   */
  async getNotifications(req: Request, res: Response) {
    try {
      // In a real application, you would get the user ID from authentication
      // For now, we'll use a mock user ID
      const userId = 1; // This should come from auth middleware
      const { page = 1, limit = 50, unreadOnly = false } = req.query;

      // Filter notifications for the current user
      let userNotifications = mockNotifications.filter(
        (notification) =>
          notification.userId === userId ||
          (notification.targetUsernames &&
            notification.targetUsernames.includes("john.doe")),
      );

      // Filter by read status if requested
      if (unreadOnly === "true") {
        userNotifications = userNotifications.filter((n) => !n.read);
      }

      // Sort by timestamp (newest first)
      userNotifications.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedNotifications = userNotifications.slice(
        startIndex,
        endIndex,
      );

      const unreadCount = userNotifications.filter((n) => !n.read).length;

      logger.info(
        `Retrieved ${paginatedNotifications.length} notifications for user ${userId}`,
      );

      res.json({
        success: true,
        data: {
          notifications: paginatedNotifications,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: userNotifications.length,
            totalPages: Math.ceil(userNotifications.length / limitNum),
          },
          unreadCount,
        },
      });
    } catch (error) {
      logger.error("Error retrieving notifications:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req: Request, res: Response) {
    try {
      const { notificationId } = req.params;
      const userId = 1; // This should come from auth middleware

      const notification = mockNotifications.find(
        (n) =>
          n.id === notificationId &&
          (n.userId === userId ||
            (n.targetUsernames && n.targetUsernames.includes("john.doe"))),
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      notification.read = true;

      logger.info(
        `Marked notification ${notificationId} as read for user ${userId}`,
      );

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = 1; // This should come from auth middleware

      // Mark all user notifications as read
      const userNotifications = mockNotifications.filter(
        (notification) =>
          notification.userId === userId ||
          (notification.targetUsernames &&
            notification.targetUsernames.includes("john.doe")),
      );

      userNotifications.forEach((notification) => {
        notification.read = true;
      });

      logger.info(`Marked all notifications as read for user ${userId}`);

      res.json({
        success: true,
        message: `Marked ${userNotifications.length} notifications as read`,
      });
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(req: Request, res: Response) {
    try {
      const { notificationId } = req.params;
      const userId = 1; // This should come from auth middleware

      const index = mockNotifications.findIndex(
        (n) =>
          n.id === notificationId &&
          (n.userId === userId ||
            (n.targetUsernames && n.targetUsernames.includes("john.doe"))),
      );

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      const deletedNotification = mockNotifications.splice(index, 1)[0];

      logger.info(`Deleted notification ${notificationId} for user ${userId}`);

      res.json({
        success: true,
        data: deletedNotification,
      });
    } catch (error) {
      logger.error("Error deleting notification:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Add a new notification (used internally by other controllers)
   */
  static addNotification(notification: {
    type: string;
    message: string;
    projectId?: number;
    targetUsernames?: string[];
    userId?: number;
  }) {
    const newNotification = {
      id: (mockNotifications.length + 1).toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };

    mockNotifications.unshift(newNotification); // Add to beginning

    // Keep only the latest 100 notifications
    if (mockNotifications.length > 100) {
      mockNotifications.splice(100);
    }

    logger.info(`Added new notification: ${notification.type}`);

    return newNotification;
  }
}
