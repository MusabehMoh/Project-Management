import { Router } from "express";
import { CalendarController } from "../controllers/calendarController.js";

export const calendarRoutes = Router();
const calendarController = new CalendarController();

// GET /api/calendar/events - Get calendar events with optional filters
calendarRoutes.get(
  "/events",
  calendarController.getCalendarEvents.bind(calendarController)
);

// GET /api/calendar/stats - Get calendar statistics
calendarRoutes.get(
  "/stats",
  calendarController.getCalendarStats.bind(calendarController)
);

// GET /api/calendar/upcoming - Get upcoming events
calendarRoutes.get(
  "/upcoming",
  calendarController.getUpcomingEvents.bind(calendarController)
);

// GET /api/calendar/overdue - Get overdue events
calendarRoutes.get(
  "/overdue",
  calendarController.getOverdueEvents.bind(calendarController)
);

// GET /api/calendar/events/date/:date - Get events for a specific date
calendarRoutes.get(
  "/events/date/:date",
  calendarController.getEventsForDate.bind(calendarController)
);

// GET /api/calendar/events/project/:projectId - Get events by project ID
calendarRoutes.get(
  "/events/project/:projectId",
  calendarController.getEventsByProject.bind(calendarController)
);

// POST /api/calendar/events - Create a new calendar event
calendarRoutes.post(
  "/events",
  calendarController.createCalendarEvent.bind(calendarController)
);

// PUT /api/calendar/events/:id - Update a calendar event
calendarRoutes.put(
  "/events/:id",
  calendarController.updateCalendarEvent.bind(calendarController)
);

// DELETE /api/calendar/events/:id - Delete a calendar event
calendarRoutes.delete(
  "/events/:id",
  calendarController.deleteCalendarEvent.bind(calendarController)
);
