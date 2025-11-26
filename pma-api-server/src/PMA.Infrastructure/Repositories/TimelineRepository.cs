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

    // Override GetByIdAsync to include related tasks and subtasks (removed Sprint layer)
    public new async Task<Timeline?> GetByIdAsync(int id)
    {
        return await _context.Timelines
            .Include(t => t.Project)
            .Include(t => t.ProjectRequirement)
            .Include(t => t.Tasks!) 
            .Include(t => t.Tasks!)
                .ThenInclude(task => task.Assignments)
                    .ThenInclude(a => a.Employee)
            .Include(t => t.Tasks!)
                .ThenInclude(task => task.DependentTasks)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<(IEnumerable<Timeline> Timelines, int TotalCount)> GetTimelinesAsync(int page, int limit, int? projectId = null)
    {
        var query = _context.Timelines
            .Include(t => t.Project)
            .Include(t => t.ProjectRequirement)
            .Include(t => t.Tasks!) 
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
            .Include(t => t.Tasks!) 
            .Where(t => t.ProjectId == projectId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }
}