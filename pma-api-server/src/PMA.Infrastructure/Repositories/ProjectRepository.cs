using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace PMA.Infrastructure.Repositories;

public class ProjectRepository : Repository<Project>, IProjectRepository
{
    public ProjectRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Project>> GetProjectsWithPaginationAsync(int page, int limit, string? search = null, int? status = null, string? priority = null)
    {
        var query = _context.Projects.AsQueryable();

        // Apply filters first
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p =>
                p.ApplicationName.Contains(search) ||
                p.Description.Contains(search) ||
                p.ProjectOwner.Contains(search));
        }

        if (status.HasValue)
        {
            query = query.Where(p => (int)p.Status == status.Value);
        }

        if (!string.IsNullOrEmpty(priority))
        {
            if (Enum.TryParse<Priority>(priority, true, out var priorityEnum))
            {
                query = query.Where(p => p.Priority == priorityEnum);
            }
        }

        // Add includes and execute query
        return await query
            .Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .Include(p => p.AlternativeOwnerEmployee) // LEFT JOIN due to nullable FK
            .Include(p => p.ProjectAnalysts!)
                .ThenInclude(pa => pa.Analyst)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> GetTotalProjectsCountAsync(string? search = null, int? status = null, string? priority = null)
    {
        var query = _context.Projects.AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p =>
                p.ApplicationName.Contains(search) ||
                p.Description.Contains(search) ||
                p.ProjectOwner.Contains(search));
        }

        // Apply status filter
        if (status.HasValue)
        {
            query = query.Where(p => (int)p.Status == status.Value);
        }

        // Apply priority filter
        if (!string.IsNullOrEmpty(priority))
        {
            if (Enum.TryParse<Priority>(priority, true, out var priorityEnum))
            {
                query = query.Where(p => p.Priority == priorityEnum);
            }
        }

        return await query.CountAsync();
    }

    public async Task<(IEnumerable<Project> Projects, int TotalCount)> GetProjectsWithPaginationAndCountAsync(int page, int limit, string? search = null, int? status = null, string? priority = null)
    {
        var baseQuery = _context.Projects.AsQueryable();

        // Apply filters first (without includes for count efficiency)
        if (!string.IsNullOrEmpty(search))
        {
            baseQuery = baseQuery.Where(p =>
                p.ApplicationName.Contains(search) ||
                p.Description.Contains(search) ||
                p.ProjectOwner.Contains(search));
        }

        if (status.HasValue)
        {
            baseQuery = baseQuery.Where(p => (int)p.Status == status.Value);
        }

        if (!string.IsNullOrEmpty(priority))
        {
            if (Enum.TryParse<Priority>(priority, true, out var priorityEnum))
            {
                baseQuery = baseQuery.Where(p => p.Priority == priorityEnum);
            }
        }

        // Get total count without includes (more efficient)
        var totalCount = await baseQuery.CountAsync();

        // Now add includes for the actual data retrieval
        var projectsQuery = baseQuery
            .Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .Include(p => p.AlternativeOwnerEmployee) // This will be LEFT JOIN due to nullable FK
            .Include(p => p.ProjectAnalysts!)
                .ThenInclude(pa => pa.Analyst);

        // Get paginated results
        var projects = await projectsQuery
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (projects, totalCount);
    }

    public async Task<Project?> GetProjectWithDetailsAsync(int id)
    {
        return await _context.Projects
            .Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .Include(p => p.Tasks)
            .Include(p => p.Requirements)
            .Include(p => p.AlternativeOwnerEmployee) // LEFT JOIN for optional alternative owner
            .Include(p => p.ProjectAnalysts!) // LEFT JOIN for optional analysts collection
                .ThenInclude(pa => pa.Analyst)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Project>> SearchProjectsAsync(string query, int? status = null, string? priority = null, int page = 1, int limit = 20)
    {
        var searchQuery = _context.Projects
            .Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .Include(p => p.AlternativeOwnerEmployee) // LEFT JOIN for optional alternative owner
            .Include(p => p.ProjectAnalysts!) // LEFT JOIN for optional analysts collection
                .ThenInclude(pa => pa.Analyst)
            .Where(p =>
                p.ApplicationName.Contains(query) ||
                p.Description.Contains(query) ||
                p.ProjectOwner.Contains(query) ||
                (p.AlternativeOwner != null && p.AlternativeOwner.Contains(query))) // Safe null check
            .AsQueryable();

        // Apply status filter
        if (status.HasValue)
        {
            searchQuery = searchQuery.Where(p => (int)p.Status == status.Value);
        }

        // Apply priority filter
        if (!string.IsNullOrEmpty(priority))
        {
            if (Enum.TryParse<Priority>(priority, true, out var priorityEnum))
            {
                searchQuery = searchQuery.Where(p => p.Priority == priorityEnum);
            }
        }

        return await searchQuery
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<(IEnumerable<AssignedProjectDto> AssignedProjects, int TotalCount)> GetAssignedProjectsAsync(string currentUserPrsId, int page, int limit, string? search = null, int? projectId = null)
    {
        // Get projects where the current user's PrsId is assigned as an analyst
        var query = _context.Projects
            .Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .Include(p => p.Requirements)
            .Include(p => p.AlternativeOwnerEmployee) // LEFT JOIN for optional alternative owner
            .Include(p => p.ProjectAnalysts!) // LEFT JOIN for optional analysts collection
                .ThenInclude(pa => pa.Analyst)
            .AsQueryable();

        // Filter by analyst assignment - check if current user's PrsId matches any ProjectAnalyst
        if (int.TryParse(currentUserPrsId, out int userId))
        {
            query = query.Where(p => p.ProjectAnalysts!.Any(pa => pa.AnalystId == userId));
        }

        // Filter by specific project ID if provided
        if (projectId.HasValue)
        {
            query = query.Where(p => p.Id == projectId.Value);
        }

        // Exclude projects with Status New or Delayed
        query = query.Where(p => p.Status != ProjectStatus.New && p.Status != ProjectStatus.Delayed);

        // Filter by search term (application name)
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p => p.ApplicationName.ToLower().Contains(search.ToLower()));
        }

        var totalCount = await query.CountAsync();
        
        var projects = await query
            .OrderBy(p => p.ApplicationName)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        // Projects are already loaded with ProjectAnalysts and their related Analyst entities
        var assignedProjects = projects.Select(project =>
        {
            var totalRequirements = project.Requirements?.Count() ?? 0;
            var completedRequirements = project.Requirements?.Count(r => r.Status == RequirementStatus.Completed) ?? 0;
            
            // Extract analyst names from ProjectAnalyst junction table entities
            string analystNames = string.Empty;
            if (project.ProjectAnalysts != null && project.ProjectAnalysts.Any())
            {
                var names = project.ProjectAnalysts
                    .Where(pa => pa.Analyst != null)
                    .Select(pa => pa.Analyst!.FullName)
                    .ToList();
                
                analystNames = string.Join(", ", names);
            }
            
            return new AssignedProjectDto
            {
                Id = project.Id,
                ApplicationName = project.ApplicationName,
                ProjectOwner = project.ProjectOwnerEmployee?.FullName ?? project.ProjectOwner ?? "Unknown",
                OwningUnit = project.OwningUnitEntity?.Name ?? project.OwningUnit ?? "Unknown",
                Status = project.Status,
                RequirementsCount = totalRequirements,
                CompletedRequirements = completedRequirements,
                LastActivity = project.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Description = project.Description,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt,
                Analysts = analystNames
            };
        });

        return (assignedProjects, totalCount);
    }
}


