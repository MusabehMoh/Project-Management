/* eslint-disable no-console */
import { useState, useEffect, useCallback, useRef } from "react";

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
  const [unreadCountState, setUnreadCountState] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Load initial notifications from API
  const loadNotifications = useCallback(async () => {
    try {
      console.log("Loading notifications from API...");
      // Always request first page explicitly; some backends require page param
      const response = await notificationService.getNotifications({
        page: 1,
        limit: 50,
      });

      console.log("API response:", response);

      if (response.success && response.data) {
        // Some backends might wrap data differently; handle a few shapes defensively.
        // Normal expected: response.data.notifications
        // Fallbacks tried if empty: response.data.data?.notifications or response.data.items
        const rawContainer: any = response.data as any;
        let rawList: ApiNotification[] = [];

        if (Array.isArray(rawContainer.notifications)) {
          rawList = rawContainer.notifications;
        } else if (
          rawContainer.data &&
          Array.isArray(rawContainer.data.notifications)
        ) {
          rawList = rawContainer.data.notifications;
        } else if (Array.isArray(rawContainer.items)) {
          rawList = rawContainer.items; // generic fallback key
        }

        const apiNotifications = rawList.map((apiNotif: ApiNotification) => ({
          id: apiNotif.id,
          type: apiNotif.type,
          message: apiNotif.message,
          timestamp: new Date(apiNotif.timestamp),
          // Support alternative backend field names like isRead
          read: (apiNotif as any).read ?? (apiNotif as any).isRead ?? false,
          projectId: apiNotif.projectId,
          targetUsernames: apiNotif.targetUsernames,
        }));

        console.log("Processed notifications (parsed):", apiNotifications);
        setNotifications(apiNotifications);
        // Prefer unreadCount from API if provided (more accurate server-side)
        const apiUnread = (rawContainer.unreadCount ??
          rawContainer.data?.unreadCount) as number | undefined;

        if (typeof apiUnread === "number") {
          setUnreadCountState(apiUnread);
        } else {
          setUnreadCountState(apiNotifications.filter((n) => !n.read).length);
        }

        // Fallback: if server reports unread > 0 but we received no notifications, try unread-only fetch
        if (apiNotifications.length === 0 && (apiUnread ?? 0) > 0) {
          console.warn(
            "Unread count > 0 but notifications list empty; attempting unread-only fallback fetch",
          );
          try {
            const retry = await notificationService.getNotifications({
              page: 1,
              limit: Math.min(50, (apiUnread as number) || 50),
              unreadOnly: true,
            });

            if (retry.success && retry.data?.notifications?.length) {
              const retryList = retry.data.notifications.map(
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

              console.log("Fallback fetched notifications:", retryList);

              setNotifications(retryList);
              setUnreadCountState(retryList.filter((n) => !n.read).length);
            }
          } catch (fallbackErr) {
            console.error("Fallback unread-only fetch failed", fallbackErr);
          }
        }
      } else {
        console.log("Failed to load notifications", response.message);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send test push notification on page load
  const sendTestNotification = useCallback(async () => {
    try {
      console.log("Sending test push notification...");
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/notifications/test-push`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        console.log("Test push notification sent successfully");
      } else {
        console.error("Failed to send test push notification");
      }
    } catch (error) {
      console.error("Error sending test push notification:", error);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    sendTestNotification();

    if (!API_CONFIG.ENABLE_SIGNALR) {
      console.log("WebSocket disabled via VITE_ENABLE_SIGNALR flag");
      setIsConnected(false);

      return;
    }

    const currentUser = localStorage.getItem("currentUser");
    const user = currentUser ? JSON.parse(currentUser) : null;
    const username = user?.username || "anonymous";
    const userId = user?.id ?? null;

    // Create WebSocket connection
    const ws = new WebSocket(
      `${API_CONFIG.WS_URL}?username=${encodeURIComponent(username)}&userId=${
        userId || ""
      }`,
    );

    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const notificationData = JSON.parse(event.data);
        const newNotification: Notification = {
          id: `${Date.now()}-${Math.random()}`,
          type: notificationData.type || "UNKNOWN",
          message: notificationData.message || "",
          timestamp: new Date(notificationData.timestamp || Date.now()),
          read: false,
          projectId: notificationData.projectId,
          targetUsernames: notificationData.targetUsernames,
        };

        setNotifications((prev) => {
          const updated = [newNotification, ...prev.slice(0, 49)];

          setUnreadCountState((c) => c + 1);

          return updated;
        });

        console.log("Notification received:", newNotification.type);
      } catch (err) {
        console.error("Error processing WebSocket notification", err);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed", event.code, event.reason);
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error", error);
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [loadNotifications, sendTestNotification]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));

      setUnreadCountState(updated.filter((n) => !n.read).length);

      return updated;
    });
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setNotifications((prev) => {
        const reverted = prev.map((n) =>
          n.id === id ? { ...n, read: false } : n,
        );

        setUnreadCountState(reverted.filter((n) => !n.read).length);

        return reverted;
      });
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));

      setUnreadCountState(0);

      return updated;
    });
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      loadNotifications();
    }
  }, [loadNotifications]);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Prefer server-provided unread count state (kept in sync with local changes)
  // If we actually have the list, prefer deriving from it (guards against stale server count)
  const derivedUnread = notifications.length
    ? notifications.filter((n) => !n.read).length
    : unreadCountState;
  const unreadCount = derivedUnread;

  // Expose for manual debugging in browser console (no side effects in prod build tree-shaken)
  if (typeof window !== "undefined") {
    (window as any).__NOTIFICATIONS_DEBUG__ = {
      notifications,
      unreadCount,
      isConnected,
    };
  }

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
