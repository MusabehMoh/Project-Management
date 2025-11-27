using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace PMA.Infrastructure.Repositories;

public class ProjectRequirementStatusHistoryRepository : Repository<ProjectRequirementStatusHistory>, IProjectRequirementStatusHistoryRepository
{
    public ProjectRequirementStatusHistoryRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ProjectRequirementStatusHistory>> GetRequirementStatusHistoryAsync(int requirementId)
    {
        return await _context.ProjectRequirementStatusHistory
            .Include(h => h.CreatedByUser)
            .Where(h => h.RequirementId == requirementId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();
    }
}