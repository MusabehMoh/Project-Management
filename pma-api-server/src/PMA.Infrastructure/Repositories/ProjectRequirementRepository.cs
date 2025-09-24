using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
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
            if (Enum.TryParse<RequirementStatusEnum>(status, true, out var statusEnum))
            {
                query = query.Where(pr => pr.Status == statusEnum);
            }
        }

        if (!string.IsNullOrEmpty(priority))
        {
            if (Enum.TryParse<RequirementPriority>(priority, true, out var priorityEnum))
            {
                query = query.Where(pr => pr.Priority == priorityEnum);
            }
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

    public async Task<ProjectRequirementStatsDto> GetProjectRequirementStatsAsync(int projectId)
    {
        var query = _context.ProjectRequirements
            .Where(pr => pr.ProjectId == projectId);

        var total = await query.CountAsync();

        // Group by status to get counts - using enum values
        var statusCounts = await query
            .GroupBy(pr => pr.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Status, g => g.Count);

        // Group by priority to get counts - using enum values
        var priorityCounts = await query
            .GroupBy(pr => pr.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Priority, g => g.Count);

        // Map status enum values to DTO properties
        var draft = statusCounts.GetValueOrDefault(RequirementStatusEnum.New, 0);
        var approved = statusCounts.GetValueOrDefault(RequirementStatusEnum.UnderStudy, 0) + statusCounts.GetValueOrDefault(RequirementStatusEnum.Approved, 0);
        var inDevelopment = statusCounts.GetValueOrDefault(RequirementStatusEnum.UnderDevelopment, 0);
        var underTesting = statusCounts.GetValueOrDefault(RequirementStatusEnum.UnderTesting, 0);
        var completed = statusCounts.GetValueOrDefault(RequirementStatusEnum.Completed, 0);

        return new ProjectRequirementStatsDto
        {
            Total = total,
            Draft = draft,
            Approved = approved,
            InDevelopment = inDevelopment,
            UnderTesting = underTesting,
            Completed = completed,
            ByStatus = new ByStatusDto
            {
                Draft = draft,
                Approved = approved,
                Rejected = 0, // No rejected status in the lookup table provided
                InDevelopment = inDevelopment,
                UnderTesting = underTesting,
                Completed = completed
            },
            ByPriority = new ByPriorityDto
            {
                Low = priorityCounts.GetValueOrDefault(RequirementPriority.Low, 0),
                Medium = priorityCounts.GetValueOrDefault(RequirementPriority.Medium, 0),
                High = priorityCounts.GetValueOrDefault(RequirementPriority.High, 0),
                Critical = priorityCounts.GetValueOrDefault(RequirementPriority.Critical, 0)
            }
        };
    }
}