using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.Enums;
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
                p.Description.Contains(search) );
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
                p.Description.Contains(search));
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

        var query = _context.Projects.AsQueryable();

        // Handle nullable collections by including them conditionally
        query = query.Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .Include(p => p.AlternativeOwnerEmployee) // LEFT JOIN due to nullable FK
            .Include(p => p.ResponsibleUnitManagerEmployee)
            .Include(p => p.ProjectAnalysts!)
                .ThenInclude(pa => pa.Analyst)
            .Include(p => p.ProjectRequirements); // Include requirements for statistics calculation


        // Apply filters first (without includes for count efficiency)
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p =>
                p.ApplicationName.ToLower().Contains(searchLower) ||
                (p.Description != null && p.Description.ToLower().Contains(searchLower)) ||
                (p.ProjectOwnerEmployee != null && p.ProjectOwnerEmployee.FullName != null && p.ProjectOwnerEmployee.FullName.ToLower().Contains(searchLower)) ||
                (p.OwningUnitEntity != null && p.OwningUnitEntity.Name != null && p.OwningUnitEntity.Name.ToLower().Contains(searchLower))
            );
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

        var totalCount = await query.CountAsync();
        var projects = await query
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
            .Include(p => p.ProjectRequirements)
            .Include(p => p.AlternativeOwnerEmployee) // LEFT JOIN for optional alternative owner
            .Include(p => p.ResponsibleUnitManagerEmployee)
            .Include(p => p.ProjectAnalysts!) // LEFT JOIN for optional analysts collection
                .ThenInclude(pa => pa.Analyst)
            .FirstOrDefaultAsync(p => p.Id == id);
    }
    public async Task<Project?> GetProjectAsync(int id)
    {
        return await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Project>> SearchProjectsAsync(string query, int? status = null, string? priority = null, int page = 1, int limit = 20)
    {
        var searchQuery = _context.Projects
            .Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .Include(p => p.AlternativeOwnerEmployee) // LEFT JOIN for optional alternative owner
             .Include(p => p.ResponsibleUnitManagerEmployee)
            .Include(p => p.ProjectAnalysts!) // LEFT JOIN for optional analysts collection
                .ThenInclude(pa => pa.Analyst)
            .Where(p =>
                p.ApplicationName.Contains(query) ||
                p.Description.Contains(query) ) // Safe null check
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

    public async Task<(IEnumerable<AssignedProjectDto> AssignedProjects, int TotalCount)> GetAssignedProjectsAsync(string currentUserPrsId, int page, int limit, string? search = null, int? projectId = null, bool skipAnalystFilter = false)
    {
        // Get projects where the current user's PrsId is assigned as an analyst
        var query = _context.Projects
            .Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .Include(p => p.ProjectRequirements)
            .Include(p => p.AlternativeOwnerEmployee) // LEFT JOIN for optional alternative owner
            .Include(p => p.ResponsibleUnitManagerEmployee)
            .Include(p => p.ProjectAnalysts!) // LEFT JOIN for optional analysts collection
                .ThenInclude(pa => pa.Analyst)
            .AsQueryable();

        // Filter by analyst assignment - check if current user's PrsId matches any ProjectAnalyst (skip if manager/admin)
        if (!skipAnalystFilter && int.TryParse(currentUserPrsId, out int userId))
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

        // Projects are already loaded with all included references
        var assignedProjects = projects.Select(project =>
        {
            var totalRequirements = project.ProjectRequirements?.Count() ?? 0;
            var completedRequirements = project.ProjectRequirements?.Count(r => r.Status == RequirementStatusEnum.Completed) ?? 0;
            
            // Extract analyst names from ProjectAnalyst junction table entities
            string analystNames = string.Empty;
            var analystEmployees = new List<EmployeeDto>();
            
            if (project.ProjectAnalysts != null && project.ProjectAnalysts.Any())
            {
                var analysts = project.ProjectAnalysts
                    .Where(pa => pa.Analyst != null)
                    .ToList();
                
                var names = analysts
                    .Select(pa => pa.Analyst!.FullName)
                    .ToList();
                
                analystNames = string.Join(", ", names);
                
                // Map analyst employees to DTOs
                analystEmployees = analysts
                    .Select(pa => new EmployeeDto
                    {
                        Id = pa.Analyst!.Id,
                        FullName = pa.Analyst.FullName,
                        UserName = pa.Analyst.UserName,
                        MilitaryNumber = pa.Analyst.MilitaryNumber,
                        GradeName = pa.Analyst.GradeName,
                        StatusId = pa.Analyst.StatusId
                    })
                    .ToList();
            }
            
            // Map ProjectOwnerEmployee to DTO
            var projectOwnerEmployeeDto = project.ProjectOwnerEmployee != null ? new EmployeeDto
            {
                Id = project.ProjectOwnerEmployee.Id,
                FullName = project.ProjectOwnerEmployee.FullName,
                UserName = project.ProjectOwnerEmployee.UserName,
                MilitaryNumber = project.ProjectOwnerEmployee.MilitaryNumber,
                GradeName = project.ProjectOwnerEmployee.GradeName,
                StatusId = project.ProjectOwnerEmployee.StatusId
            } : null;
            
            // Map AlternativeOwnerEmployee to DTO
            var alternativeOwnerEmployeeDto = project.AlternativeOwnerEmployee != null ? new EmployeeDto
            {
                Id = project.AlternativeOwnerEmployee.Id,
                FullName = project.AlternativeOwnerEmployee.FullName,
                UserName = project.AlternativeOwnerEmployee.UserName,
                MilitaryNumber = project.AlternativeOwnerEmployee.MilitaryNumber,
                GradeName = project.AlternativeOwnerEmployee.GradeName,
                StatusId = project.AlternativeOwnerEmployee.StatusId
            } : null;
            
            // Map ResponsibleUnitManagerEmployee to DTO
            var responsibleUnitManagerEmployeeDto = project.ResponsibleUnitManagerEmployee != null ? new EmployeeDto
            {
                Id = project.ResponsibleUnitManagerEmployee.Id,
                FullName = project.ResponsibleUnitManagerEmployee.FullName,
                UserName = project.ResponsibleUnitManagerEmployee.UserName,
                MilitaryNumber = project.ResponsibleUnitManagerEmployee.MilitaryNumber,
                GradeName = project.ResponsibleUnitManagerEmployee.GradeName,
                StatusId = project.ResponsibleUnitManagerEmployee.StatusId
            } : null;
            
            return new AssignedProjectDto
            {
                Id = project.Id,
                ApplicationName = project.ApplicationName,
                ProjectOwnerEmployee = projectOwnerEmployeeDto,
                AlternativeOwnerEmployee = alternativeOwnerEmployeeDto,
                ResponsibleUnitManagerEmployee = responsibleUnitManagerEmployeeDto,
                OwningUnit = project.OwningUnitEntity?.Name ?? "",
                OwningUnitId = project.OwningUnitId,
                AnalystEmployees = analystEmployees,
                ProjectOwner = project.ProjectOwnerEmployee?.FullName  ?? "",
                ProjectOwnerId = project.ProjectOwnerId,
                AlternativeOwnerId = project.AlternativeOwnerId,
                ResponsibleUnitManagerId = project.ResponsibleUnitManagerId,
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

    public async Task<IEnumerable<Project>> GetProjectsWithTimelinesAsync()
    {
        // Performance optimized: Get ALL projects with basic timeline info only (no sprints/tasks)
        return await _context.Projects
            .Include(p => p.Timelines!) // Only include timelines, no sprints/tasks
            .Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .OrderBy(p => p.ApplicationName)
            .ToListAsync();
    }

    public async Task<Project?> GetProjectWithTimelinesAsync(int projectId)
    {
        return await _context.Projects
            .Include(p => p.Timelines!)
                .ThenInclude(t => t.Tasks!)
                    .ThenInclude(task => task.Assignments)
                        .ThenInclude(e => e.Employee)
            .Include(p => p.Timelines!)
                .ThenInclude(t => t.Tasks!)
                    .ThenInclude(task => task.DependentTasks)
            .Include(p => p.Timelines!)
                .ThenInclude(t => t.Tasks!) 
            .Include(p => p.ProjectOwnerEmployee)
            .Include(p => p.OwningUnitEntity)
            .FirstOrDefaultAsync(p => p.Id == projectId);
    }

    public async Task<List<string>> CheckProjectDependenciesAsync(int projectId)
    {
        var dependencies = new List<string>();

        // Check Timelines
        var timelinesCount = await _context.Timelines
            .CountAsync(t => t.ProjectId == projectId);
        if (timelinesCount > 0)
        {
            dependencies.Add($"{timelinesCount} Timeline(s)");
        }

        // Check ProjectRequirements
        var requirementsCount = await _context.ProjectRequirements
            .CountAsync(pr => pr.ProjectId == projectId);
        if (requirementsCount > 0)
        {
            dependencies.Add($"{requirementsCount} Project Requirement(s)");
        }

        // Check Tasks (through ProjectRequirements)
        var tasksCount = await _context.Tasks
            .CountAsync(t => t.ProjectRequirement != null && t.ProjectRequirement.ProjectId == projectId);
        if (tasksCount > 0)
        {
            dependencies.Add($"{tasksCount} Task(s)");
        }

        // Check DesignRequests (through Tasks)
        var designRequestsCount = await _context.DesignRequests
            .CountAsync(dr => dr.Task != null && dr.Task.ProjectRequirement != null && dr.Task.ProjectRequirement.ProjectId == projectId);
        if (designRequestsCount > 0)
        {
            dependencies.Add($"{designRequestsCount} Design Request(s)");
        }

        return dependencies;
    }
}


