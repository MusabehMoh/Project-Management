using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace PMA.Infrastructure.Repositories;

public class SprintRepository : Repository<Sprint>, ISprintRepository
{
    public SprintRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<Sprint> Sprints, int TotalCount)> GetSprintsAsync(int page, int limit, int? projectId = null, int? status = null)
    {
        var query = _context.Sprints
            .Include(s => s.Tasks)
            .AsQueryable();

        if (projectId.HasValue)
        {
            query = query.Where(s => s.ProjectId == projectId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(s => (int)s.Status == status.Value);
        }

        var totalCount = await query.CountAsync();
        var sprints = await query
            .OrderByDescending(s => s.StartDate)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (sprints, totalCount);
    }

    public async Task<IEnumerable<Sprint>> GetSprintsByProjectAsync(int projectId)
    {
        return await _context.Sprints
            .Include(s => s.Tasks)
            .Where(s => s.ProjectId == projectId)
            .OrderByDescending(s => s.StartDate)
            .ToListAsync();
    }

    public async Task<Sprint?> GetActiveSprintByProjectAsync(int projectId)
    {
        return await _context.Sprints
            .Include(s => s.Tasks)
            .Where(s => s.ProjectId == projectId && s.Status == SprintStatus.Active)
            .FirstOrDefaultAsync();
    }
}


