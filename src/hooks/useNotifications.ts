/* eslint-disable no-console */
import { useState, useEffect, useCallback } from "react";

import {
  notificationService,
  Notification as ApiNotification,
} from "@/services/notificationService";
import { API_CONFIG } from "@/services/api/client";

export interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  read: boolean;
  projectId?: number;
  targetUsernames?: string[];
}

export interface UseNotifications {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  isConnected: boolean;
}

export function useNotifications(): UseNotifications {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [, setLoading] = useState(true);

  // Load initial notifications from API
  const loadNotifications = useCallback(async () => {
    try {
      console.log("Loading notifications from API...");
      const response = await notificationService.getNotifications({
        limit: 50,
      });

      console.log("API response:", response);

      if (response.success && response.data) {
        const apiNotifications = response.data.notifications.map(
          (apiNotif: ApiNotification) => ({
            id: apiNotif.id,
            type: apiNotif.type,
            message: apiNotif.message,
            timestamp: new Date(apiNotif.timestamp),
            read: apiNotif.read,
            projectId: apiNotif.projectId,
            targetUsernames: apiNotif.targetUsernames,
          }),
        );

        console.log("Processed notifications:", apiNotifications);
        setNotifications(apiNotifications);
      } else {
        console.log("Failed to load notifications:", response.message);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load initial notifications
    loadNotifications();

    // Get current user info (you might want to get this from a user context)
    const currentUser = localStorage.getItem("currentUser");
    const username = currentUser
      ? JSON.parse(currentUser).username
      : "anonymous";

    // Create WebSocket connection with authentication
    const ws = new WebSocket(`${API_CONFIG.WS_URL}?username=${username}`);

    ws.onopen = () => {
      console.log("Connected to notification server");
      setIsConnected(true);

      // Send authentication message
      ws.send(
        JSON.stringify({
          type: "authenticate",
          username: username,
          userId: currentUser ? JSON.parse(currentUser).id : null,
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const notificationData = JSON.parse(event.data);

        // Create a new notification object
        const newNotification: Notification = {
          id: `${Date.now()}-${Math.random()}`,
          type: notificationData.type,
          message: notificationData.message,
          timestamp: new Date(),
          read: false,
          projectId: notificationData.projectId,
          targetUsernames: notificationData.targetUsernames,
        };

        // Add to notifications list
        setNotifications((prev) => [newNotification, ...prev.slice(0, 49)]); // Keep only last 50 notifications

        // Handle different notification types
        switch (notificationData.type) {
          case "PROJECT_SENT_FOR_REVIEW":
            // You can add additional logic here like showing a toast
            console.log(
              "Project notification received:",
              notificationData.message,
            );
            break;
          default:
            console.log("Unknown notification type:", notificationData.type);
        }
      } catch (error) {
        console.error("Error processing notification:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("Disconnected from notification server", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      console.error("WebSocket readyState:", ws.readyState);
      console.error("WebSocket URL:", ws.url);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    // Update local state immediately for better UX
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );

    // Call API to persist the change
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Revert the change if API call fails
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: false }
            : notification,
        ),
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Update local state immediately
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );

    // Call API to persist the change
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // Reload notifications if API call fails
      loadNotifications();
    }
  }, [loadNotifications]);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    isConnected,
  };
}
