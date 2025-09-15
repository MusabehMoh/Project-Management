using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace PMA.Infrastructure.Repositories;

public class RequirementRepository : Repository<Requirement>, IRequirementRepository
{
    public RequirementRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<Requirement> Requirements, int TotalCount)> GetRequirementsAsync(int page, int limit, int? projectId = null, string? status = null, string? priority = null)
    {
        var query = _context.Requirements
            .Include(r => r.AssignedTo)
            .Include(r => r.Project)
            .Include(r => r.Comments)
            .AsQueryable();

        if (projectId.HasValue)
        {
            query = query.Where(r => r.ProjectId == projectId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status.ToString() == status);
        }

        if (!string.IsNullOrEmpty(priority))
        {
            query = query.Where(r => r.Priority.ToString() == priority);
        }

        var totalCount = await query.CountAsync();
        var requirements = await query
            .OrderBy(r => r.Priority)
            .ThenBy(r => r.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (requirements, totalCount);
    }

    public async Task<IEnumerable<Requirement>> GetRequirementsByProjectAsync(int projectId)
    {
        return await _context.Requirements
            .Include(r => r.AssignedTo)
            .Include(r => r.Comments)
            .Where(r => r.ProjectId == projectId)
            .OrderBy(r => r.Priority)
            .ThenBy(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Requirement>> GetRequirementsByAssigneeAsync(int assigneeId)
    {
        return await _context.Requirements
            .Include(r => r.Project)
            .Include(r => r.Comments)
            .Where(r => r.AssignedToId == assigneeId)
            .OrderBy(r => r.Priority)
            .ThenBy(r => r.DueDate)
            .ToListAsync();
    }

    public async Task<Requirement?> GetRequirementWithCommentsAsync(int id)
    {
        return await _context.Requirements
            .Include(r => r.Project)
            .Include(r => r.AssignedTo)
            .Include(r => r.Comments)
                .ThenInclude(c => c.CreatedBy)
            .FirstOrDefaultAsync(r => r.Id == id);
    }
}


