using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using PMA.Infrastructure.Data;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/quick-actions")]
public class QuickActionsController : ApiBaseController
{
    private readonly ApplicationDbContext _context;

    public QuickActionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get quick actions data including unassigned projects, projects without requirements, and available members
    /// </summary>
    [HttpGet("data")]
    public async Task<IActionResult> GetQuickActionsData()
    {
        try
        {
            // Get unassigned projects (projects with no analysts assigned)
            // Active statuses: New, UnderStudy, UnderDevelopment, UnderTesting
            var unassignedProjects = await _context.Projects
                .Where(p => !_context.ProjectAnalysts.Any(pa => pa.ProjectId == p.Id) &&
                           (p.Status == Core.Entities.ProjectStatus.New ||
                            p.Status == Core.Entities.ProjectStatus.UnderStudy ||
                            p.Status == Core.Entities.ProjectStatus.UnderDevelopment ||
                            p.Status == Core.Entities.ProjectStatus.UnderTesting))
                .Include(p => p.ProjectOwner)
                .Include(p => p.OwningUnit)
                .Select(p => new
                {
                    id = p.Id,
                    applicationName = p.ApplicationName,
                    projectOwner = p.ProjectOwner,
                    owningUnit = p.OwningUnit,
                    status = p.Status.ToString(),
                    startDate = p.StartDate,
                    expectedCompletionDate = p.ExpectedCompletionDate
                })
                .ToListAsync();

            // Get projects without requirements (active projects with no requirements)
            var projectsWithoutRequirements = await _context.Projects
                .Where(p => !_context.ProjectRequirements.Any(pr => pr.ProjectId == p.Id) &&
                           (p.Status == Core.Entities.ProjectStatus.New ||
                            p.Status == Core.Entities.ProjectStatus.UnderStudy ||
                            p.Status == Core.Entities.ProjectStatus.UnderDevelopment ||
                            p.Status == Core.Entities.ProjectStatus.UnderTesting))
                .Include(p => p.ProjectOwner)
                .Include(p => p.OwningUnit)
                .Select(p => new
                {
                    id = p.Id,
                    applicationName = p.ApplicationName,
                    projectOwner = p.ProjectOwner,
                    owningUnit = p.OwningUnit,
                    status = p.Status.ToString(),
                    startDate = p.StartDate,
                    expectedCompletionDate = p.ExpectedCompletionDate
                })
                .ToListAsync();

            // Get available members (analysts who can be assigned to projects)
            // This gets users with analyst role who are not currently overloaded
            var availableMembers = await _context.Users
                .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id && 
                           ur.Role.Name.Contains("Analyst")))
                .Select(u => new
                {
                    id = u.Id,
                    fullName = u.FullName,
                    email = u.Email,
                    department = u.Department != null ? u.Department : "",
                    assignedProjectsCount = _context.ProjectAnalysts
                        .Count(pa => pa.AnalystId == u.Id && 
                              (pa.Project.Status == Core.Entities.ProjectStatus.New ||
                               pa.Project.Status == Core.Entities.ProjectStatus.UnderStudy ||
                               pa.Project.Status == Core.Entities.ProjectStatus.UnderDevelopment ||
                               pa.Project.Status == Core.Entities.ProjectStatus.UnderTesting))
                })
                .ToListAsync();

            // Calculate quick action stats
            var stats = new
            {
                unassignedProjects = unassignedProjects.Count,
                projectsWithoutRequirements = projectsWithoutRequirements.Count,
                availableMembers = availableMembers.Count,
                pendingRequirements = await _context.ProjectRequirements
                    .Where(pr => pr.Status == RequirementStatusEnum.New || pr.Status == RequirementStatusEnum.ManagerReview)
                    .CountAsync(),
                overdueProjects = await _context.Projects
                    .Where(p => p.ExpectedCompletionDate < DateTime.UtcNow &&
                               p.Status != Core.Entities.ProjectStatus.Production)
                    .CountAsync()
            };

