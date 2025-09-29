import { useState, useEffect, useCallback } from "react";

import {
  calendarService,
  type CalendarEvent,
  type CalendarFilters,
  type CalendarStatsResponse,
} from "@/services/api/calendarService";

// Utility function to sanitize calendar event dates
const sanitizeEventDates = (event: CalendarEvent): CalendarEvent => {
  const sanitizedEvent = { ...event };

  // Fix malformed date strings like "2025-09-30T09:00:00:00.000Z"
  if (event.startDate?.includes("T") && event.startDate.split(":").length > 3) {
    // Remove the extra ":00" from malformed timestamps
    sanitizedEvent.startDate = event.startDate.replace(
      /T(\d{2}:\d{2}:\d{2}):\d{2}(\.000Z)$/,
      "T$1$2",
    );
  }

  if (event.endDate?.includes("T") && event.endDate.split(":").length > 3) {
    // Remove the extra ":00" from malformed timestamps
    sanitizedEvent.endDate = event.endDate.replace(
      /T(\d{2}:\d{2}:\d{2}):\d{2}(\.000Z)$/,
      "T$1$2",
    );
  }

  return sanitizedEvent;
};

export interface UseCalendarReturn {
  // Data
  events: CalendarEvent[];
  stats: CalendarStatsResponse["data"] | null;
  upcomingEvents: CalendarEvent[];
  overdueEvents: CalendarEvent[];

  // State
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  viewMode: "month" | "week" | "day";
  filters: CalendarFilters;

  // Actions
  loadEvents: (filters?: CalendarFilters) => Promise<void>;
  loadStats: () => Promise<void>;
  loadUpcomingEvents: (limit?: number) => Promise<void>;
  loadOverdueEvents: () => Promise<void>;
  createEvent: (
    event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">,
  ) => Promise<boolean>;
  updateEvent: (id: number, event: Partial<CalendarEvent>) => Promise<boolean>;
  deleteEvent: (id: number) => Promise<boolean>;

  // Filters and Navigation
  setFilters: (filters: CalendarFilters) => void;
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: "month" | "week" | "day") => void;
  navigateToDate: (date: Date) => void;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;

  // Utilities
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForDateRange: (startDate: Date, endDate: Date) => CalendarEvent[];
  refreshCalendar: () => Promise<void>;
  clearError: () => void;
}

