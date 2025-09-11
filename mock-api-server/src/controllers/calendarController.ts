import { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { 
  mockCalendarEvents, 
  getEventsByDateRange, 
  getEventsByType, 
  getEventsByStatus, 
  getEventsByPriority,
  getUpcomingEvents,
  getOverdueEvents,
  calculateCalendarStats,
  type CalendarEvent
} from "../data/mockCalendarEvents.js";

export class CalendarController {
  /**
   * Get calendar events with optional filters
   */
  async getCalendarEvents(req: Request, res: Response) {
    try {
      const {
        startDate,
        endDate,
        types,
        statuses,
        priorities,
        projectIds,
        assignedTo,
        page = 1,
        limit = 100
      } = req.query;

      let filteredEvents = [...mockCalendarEvents];

      // Filter by date range
      if (startDate && endDate) {
        filteredEvents = getEventsByDateRange(startDate as string, endDate as string);
      }

      // Filter by types
      if (types) {
        const typeArray = (types as string).split(',') as CalendarEvent['type'][];
        filteredEvents = filteredEvents.filter(event => typeArray.includes(event.type));
      }

      // Filter by statuses
      if (statuses) {
        const statusArray = (statuses as string).split(',') as CalendarEvent['status'][];
        filteredEvents = filteredEvents.filter(event => statusArray.includes(event.status));
      }

      // Filter by priorities
      if (priorities) {
        const priorityArray = (priorities as string).split(',') as CalendarEvent['priority'][];
        filteredEvents = filteredEvents.filter(event => priorityArray.includes(event.priority));
      }

      // Filter by project IDs
      if (projectIds) {
        const projectIdArray = (projectIds as string).split(',').map(id => parseInt(id));
        filteredEvents = filteredEvents.filter(event => 
          event.projectId && projectIdArray.includes(event.projectId)
        );
      }

      // Filter by assigned users
      if (assignedTo) {
        const userIdArray = (assignedTo as string).split(',').map(id => parseInt(id));
        filteredEvents = filteredEvents.filter(event => 
          event.assignedTo && event.assignedTo.some(userId => userIdArray.includes(userId))
        );
      }

      // Sort by start date
      filteredEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const total = filteredEvents.length;
      const totalPages = Math.ceil(total / limitNum);
      const offset = (pageNum - 1) * limitNum;
      const paginatedEvents = filteredEvents.slice(offset, offset + limitNum);

      logger.info(`Retrieved ${paginatedEvents.length} of ${total} calendar events (page ${pageNum})`);

      res.json({
        success: true,
        data: paginatedEvents,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages
        }
      });
    } catch (error) {
      logger.error("Error fetching calendar events:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch calendar events",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStats(req: Request, res: Response) {
    try {
      const stats = calculateCalendarStats();

      logger.info("Retrieved calendar statistics");

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error("Error fetching calendar stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch calendar statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;
      const events = getUpcomingEvents(parseInt(limit as string));

      logger.info(`Retrieved ${events.length} upcoming events`);

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      logger.error("Error fetching upcoming events:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch upcoming events",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Get overdue events
   */
  async getOverdueEvents(req: Request, res: Response) {
    try {
      const events = getOverdueEvents();

      logger.info(`Retrieved ${events.length} overdue events`);

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      logger.error("Error fetching overdue events:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch overdue events",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Create a new calendar event
   */
  async createCalendarEvent(req: Request, res: Response) {
    try {
      const eventData = req.body;

      // Generate new ID
      const newId = Math.max(...mockCalendarEvents.map(e => e.id)) + 1;
      const now = new Date().toISOString();

      const newEvent: CalendarEvent = {
        id: newId,
        ...eventData,
        createdAt: now,
        updatedAt: now
      };

      // Add to mock data (in a real app, this would be persisted)
      mockCalendarEvents.push(newEvent);

      logger.info(`Created new calendar event: ${newEvent.title} (ID: ${newId})`);

      res.status(201).json({
        success: true,
        data: newEvent,
        message: "Event created successfully"
      });
    } catch (error) {
      logger.error("Error creating calendar event:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create calendar event",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Update a calendar event
   */
  async updateCalendarEvent(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.id);
      const updateData = req.body;

      const eventIndex = mockCalendarEvents.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Event not found"
        });
      }

      // Update the event
      mockCalendarEvents[eventIndex] = {
        ...mockCalendarEvents[eventIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      logger.info(`Updated calendar event: ${mockCalendarEvents[eventIndex].title} (ID: ${eventId})`);

      res.json({
        success: true,
        data: mockCalendarEvents[eventIndex],
        message: "Event updated successfully"
      });
    } catch (error) {
      logger.error("Error updating calendar event:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update calendar event",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.id);

      const eventIndex = mockCalendarEvents.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Event not found"
        });
      }

      const deletedEvent = mockCalendarEvents[eventIndex];
      mockCalendarEvents.splice(eventIndex, 1);

      logger.info(`Deleted calendar event: ${deletedEvent.title} (ID: ${eventId})`);

      res.json({
        success: true,
        message: "Event deleted successfully"
      });
    } catch (error) {
      logger.error("Error deleting calendar event:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete calendar event",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Get events for a specific date
   */
  async getEventsForDate(req: Request, res: Response) {
    try {
      const { date } = req.params;
      
      // Convert date to start and end of day
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const events = getEventsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );

      logger.info(`Retrieved ${events.length} events for date: ${date}`);

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      logger.error("Error fetching events for date:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch events for date",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * Get events by project ID
   */
  async getEventsByProject(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId);

      const events = mockCalendarEvents.filter(event => event.projectId === projectId);

      logger.info(`Retrieved ${events.length} events for project ID: ${projectId}`);

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      logger.error("Error fetching events by project:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch events by project",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
