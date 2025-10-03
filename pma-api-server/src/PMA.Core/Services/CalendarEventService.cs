using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace PMA.Core.Services;

public class CalendarEventService : ICalendarEventService
{
    private readonly ICalendarEventRepository _calendarEventRepository;

    public CalendarEventService(ICalendarEventRepository calendarEventRepository)
    {
        _calendarEventRepository = calendarEventRepository;
    }

    public async System.Threading.Tasks.Task<(IEnumerable<CalendarEvent> CalendarEvents, int TotalCount)> GetCalendarEventsAsync(int page, int limit, int? projectId = null, int? createdBy = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        return await _calendarEventRepository.GetCalendarEventsAsync(page, limit, projectId, createdBy, startDate, endDate);
    }

    public async System.Threading.Tasks.Task<CalendarEvent?> GetCalendarEventByIdAsync(int id)
    {
        return await _calendarEventRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<CalendarEvent> CreateCalendarEventAsync(CalendarEvent calendarEvent)
    {
        calendarEvent.CreatedAt = DateTime.UtcNow;
        calendarEvent.UpdatedAt = DateTime.UtcNow;
        return await _calendarEventRepository.AddAsync(calendarEvent);
    }

    public async System.Threading.Tasks.Task<CalendarEvent> UpdateCalendarEventAsync(CalendarEvent calendarEvent)
    {
        calendarEvent.UpdatedAt = DateTime.UtcNow;
        await _calendarEventRepository.UpdateAsync(calendarEvent);
        return calendarEvent;
    }

    public async System.Threading.Tasks.Task<bool> DeleteCalendarEventAsync(int id)
    {
        var calendarEvent = await _calendarEventRepository.GetByIdAsync(id);
        if (calendarEvent == null)
        {
            return false;
        }

        await _calendarEventRepository.DeleteAsync(calendarEvent);
        return true;
    }

    public async System.Threading.Tasks.Task<IEnumerable<CalendarEvent>> GetCalendarEventsByProjectAsync(int projectId)
    {
        return await _calendarEventRepository.GetCalendarEventsByProjectAsync(projectId);
    }

    public async System.Threading.Tasks.Task<IEnumerable<CalendarEvent>> GetCalendarEventsByCreatorAsync(int creatorId)
    {
        return await _calendarEventRepository.GetCalendarEventsByCreatorAsync(creatorId);
    }

    public async System.Threading.Tasks.Task<object> GetCalendarStatsAsync()
    {
        var allEvents = await _calendarEventRepository.GetAllAsync();
        var eventsList = allEvents.ToList();

        var now = DateTime.UtcNow;
        var weekAgo = now.AddDays(-7);

        return new
        {
            totalEvents = eventsList.Count,
            upcomingEvents = eventsList.Count(e => e.StartDate > now && e.Status == "upcoming"),
            overdueEvents = eventsList.Count(e => e.EndDate < now && e.Status != "completed"),
            completedThisWeek = eventsList.Count(e => e.Status == "completed" && e.UpdatedAt >= weekAgo),
            criticalDeadlines = eventsList.Count(e => e.Priority == "critical" && e.Type == "deadline" && e.StartDate > now),
            eventsByType = new
            {
                project = eventsList.Count(e => e.Type == "project"),
                requirement = eventsList.Count(e => e.Type == "requirement"),
                meeting = eventsList.Count(e => e.Type == "meeting"),
                deadline = eventsList.Count(e => e.Type == "deadline"),
                milestone = eventsList.Count(e => e.Type == "milestone")
            },
            eventsByStatus = new
            {
                upcoming = eventsList.Count(e => e.Status == "upcoming"),
                inProgress = eventsList.Count(e => e.Status == "in-progress"),
                completed = eventsList.Count(e => e.Status == "completed"),
                overdue = eventsList.Count(e => e.Status == "overdue")
            }
        };
    }
}