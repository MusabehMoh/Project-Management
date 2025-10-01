using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace PMA.Infrastructure.Repositories;

public class TimelineRepository : Repository<Timeline>, ITimelineRepository
{
    public TimelineRepository(ApplicationDbContext context) : base(context)
    {
    }

    // Override GetByIdAsync to include related sprints and tasks
    public new async Task<Timeline?> GetByIdAsync(int id)
    {
        return await _context.Timelines
            .Include(t => t.Project)
            .Include(t => t.ProjectRequirement)
            .Include(t => t.Sprints)
                .ThenInclude(s => s.Tasks) 

            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<(IEnumerable<Timeline> Timelines, int TotalCount)> GetTimelinesAsync(int page, int limit, int? projectId = null)
    {
        var query = _context.Timelines
            .Include(t => t.Project)
            .Include(t => t.ProjectRequirement)
            .Include(t => t.Sprints)
            .ThenInclude(s => s.Tasks) 
            .AsQueryable();

        if (projectId.HasValue)
        {
            query = query.Where(t => t.ProjectId == projectId.Value);
        }

        var totalCount = await query.CountAsync();
        var timelines = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (timelines, totalCount);
    }

    public async Task<IEnumerable<Timeline>> GetTimelinesByProjectAsync(int projectId)
    {
        return await _context.Timelines
            .Include(t => t.Project)
            .Include(t => t.ProjectRequirement)
            .Include(t => t.Sprints)
             .ThenInclude(s => s.Tasks) 
            .Where(t => t.ProjectId == projectId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }
}