export const useCalendar = (): UseCalendarReturn => {
  // State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<CalendarStatsResponse["data"] | null>(
    null,
  );
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [overdueEvents, setOverdueEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [filters, setFilters] = useState<CalendarFilters>({});

  // Load events
  const loadEvents = useCallback(
    async (customFilters?: CalendarFilters) => {
      setLoading(true);
      setError(null);

      try {
        const filtersToUse = customFilters || filters;
        const response = await calendarService.getCalendarEvents(filtersToUse);

        if (response.success) {
          // Sanitize event dates to fix any malformed date strings
          const sanitizedEvents = response.data.map(sanitizeEventDates);

          setEvents(sanitizedEvents);
        } else {
          setError(response.message);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load events",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const response = await calendarService.getCalendarStats();

      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load stats");
    }
  }, []);

  // Load upcoming events
  const loadUpcomingEvents = useCallback(async (limit: number = 10) => {
    try {
      const response = await calendarService.getUpcomingEvents(limit);

      if (response.success) {
        const sanitizedEvents = response.data.map(sanitizeEventDates);

        setUpcomingEvents(sanitizedEvents);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load upcoming events",
      );
    }
  }, []);

  // Load overdue events
  const loadOverdueEvents = useCallback(async () => {
    try {
      const response = await calendarService.getOverdueEvents();

      if (response.success) {
        const sanitizedEvents = response.data.map(sanitizeEventDates);

        setOverdueEvents(sanitizedEvents);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load overdue events",
      );
    }
  }, []);

  // Create event
  const createEvent = useCallback(
    async (
      event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">,
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await calendarService.createEvent(event);

        if (response.success) {
          await loadEvents(); // Refresh events list
          await loadStats(); // Refresh stats

          return true;
        } else {
          setError(response.message);

          return false;
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to create event",
        );

        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadEvents, loadStats],
  );

  // Update event
  const updateEvent = useCallback(
    async (id: number, event: Partial<CalendarEvent>): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await calendarService.updateEvent(id, event);

        if (response.success) {
          await loadEvents(); // Refresh events list
          await loadStats(); // Refresh stats

          return true;
        } else {
          setError(response.message);

          return false;
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to update event",
        );

        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadEvents, loadStats],
  );

  // Delete event
  const deleteEvent = useCallback(
    async (id: number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await calendarService.deleteEvent(id);

        if (response.success) {
          await loadEvents(); // Refresh events list
          await loadStats(); // Refresh stats

          return true;
        } else {
          setError(response.message);

          return false;
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to delete event",
        );

        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadEvents, loadStats],
  );

  // Navigation helpers
  const navigateToDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const goToPrevious = useCallback(() => {
    const newDate = new Date(selectedDate);

    switch (viewMode) {
      case "day":
        newDate.setDate(newDate.getDate() - 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }

    setSelectedDate(newDate);
  }, [selectedDate, viewMode]);

  const goToNext = useCallback(() => {
    const newDate = new Date(selectedDate);

    switch (viewMode) {
      case "day":
        newDate.setDate(newDate.getDate() + 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }

    setSelectedDate(newDate);
  }, [selectedDate, viewMode]);

  // Utility functions
  const getEventsForDate = useCallback(
    (date: Date): CalendarEvent[] => {
      // Check if the date is valid
      if (!date || isNaN(date.getTime())) {
        // eslint-disable-next-line no-console
        console.warn("Invalid date passed to getEventsForDate:", date);

        return [];
      }

      const dateStr = date.toISOString().split("T")[0];

      return events.filter((event) => {
        try {
          const eventStartDate = new Date(event.startDate);

          // Check if the start date is valid
          if (isNaN(eventStartDate.getTime())) {
            // eslint-disable-next-line no-console
            console.warn(
              "Invalid start date in event:",
              event.startDate,
              event,
            );

            return false;
          }

          const eventStart = eventStartDate.toISOString().split("T")[0];
          let eventEnd = eventStart;

          if (event.endDate) {
            const eventEndDate = new Date(event.endDate);

            // Check if the end date is valid
            if (isNaN(eventEndDate.getTime())) {
              // eslint-disable-next-line no-console
              console.warn("Invalid end date in event:", event.endDate, event);

              return false;
            }

            eventEnd = eventEndDate.toISOString().split("T")[0];
          }

          return dateStr >= eventStart && dateStr <= eventEnd;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn("Invalid date in event:", event, error);

          return false;
        }
      });
    },
    [events],
  );

  const getEventsForDateRange = useCallback(
    (startDate: Date, endDate: Date): CalendarEvent[] => {
      // Check if the dates are valid
      if (
        !startDate ||
        !endDate ||
        isNaN(startDate.getTime()) ||
        isNaN(endDate.getTime())
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          "Invalid dates passed to getEventsForDateRange:",
          startDate,
          endDate,
        );

        return [];
      }

      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      return events.filter((event) => {
        try {
          const eventStartDate = new Date(event.startDate);

          // Check if the start date is valid
          if (isNaN(eventStartDate.getTime())) {
            // eslint-disable-next-line no-console
            console.warn(
              "Invalid start date in event for date range:",
              event.startDate,
              event,
            );

            return false;
          }

          const eventStart = eventStartDate.toISOString().split("T")[0];
          let eventEnd = eventStart;

          if (event.endDate) {
            const eventEndDate = new Date(event.endDate);

            // Check if the end date is valid
            if (isNaN(eventEndDate.getTime())) {
              // eslint-disable-next-line no-console
              console.warn(
                "Invalid end date in event for date range:",
                event.endDate,
                event,
              );

              return false;
            }

            eventEnd = eventEndDate.toISOString().split("T")[0];
          }

          // Check if event overlaps with the date range
          return eventStart <= endStr && eventEnd >= startStr;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn("Invalid date in event for date range:", event, error);

          return false;
        }
      });
    },
    [events],
  );

  const refreshCalendar = useCallback(async () => {
    await Promise.all([
      loadEvents(),
      loadStats(),
      loadUpcomingEvents(),
      loadOverdueEvents(),
    ]);
  }, [loadEvents, loadStats, loadUpcomingEvents, loadOverdueEvents]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data when filters or selectedDate change
  useEffect(() => {
    // Calculate date range based on view mode and selected date
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);

    switch (viewMode) {
      case "day":
        // Same day
        break;
      case "week":
        // Start of week to end of week
        const dayOfWeek = startDate.getDay();

        startDate.setDate(startDate.getDate() - dayOfWeek);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case "month":
        // Start of month to end of month
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        break;
    }

    const dateFilters: CalendarFilters = {
      ...filters,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };

    loadEvents(dateFilters);
  }, [selectedDate, viewMode, filters, loadEvents]);

  // Load stats and other data on mount
  useEffect(() => {
    loadStats();
    loadUpcomingEvents();
    loadOverdueEvents();
  }, [loadStats, loadUpcomingEvents, loadOverdueEvents]);

  return {
    // Data
    events,
    stats,
    upcomingEvents,
    overdueEvents,

    // State
    loading,
    error,
    selectedDate,
    viewMode,
    filters,

    // Actions
    loadEvents,
    loadStats,
    loadUpcomingEvents,
    loadOverdueEvents,
    createEvent,
    updateEvent,
    deleteEvent,

    // Filters and Navigation
    setFilters,
    setSelectedDate,
    setViewMode,
    navigateToDate,
    goToToday,
    goToPrevious,
    goToNext,

    // Utilities
    getEventsForDate,
    getEventsForDateRange,
    refreshCalendar,
    clearError,
  };
};
