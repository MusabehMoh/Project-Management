import { apiClient } from "./api/client";

import { ApiResponse } from "@/types/project";
import { apiCache } from "@/utils/apiCache";

export interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
  projectId?: number;
  targetUsernames?: string[];
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export interface CreateNotificationRequest {
  type: string;
  message: string;
  projectId?: number;
  targetUsernames?: string[];
  userId?: number;
}

export interface UpdateNotificationRequest {
  id: string;
  type?: string;
  message?: string;
  read?: boolean;
  projectId?: number;
  targetUsernames?: string[];
}

// Notification API endpoints
const ENDPOINTS = {
  NOTIFICATIONS: "/notifications",
  NOTIFICATION_BY_ID: (id: string) => `/notifications/${id}`,
  MARK_AS_READ: (id: string) => `/notifications/${id}/read`,
  MARK_ALL_AS_READ: "/notifications/read-all",
  UNREAD_COUNT: "/notifications/unread-count",
} as const;

// Notification API Service Class
export class NotificationApiService {
  /**
   * Get notifications for the current user (with caching)
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<NotificationsResponse>> {
    const cacheKey = apiCache.generateKey("notifications", params);

    return apiCache.getOrFetch(cacheKey, () => {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.unreadOnly) queryParams.append("unreadOnly", "true");

      const endpoint = queryParams.toString()
        ? `${ENDPOINTS.NOTIFICATIONS}?${queryParams.toString()}`
        : ENDPOINTS.NOTIFICATIONS;

      return apiClient.get<NotificationsResponse>(endpoint);
    });
  }

  /**
   * Get unread notifications count (with caching)
   */
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    const cacheKey = apiCache.generateKey("unread-count");

    return apiCache.getOrFetch(cacheKey, () =>
      apiClient.get<{ count: number }>(ENDPOINTS.UNREAD_COUNT),
    );
  }

  /**
   * Create a new notification
   */
  async createNotification(
    data: CreateNotificationRequest,
  ): Promise<ApiResponse<Notification>> {
    const result = await apiClient.post<Notification>(
      ENDPOINTS.NOTIFICATIONS,
      data,
    );

    if (result.success) {
      // Invalidate related caches
      apiCache.invalidate("notifications");
      apiCache.invalidate("unread-count");
    }

    return result;
  }

  /**
   * Get notification by ID
   */
  async getNotification(id: string): Promise<ApiResponse<Notification>> {
    return apiClient.get<Notification>(ENDPOINTS.NOTIFICATION_BY_ID(id));
  }

  /**
   * Update notification
   */
  async updateNotification(
    data: UpdateNotificationRequest,
  ): Promise<ApiResponse<Notification>> {
    const result = await apiClient.put<Notification>(
      ENDPOINTS.NOTIFICATION_BY_ID(data.id),
      data,
    );

    if (result.success) {
      // Invalidate related caches
      apiCache.invalidate("notifications");
      apiCache.invalidate("unread-count");
    }

    return result;
  }

  /**
   * Mark a notification as read (invalidate cache on success)
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    const result = await apiClient.patch<Notification>(
      ENDPOINTS.MARK_AS_READ(notificationId),
    );

    if (result.success) {
      // Invalidate related caches
      apiCache.invalidate("notifications");
      apiCache.invalidate("unread-count");
    }

    return result;
  }

  /**
   * Mark all notifications as read (invalidate cache on success)
   */
  async markAllAsRead(): Promise<ApiResponse<{ message: string }>> {
    const result = await apiClient.patch<{ message: string }>(
      ENDPOINTS.MARK_ALL_AS_READ,
    );

    if (result.success) {
      // Invalidate related caches
      apiCache.invalidate("notifications");
      apiCache.invalidate("unread-count");
    }

    return result;
  }

  /**
   * Delete a notification (invalidate cache on success)
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    const result = await apiClient.delete<void>(
      ENDPOINTS.NOTIFICATION_BY_ID(notificationId),
    );

    if (result.success) {
      // Invalidate related caches
      apiCache.invalidate("notifications");
      apiCache.invalidate("unread-count");
    }

    return result;
  }
}

// Create and export notification API instance
export const notificationApi = new NotificationApiService();

// Service class for notification operations (legacy support)
export class NotificationService extends NotificationApiService {
  // This class extends NotificationApiService for backward compatibility
  // You can add any legacy methods here if needed
}

export const notificationService = new NotificationService();
