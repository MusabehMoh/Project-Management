using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace PMA.Infrastructure.Repositories;

public class CalendarEventRepository : Repository<CalendarEvent>, ICalendarEventRepository
{
    public CalendarEventRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<CalendarEvent> CalendarEvents, int TotalCount)> GetCalendarEventsAsync(int page, int limit, int? projectId = null, int? createdBy = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.CalendarEvents.AsQueryable();

        // Apply filters
        if (projectId.HasValue)
        {
            query = query.Where(e => e.ProjectId == projectId.Value);
        }

        if (createdBy.HasValue)
        {
            query = query.Where(e => e.CreatedBy == createdBy.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(e => e.StartDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(e => e.EndDate <= endDate.Value);
        }

        var totalCount = await query.CountAsync();

        var calendarEvents = await query
            .OrderByDescending(e => e.StartDate)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (calendarEvents, totalCount);
    }

    public async Task<IEnumerable<CalendarEvent>> GetCalendarEventsByProjectAsync(int projectId)
    {
        return await _context.CalendarEvents
            .Where(e => e.ProjectId == projectId)
            .OrderByDescending(e => e.StartDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<CalendarEvent>> GetCalendarEventsByCreatorAsync(int creatorId)
    {
        return await _context.CalendarEvents
            .Where(e => e.CreatedBy == creatorId)
            .OrderByDescending(e => e.StartDate)
            .ToListAsync();
    }
}