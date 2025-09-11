import { useState, useEffect, useCallback } from "react";
import { calendarService, type CalendarEvent, type CalendarFilters, type CalendarStatsResponse } from "@/services/api/calendarService";

export interface UseCalendarReturn {
  // Data
  events: CalendarEvent[];
  stats: CalendarStatsResponse['data'] | null;
  upcomingEvents: CalendarEvent[];
  overdueEvents: CalendarEvent[];
  
  // State
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  viewMode: 'month' | 'week' | 'day';
  filters: CalendarFilters;
  
  // Actions
  loadEvents: (filters?: CalendarFilters) => Promise<void>;
  loadStats: () => Promise<void>;
  loadUpcomingEvents: (limit?: number) => Promise<void>;
  loadOverdueEvents: () => Promise<void>;
  createEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateEvent: (id: number, event: Partial<CalendarEvent>) => Promise<boolean>;
  deleteEvent: (id: number) => Promise<boolean>;
  
  // Filters and Navigation
  setFilters: (filters: CalendarFilters) => void;
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: 'month' | 'week' | 'day') => void;
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
  const [stats, setStats] = useState<CalendarStatsResponse['data'] | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [overdueEvents, setOverdueEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [filters, setFilters] = useState<CalendarFilters>({});

  // Load events
  const loadEvents = useCallback(async (customFilters?: CalendarFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const filtersToUse = customFilters || filters;
      const response = await calendarService.getCalendarEvents(filtersToUse);
      
      if (response.success) {
        setEvents(response.data);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
        setUpcomingEvents(response.data);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load upcoming events");
    }
  }, []);

  // Load overdue events
  const loadOverdueEvents = useCallback(async () => {
    try {
      const response = await calendarService.getOverdueEvents();
      
      if (response.success) {
        setOverdueEvents(response.data);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load overdue events");
    }
  }, []);

  // Create event
  const createEvent = useCallback(async (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
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
      setError(error instanceof Error ? error.message : "Failed to create event");
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadEvents, loadStats]);

  // Update event
  const updateEvent = useCallback(async (id: number, event: Partial<CalendarEvent>): Promise<boolean> => {
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
      setError(error instanceof Error ? error.message : "Failed to update event");
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadEvents, loadStats]);

  // Delete event
  const deleteEvent = useCallback(async (id: number): Promise<boolean> => {
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
      setError(error instanceof Error ? error.message : "Failed to delete event");
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadEvents, loadStats]);

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
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    
    setSelectedDate(newDate);
  }, [selectedDate, viewMode]);

  const goToNext = useCallback(() => {
    const newDate = new Date(selectedDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    
    setSelectedDate(newDate);
  }, [selectedDate, viewMode]);

  // Utility functions
  const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventStart = new Date(event.startDate).toISOString().split('T')[0];
      const eventEnd = event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : eventStart;
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  }, [events]);

  const getEventsForDateRange = useCallback((startDate: Date, endDate: Date): CalendarEvent[] => {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    return events.filter(event => {
      const eventStart = new Date(event.startDate).toISOString().split('T')[0];
      const eventEnd = event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : eventStart;
      
      // Check if event overlaps with the date range
      return eventStart <= endStr && eventEnd >= startStr;
    });
  }, [events]);

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
      case 'day':
        // Same day
        break;
      case 'week':
        // Start of week to end of week
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'month':
        // Start of month to end of month
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        break;
    }

    const dateFilters: CalendarFilters = {
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
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
