using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;

namespace PMA.Infrastructure.Repositories;

public class ProjectRequirementRepository : Repository<ProjectRequirement>, IProjectRequirementRepository
{
    public ProjectRequirementRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<ProjectRequirement> ProjectRequirements, int TotalCount)> GetProjectRequirementsAsync(int page, int limit, int? projectId = null, string? status = null, string? priority = null)
    {
        var query = _context.ProjectRequirements
            .Include(pr => pr.Project)
            .Include(pr => pr.Creator)
            .Include(pr => pr.Analyst)
            .AsQueryable();

        if (projectId.HasValue)
        {
            query = query.Where(pr => pr.ProjectId == projectId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(pr => pr.Status == status);
        }

        if (!string.IsNullOrEmpty(priority))
        {
            query = query.Where(pr => pr.Priority == priority);
        }

        var totalCount = await query.CountAsync();
        var projectRequirements = await query
            .OrderBy(pr => pr.Priority)
            .ThenBy(pr => pr.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (projectRequirements, totalCount);
    }

    public async Task<IEnumerable<ProjectRequirement>> GetProjectRequirementsByProjectAsync(int projectId)
    {
        return await _context.ProjectRequirements
            .Include(pr => pr.Creator)
            .Include(pr => pr.Analyst)
            .Include(pr => pr.Attachments)
            .Include(pr => pr.Tasks)
            .Where(pr => pr.ProjectId == projectId)
            .OrderBy(pr => pr.Priority)
            .ThenBy(pr => pr.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ProjectRequirement>> GetProjectRequirementsByAnalystAsync(int analystId)
    {
        return await _context.ProjectRequirements
            .Include(pr => pr.Project)
            .Include(pr => pr.Creator)
            .Include(pr => pr.Attachments)
            .Include(pr => pr.Tasks)
            .Where(pr => pr.AssignedAnalyst == analystId)
            .OrderBy(pr => pr.Priority)
            .ThenBy(pr => pr.ExpectedCompletionDate)
            .ToListAsync();
    }

    public async Task<ProjectRequirement?> GetProjectRequirementWithDetailsAsync(int id)
    {
        return await _context.ProjectRequirements
            .Include(pr => pr.Project)
                .ThenInclude(p => p != null ? p.ProjectOwnerEmployee : null)
            .Include(pr => pr.Project)
                .ThenInclude(p => p != null ? p.AlternativeOwnerEmployee : null)
            .Include(pr => pr.Project)
                .ThenInclude(p => p != null ? p.OwningUnitEntity : null)
            .Include(pr => pr.Creator)
            .Include(pr => pr.Analyst)
            .Include(pr => pr.Attachments)
            .Include(pr => pr.Tasks)
                .ThenInclude(t => t.Developer)
            .Include(pr => pr.Tasks)
                .ThenInclude(t => t.Qc)
            .FirstOrDefaultAsync(pr => pr.Id == id);
    }
}