            return Ok(new
            {
                success = true,
                data = new
                {
                    unassignedProjects,
                    projectsWithoutRequirements,
                    availableMembers,
                    stats
                },
                message = "Quick actions data retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving quick actions data",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get only unassigned projects
    /// </summary>
    [HttpGet("unassigned-projects")]
    public async Task<IActionResult> GetUnassignedProjects()
    {
        try
        {
            var unassignedProjects = await _context.Projects
                .Where(p => !_context.ProjectAnalysts.Any(pa => pa.ProjectId == p.Id) &&
                           (p.Status == Core.Entities.ProjectStatus.New ||
                            p.Status == Core.Entities.ProjectStatus.UnderStudy ||
                            p.Status == Core.Entities.ProjectStatus.UnderDevelopment ||
                            p.Status == Core.Entities.ProjectStatus.UnderTesting))
                .Include(p => p.ProjectOwner)
                .Include(p => p.OwningUnit)
                .Select(p => new
                {
                    id = p.Id,
                    applicationName = p.ApplicationName,
                    projectOwner = p.ProjectOwner,
                    owningUnit = p.OwningUnit,
                    status = p.Status.ToString(),
                    startDate = p.StartDate,
                    expectedCompletionDate = p.ExpectedCompletionDate,
                    description = p.Description
                })
                .OrderBy(p => p.startDate)
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = unassignedProjects,
                count = unassignedProjects.Count,
                message = "Unassigned projects retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving unassigned projects",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get projects without requirements
    /// </summary>
    [HttpGet("projects-without-requirements")]
    public async Task<IActionResult> GetProjectsWithoutRequirements()
    {
        try
        {
            var projectsWithoutRequirements = await _context.Projects
                .Where(p => !_context.ProjectRequirements.Any(pr => pr.ProjectId == p.Id) &&
                           (p.Status == Core.Entities.ProjectStatus.New ||
                            p.Status == Core.Entities.ProjectStatus.UnderStudy ||
                            p.Status == Core.Entities.ProjectStatus.UnderDevelopment ||
                            p.Status == Core.Entities.ProjectStatus.UnderTesting))
                .Include(p => p.ProjectOwner)
                .Include(p => p.OwningUnit)
                .Select(p => new
                {
                    id = p.Id,
                    applicationName = p.ApplicationName,
                    projectOwner = p.ProjectOwner,
                    owningUnit = p.OwningUnit,
                    status = p.Status.ToString(),
                    startDate = p.StartDate,
                    expectedCompletionDate = p.ExpectedCompletionDate,
                    description = p.Description
                })
                .OrderBy(p => p.startDate)
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = projectsWithoutRequirements,
                count = projectsWithoutRequirements.Count,
                message = "Projects without requirements retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving projects without requirements",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get available analysts who can be assigned to projects
    /// </summary>
    [HttpGet("available-analysts")]
    public async Task<IActionResult> GetAvailableAnalysts()
    {
        try
        {
            var availableAnalysts = await _context.Users
                .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id && 
                           ur.Role.Name.Contains("Analyst")))
                .Select(u => new
                {
                    id = u.Id,
                    fullName = u.FullName,
                    email = u.Email,
                    department = u.Department != null ? u.Department : "",
             
                    assignedProjectsCount = _context.ProjectAnalysts
                        .Count(pa => pa.AnalystId == u.Id && 
                              (pa.Project.Status == Core.Entities.ProjectStatus.New ||
                               pa.Project.Status == Core.Entities.ProjectStatus.UnderStudy ||
                               pa.Project.Status == Core.Entities.ProjectStatus.UnderDevelopment ||
                               pa.Project.Status == Core.Entities.ProjectStatus.UnderTesting)),
                    activeRequirementsCount = _context.Requirements
                        .Count(r => r.AssignedToId == u.Id &&
                               r.Status != Core.Entities.RequirementStatus.Completed )
                })
                .OrderBy(u => u.assignedProjectsCount)
                .ThenBy(u => u.fullName)
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = availableAnalysts,
                count = availableAnalysts.Count,
                message = "Available analysts retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving available analysts",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get quick action statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetQuickActionStats()
    {
        try
        {
            var stats = new
            {
                unassignedProjects = await _context.Projects
                    .Where(p => !_context.ProjectAnalysts.Any(pa => pa.ProjectId == p.Id) &&
                               (p.Status == Core.Entities.ProjectStatus.New ||
                                p.Status == Core.Entities.ProjectStatus.UnderStudy ||
                                p.Status == Core.Entities.ProjectStatus.UnderDevelopment ||
                                p.Status == Core.Entities.ProjectStatus.UnderTesting))
                    .CountAsync(),
                
                projectsWithoutRequirements = await _context.Projects
                    .Where(p => !_context.ProjectRequirements.Any(pr => pr.ProjectId == p.Id) &&
                               (p.Status == Core.Entities.ProjectStatus.New ||
                                p.Status == Core.Entities.ProjectStatus.UnderStudy ||
                                p.Status == Core.Entities.ProjectStatus.UnderDevelopment ||
                                p.Status == Core.Entities.ProjectStatus.UnderTesting))
                    .CountAsync(),
                
                pendingRequirements = await _context.ProjectRequirements
                    .Where(pr => pr.Status == RequirementStatusEnum.New || pr.Status == RequirementStatusEnum.ManagerReview)
                    .CountAsync(),
                
                overdueProjects = await _context.Projects
                    .Where(p => p.ExpectedCompletionDate < DateTime.UtcNow &&
                               p.Status != Core.Entities.ProjectStatus.Production)
                    .CountAsync(),
                
                availableAnalysts = await _context.Users
                    .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id && 
                               ur.Role.Name.Contains("Analyst")))
                    .CountAsync(),
                
                tasksNeedingAssignment = await _context.Tasks
                    .Where(t => !_context.TaskAssignments.Any(ta => ta.TaskId == t.Id) &&
                               t.StatusId != Core.Entities.TaskStatus.Completed  )
                    .CountAsync()
            };

            return Ok(new
            {
                success = true,
                data = stats,
                message = "Quick action stats retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving quick action stats",
                error = ex.Message
            });
        }
    }
}
