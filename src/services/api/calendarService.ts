import { apiClient } from "./client";

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  type: 'project' | 'requirement' | 'meeting' | 'deadline' | 'milestone';
  status: 'upcoming' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId?: number;
  requirementId?: number;
  assignedTo?: number[];
  location?: string;
  isAllDay?: boolean;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarFilters {
  startDate?: string;
  endDate?: string;
  types?: CalendarEvent['type'][];
  statuses?: CalendarEvent['status'][];
  priorities?: CalendarEvent['priority'][];
  projectIds?: number[];
  assignedTo?: number[];
}

export interface CalendarResponse {
  success: boolean;
  data: CalendarEvent[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

export interface CalendarStatsResponse {
  success: boolean;
  data: {
    totalEvents: number;
    upcomingEvents: number;
    overdueEvents: number;
    completedThisWeek: number;
    criticalDeadlines: number;
    eventsByType: Record<CalendarEvent['type'], number>;
    eventsByStatus: Record<CalendarEvent['status'], number>;
  };
  message: string;
}

// Calendar API service
export class CalendarService {
  /**
   * Get calendar events with optional filters
   */
  async getCalendarEvents(filters?: CalendarFilters): Promise<CalendarResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.types?.length) params.append('types', filters.types.join(','));
      if (filters?.statuses?.length) params.append('statuses', filters.statuses.join(','));
      if (filters?.priorities?.length) params.append('priorities', filters.priorities.join(','));
      if (filters?.projectIds?.length) params.append('projectIds', filters.projectIds.join(','));
      if (filters?.assignedTo?.length) params.append('assignedTo', filters.assignedTo.join(','));

      const response = await apiClient.get<CalendarEvent[]>(`/calendar/events?${params.toString()}`);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: "Calendar events retrieved successfully",
        };
      }

      throw new Error("Failed to fetch calendar events");
    } catch (error) {
      console.error("Calendar service error:", error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStats(): Promise<CalendarStatsResponse> {
    try {
      const response = await apiClient.get("/calendar/stats");

      if (response.success) {
        return {
          success: true,
          data: response.data as typeof response.data & {
            totalEvents: number;
            upcomingEvents: number;
            overdueEvents: number;
            completedThisWeek: number;
            criticalDeadlines: number;
            eventsByType: Record<CalendarEvent['type'], number>;
            eventsByStatus: Record<CalendarEvent['status'], number>;
          },
          message: "Calendar stats retrieved successfully",
        };
      }

      throw new Error("Failed to fetch calendar stats");
    } catch (error) {
      console.error("Calendar stats service error:", error);
      return {
        success: false,
        data: {
          totalEvents: 0,
          upcomingEvents: 0,
          overdueEvents: 0,
          completedThisWeek: 0,
          criticalDeadlines: 0,
          eventsByType: {
            project: 0,
            requirement: 0,
            meeting: 0,
            deadline: 0,
            milestone: 0,
          },
          eventsByStatus: {
            upcoming: 0,
            'in-progress': 0,
            completed: 0,
            overdue: 0,
          },
        },
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarResponse> {
    try {
      const response = await apiClient.post("/calendar/events", event);

      if (response.success) {
        return {
          success: true,
          data: [response.data as CalendarEvent],
          message: "Event created successfully",
        };
      }

      throw new Error("Failed to create event");
    } catch (error) {
      console.error("Create event error:", error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarResponse> {
    try {
      const response = await apiClient.put(`/calendar/events/${id}`, event);

      if (response.success) {
        return {
          success: true,
          data: [response.data as CalendarEvent],
          message: "Event updated successfully",
        };
      }

      throw new Error("Failed to update event");
    } catch (error) {
      console.error("Update event error:", error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/calendar/events/${id}`);

      if (response.success) {
        return {
          success: true,
          message: "Event deleted successfully",
        };
      }

      throw new Error("Failed to delete event");
    } catch (error) {
      console.error("Delete event error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get events for a specific date range (optimized for calendar views)
   */
  async getEventsForDateRange(startDate: string, endDate: string): Promise<CalendarResponse> {
    return this.getCalendarEvents({ startDate, endDate });
  }

  /**
   * Get upcoming events (next 7 days)
   */
  async getUpcomingEvents(limit: number = 10): Promise<CalendarResponse> {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const filters: CalendarFilters = {
      startDate: today.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      statuses: ['upcoming', 'in-progress'],
    };

    return this.getCalendarEvents(filters);
  }

  /**
   * Get overdue events
   */
  async getOverdueEvents(): Promise<CalendarResponse> {
    const filters: CalendarFilters = {
      statuses: ['overdue'],
    };

    return this.getCalendarEvents(filters);
  }
}

export const calendarService = new CalendarService();
