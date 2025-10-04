using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using PMA.Core.Enums;
using PMA.Infrastructure.Data;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/quick-actions1")]
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
                           (p.Status == ProjectStatus.New ||
                            p.Status == ProjectStatus.UnderStudy ||
                            p.Status == ProjectStatus.UnderDevelopment ||
                            p.Status == ProjectStatus.UnderTesting))
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
                           (p.Status == ProjectStatus.New ||
                            p.Status == ProjectStatus.UnderStudy ||
                            p.Status == ProjectStatus.UnderDevelopment ||
                            p.Status == ProjectStatus.UnderTesting))
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
                           ur.Role != null && ur.Role.Name.Contains("Analyst")))
                .Select(u => new
                {
                    id = u.Id,
                    fullName = u.FullName,
                    email = u.Email,
                    department = u.Department != null ? u.Department : "",
                    assignedProjectsCount = _context.ProjectAnalysts
                        .Count(pa => pa.AnalystId == u.Id && 
                              pa.Project != null &&
                              (pa.Project.Status == ProjectStatus.New ||
                               pa.Project.Status == ProjectStatus.UnderStudy ||
                               pa.Project.Status == ProjectStatus.UnderDevelopment ||
                               pa.Project.Status == ProjectStatus.UnderTesting))
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
                               p.Status != ProjectStatus.Production)
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
                           (p.Status == ProjectStatus.New ||
                            p.Status == ProjectStatus.UnderStudy ||
                            p.Status == ProjectStatus.UnderDevelopment ||
                            p.Status == ProjectStatus.UnderTesting))
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
                           (p.Status == ProjectStatus.New ||
                            p.Status == ProjectStatus.UnderStudy ||
                            p.Status == ProjectStatus.UnderDevelopment ||
                            p.Status == ProjectStatus.UnderTesting))
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
    [HttpGet("available-members")] // Alias for frontend compatibility
    public async Task<IActionResult> GetAvailableAnalysts()
    {
        try
        {
            var availableAnalysts = await _context.Users
                .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id && 
                           ur.Role != null && ur.Role.Name.Contains("Analyst")))
                .Select(u => new
                {
                    id = u.Id,
                    fullName = u.FullName,
                    email = u.Email,
                    department = u.Department != null ? u.Department : "",
             
                    assignedProjectsCount = _context.ProjectAnalysts
                        .Count(pa => pa.AnalystId == u.Id && 
                              pa.Project != null &&
                              (pa.Project.Status == ProjectStatus.New ||
                               pa.Project.Status == ProjectStatus.UnderStudy ||
                               pa.Project.Status == ProjectStatus.UnderDevelopment ||
                               pa.Project.Status == ProjectStatus.UnderTesting)),
                    activeRequirementsCount = _context.Requirements
                        .Count(r => r.AssignedToId == u.Id &&
                               r.Status != RequirementStatus.Completed )
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
                               (p.Status == ProjectStatus.New ||
                                p.Status == ProjectStatus.UnderStudy ||
                                p.Status == ProjectStatus.UnderDevelopment ||
                                p.Status == ProjectStatus.UnderTesting))
                    .CountAsync(),
                
                projectsWithoutRequirements = await _context.Projects
                    .Where(p => !_context.ProjectRequirements.Any(pr => pr.ProjectId == p.Id) &&
                               (p.Status == ProjectStatus.New ||
                                p.Status == ProjectStatus.UnderStudy ||
                                p.Status == ProjectStatus.UnderDevelopment ||
                                p.Status == ProjectStatus.UnderTesting))
                    .CountAsync(),
                
                pendingRequirements = await _context.ProjectRequirements
                    .Where(pr => pr.Status == RequirementStatusEnum.New || pr.Status == RequirementStatusEnum.ManagerReview)
                    .CountAsync(),
                
                overdueProjects = await _context.Projects
                    .Where(p => p.ExpectedCompletionDate < DateTime.UtcNow &&
                               p.Status != ProjectStatus.Production)
                    .CountAsync(),
                
                availableAnalysts = await _context.Users
                    .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id && 
                               ur.Role != null && ur.Role.Name.Contains("Analyst")))
                    .CountAsync(),
                
                tasksNeedingAssignment = await _context.Tasks
                    .Where(t => !_context.TaskAssignments.Any(ta => ta.TaskId == t.Id) &&
                               t.StatusId != Core.Enums.TaskStatus.Completed  )
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

    /// <summary>
    /// Get quick actions data including stats and available actions
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetQuickActions()
    {
        try
        {
            // Get stats
            var stats = new
            {
                pendingRequirements = await _context.ProjectRequirements
                    .Where(pr => pr.Status == RequirementStatusEnum.New || pr.Status == RequirementStatusEnum.ManagerReview)
                    .CountAsync(),
                
                unassignedTasks = await _context.Tasks
                    .Where(t => !_context.TaskAssignments.Any(ta => ta.TaskId == t.Id) &&
                               t.StatusId != Core.Enums.TaskStatus.Completed)
                    .CountAsync(),
                
                unassignedProjects = await _context.Projects
                    .Where(p => !_context.ProjectAnalysts.Any(pa => pa.ProjectId == p.Id) &&
                               (p.Status == ProjectStatus.New ||
                                p.Status == ProjectStatus.UnderStudy ||
                                p.Status == ProjectStatus.UnderDevelopment ||
                                p.Status == ProjectStatus.UnderTesting))
                    .CountAsync(),
                
                pendingApprovals = await _context.ProjectRequirements
                    .Where(pr => pr.Status == RequirementStatusEnum.ManagerReview)
                    .CountAsync(),
                
                overdueItems = await _context.Projects
                    .Where(p => p.ExpectedCompletionDate < DateTime.UtcNow &&
                               p.Status != ProjectStatus.Production)
                    .CountAsync(),
                
                newNotifications = 0, // TODO: Implement notifications count
                
                activeProjects = await _context.Projects
                    .Where(p => p.Status == ProjectStatus.New ||
                               p.Status == ProjectStatus.UnderStudy ||
                               p.Status == ProjectStatus.UnderDevelopment ||
                               p.Status == ProjectStatus.UnderTesting)
                    .CountAsync(),
                
                projectsWithoutRequirements = await _context.Projects
                    .Where(p => !_context.ProjectRequirements.Any(pr => pr.ProjectId == p.Id) &&
                               (p.Status == ProjectStatus.New ||
                                p.Status == ProjectStatus.UnderStudy ||
                                p.Status == ProjectStatus.UnderDevelopment ||
                                p.Status == ProjectStatus.UnderTesting))
                    .CountAsync(),
                
                availableMembers = await _context.Users
                    .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id && 
                               ur.Role != null && ur.Role.Name.Contains("Analyst")))
                    .CountAsync()
            };

            // Generate actions based on stats
            var actions = new List<object>();

            // Review Requirements
            if (stats.pendingRequirements > 0)
            {
                actions.Add(new
                {
                    id = "review-requirements",
                    title = "Review Requirements",
                    description = "Review pending project requirements",
                    icon = "document-check",
                    priority = "high",
                    count = stats.pendingRequirements,
                    action = "REVIEW_REQUIREMENTS",
                    variant = "warning",
                    permissions = new[] { "projects.manage" },
                    href = "/project-requirements?status=pending"
                });
            }

            // Unassigned Projects
            if (stats.unassignedProjects > 0)
            {
                actions.Add(new
                {
                    id = "unassigned-projects",
                    title = "Assign Projects",
                    description = "Assign analysts to unassigned projects",
                    icon = "user-plus",
                    priority = "high",
                    count = stats.unassignedProjects,
                    action = "ASSIGN_PROJECTS",
                    variant = "secondary",
                    permissions = new[] { "projects.manage" },
                    href = "/projects?filter=unassigned"
                });
            }

            // Projects Without Requirements
            if (stats.projectsWithoutRequirements > 0)
            {
                actions.Add(new
                {
                    id = "projects-without-requirements",
                    title = "Add Requirements",
                    description = "Add requirements to projects missing them",
                    icon = "document-plus",
                    priority = "high",
                    count = stats.projectsWithoutRequirements,
                    action = "ADD_REQUIREMENTS",
                    variant = "warning",
                    permissions = new[] { "projects.manage" }
                });
            }

            // Available Members
            if (stats.availableMembers > 0)
            {
                actions.Add(new
                {
                    id = "available-members",
                    title = "Assign Available Members",
                    description = "Assign available team members to tasks",
                    icon = "users",
                    priority = "medium",
                    count = stats.availableMembers,
                    action = "ASSIGN_AVAILABLE_MEMBERS",
                    variant = "success",
                    permissions = new[] { "projects.manage" }
                });
            }

            // View Overdue Items
            if (stats.overdueItems > 0)
            {
                actions.Add(new
                {
                    id = "view-overdue",
                    title = "View Overdue Items",
                    description = "Review overdue projects and tasks",
                    icon = "exclamation-triangle",
                    priority = "high",
                    count = stats.overdueItems,
                    action = "VIEW_OVERDUE",
                    variant = "danger"
                });
            }

            var result = new
            {
                stats,
                actions,
                lastUpdated = DateTime.UtcNow.ToString("o")
            };

            return Ok(new
            {
                success = true,
                data = result,
                message = "Quick actions retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving quick actions",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Refresh quick actions data
    /// </summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshActions()
    {
        try
        {
            // This endpoint essentially does the same as GetQuickActions
            // but could be used to force a refresh of cached data
            
            // Get stats
            var stats = new
            {
                pendingRequirements = await _context.ProjectRequirements
                    .Where(pr => pr.Status == RequirementStatusEnum.New || pr.Status == RequirementStatusEnum.ManagerReview)
                    .CountAsync(),
                
                unassignedTasks = await _context.Tasks
                    .Where(t => !_context.TaskAssignments.Any(ta => ta.TaskId == t.Id) &&
                               t.StatusId != Core.Enums.TaskStatus.Completed)
                    .CountAsync(),
                
                unassignedProjects = await _context.Projects
                    .Where(p => !_context.ProjectAnalysts.Any(pa => pa.ProjectId == p.Id) &&
                               (p.Status == ProjectStatus.New ||
                                p.Status == ProjectStatus.UnderStudy ||
                                p.Status == ProjectStatus.UnderDevelopment ||
                                p.Status == ProjectStatus.UnderTesting))
                    .CountAsync(),
                
                pendingApprovals = await _context.ProjectRequirements
                    .Where(pr => pr.Status == RequirementStatusEnum.ManagerReview)
                    .CountAsync(),
                
                overdueItems = await _context.Projects
                    .Where(p => p.ExpectedCompletionDate < DateTime.UtcNow &&
                               p.Status != ProjectStatus.Production)
                    .CountAsync(),
                
                newNotifications = 0, // TODO: Implement notifications count
                
                activeProjects = await _context.Projects
                    .Where(p => p.Status == ProjectStatus.New ||
                               p.Status == ProjectStatus.UnderStudy ||
                               p.Status == ProjectStatus.UnderDevelopment ||
                               p.Status == ProjectStatus.UnderTesting)
                    .CountAsync(),
                
                projectsWithoutRequirements = await _context.Projects
                    .Where(p => !_context.ProjectRequirements.Any(pr => pr.ProjectId == p.Id) &&
                               (p.Status == ProjectStatus.New ||
                                p.Status == ProjectStatus.UnderStudy ||
                                p.Status == ProjectStatus.UnderDevelopment ||
                                p.Status == ProjectStatus.UnderTesting))
                    .CountAsync(),
                
                availableMembers = await _context.Users
                    .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id && 
                               ur.Role != null && ur.Role.Name.Contains("Analyst")))
                    .CountAsync()
            };

            // Generate actions based on stats
            var actions = new List<object>();

            // Review Requirements
            if (stats.pendingRequirements > 0)
            {
                actions.Add(new
                {
                    id = "review-requirements",
                    title = "Review Requirements",
                    description = "Review pending project requirements",
                    icon = "document-check",
                    priority = "high",
                    count = stats.pendingRequirements,
                    action = "REVIEW_REQUIREMENTS",
                    variant = "warning",
                    permissions = new[] { "projects.manage" },
                    href = "/project-requirements?status=pending"
                });
            }

            // Unassigned Projects
            if (stats.unassignedProjects > 0)
            {
                actions.Add(new
                {
                    id = "unassigned-projects",
                    title = "Assign Projects",
                    description = "Assign analysts to unassigned projects",
                    icon = "user-plus",
                    priority = "high",
                    count = stats.unassignedProjects,
                    action = "ASSIGN_PROJECTS",
                    variant = "secondary",
                    permissions = new[] { "projects.manage" },
                    href = "/projects?filter=unassigned"
                });
            }

            // Projects Without Requirements
            if (stats.projectsWithoutRequirements > 0)
            {
                actions.Add(new
                {
                    id = "projects-without-requirements",
                    title = "Add Requirements",
                    description = "Add requirements to projects missing them",
                    icon = "document-plus",
                    priority = "high",
                    count = stats.projectsWithoutRequirements,
                    action = "ADD_REQUIREMENTS",
                    variant = "warning",
                    permissions = new[] { "projects.manage" }
                });
            }

            // Available Members
            if (stats.availableMembers > 0)
            {
                actions.Add(new
                {
                    id = "available-members",
                    title = "Assign Available Members",
                    description = "Assign available team members to tasks",
                    icon = "users",
                    priority = "medium",
                    count = stats.availableMembers,
                    action = "ASSIGN_AVAILABLE_MEMBERS",
                    variant = "success",
                    permissions = new[] { "projects.manage" }
                });
            }

            // View Overdue Items
            if (stats.overdueItems > 0)
            {
                actions.Add(new
                {
                    id = "view-overdue",
                    title = "View Overdue Items",
                    description = "Review overdue projects and tasks",
                    icon = "exclamation-triangle",
                    priority = "high",
                    count = stats.overdueItems,
                    action = "VIEW_OVERDUE",
                    variant = "danger"
                });
            }

            var result = new
            {
                stats,
                actions,
                lastUpdated = DateTime.UtcNow.ToString("o")
            };

            return Ok(new
            {
                success = true,
                data = result,
                message = "Quick actions refreshed successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while refreshing quick actions",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get overdue items that need attention
    /// </summary>
    [HttpGet("overdue")]
    public async Task<IActionResult> GetOverdueItems()
    {
        try
        {
            var overdueItems = new List<object>();

            // Overdue projects
            var overdueProjects = await _context.Projects
                .Where(p => p.ExpectedCompletionDate < DateTime.UtcNow &&
                           p.Status != ProjectStatus.Production)
                .Select(p => new
                {
                    id = p.Id,
                    title = p.ApplicationName,
                    type = "project",
                    dueDate = p.ExpectedCompletionDate.ToString("o"),
                    priority = "high",
                    assignee = p.ProjectOwner,
                    projectName = p.ApplicationName
                })
                .ToListAsync();

            overdueItems.AddRange(overdueProjects);

            // Overdue tasks
            var overdueTasks = await _context.Tasks
                .Where(t => t.EndDate < DateTime.UtcNow &&
                           t.StatusId != Core.Enums.TaskStatus.Completed)
                .Include(t => t.Assignments)
                .ThenInclude(a => a.Employee)
                .ToListAsync();

            var overdueTasksFormatted = overdueTasks.Select(t => new
            {
                id = t.Id,
                title = t.Name,
                type = "task",
                dueDate = t.EndDate.ToString("o"),
                priority = t.PriorityId == Priority.High ? "high" : 
                          t.PriorityId == Priority.Medium ? "medium" : "low",
                assignee = t.Assignments.FirstOrDefault()?.Employee?.FullName ?? null,
                projectName = "Task" // TODO: Add project relationship if available
            }).ToList();

            overdueItems.AddRange(overdueTasksFormatted);

            // Overdue requirements
            var overdueRequirementsQuery = await _context.ProjectRequirements
                .Where(pr => pr.ExpectedCompletionDate < DateTime.UtcNow &&
                           pr.Status != RequirementStatusEnum.Completed &&
                           pr.Status != RequirementStatusEnum.Cancelled)
                .Include(pr => pr.Analyst)
                .Include(pr => pr.Project)
                .ToListAsync();

            var overdueRequirements = overdueRequirementsQuery.Select(pr => new
            {
                id = pr.Id,
                title = pr.Name,
                type = "requirement",
                dueDate = pr.ExpectedCompletionDate?.ToString("o") ?? DateTime.UtcNow.ToString("o"),
                priority = pr.Priority == RequirementPriority.High ? "high" : 
                          pr.Priority == RequirementPriority.Medium ? "medium" : "low",
                assignee = pr.Analyst?.FullName ?? null,
                projectName = pr.Project?.ApplicationName ?? null
            }).ToList();

            overdueItems.AddRange(overdueRequirements);

            return Ok(new
            {
                success = true,
                data = overdueItems,
                count = overdueItems.Count,
                message = "Overdue items retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving overdue items",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get pending approvals
    /// </summary>
    [HttpGet("pending-approvals")]
    public async Task<IActionResult> GetPendingApprovals()
    {
        try
        {
            var pendingApprovals = new List<object>();

            // Pending requirement approvals
            var pendingRequirements = await _context.ProjectRequirements
                .Where(pr => pr.Status == RequirementStatusEnum.ManagerReview)
                .Include(pr => pr.Creator)
                .Include(pr => pr.Project)
                .ToListAsync();

            var formattedPendingRequirements = pendingRequirements.Select(pr => new
            {
                id = pr.Id,
                title = pr.Name,
                type = "requirement",
                requestedBy = pr.Creator?.FullName ?? "Unknown",
                requestedAt = pr.CreatedAt.ToString("o"),
                currentStatus = "Manager Review",
                requestedStatus = "Approved",
                priority = pr.Priority == RequirementPriority.High ? "high" : 
                          pr.Priority == RequirementPriority.Medium ? "medium" : "low"
            }).ToList();

            pendingApprovals.AddRange(formattedPendingRequirements);

            // TODO: Add other pending approvals (project status changes, etc.) if needed

            return Ok(new
            {
                success = true,
                data = pendingApprovals,
                count = pendingApprovals.Count,
                message = "Pending approvals retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving pending approvals",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get team members with workload information
    /// </summary>
    [HttpGet("team-members")]
    public async Task<IActionResult> GetTeamMembers()
    {
        try
        {
            var users = await _context.Users
                .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id))
                .ToListAsync();

            var teamMembers = new List<object>();

            foreach (var user in users)
            {
                var userRole = await _context.UserRoles
                    .Where(ur => ur.UserId == user.Id)
                    .Include(ur => ur.Role)
                    .FirstOrDefaultAsync();

                var currentTasks = await _context.TaskAssignments.CountAsync(ta => ta.PrsId == user.Id) +
                                  await _context.ProjectRequirements.CountAsync(pr => pr.AssignedAnalyst == user.Id);

                teamMembers.Add(new
                {
                    id = user.Id,
                    name = user.FullName,
                    role = userRole?.Role?.Name ?? "Unknown",
                    department = user.Department ?? "",
                    currentTasks = currentTasks,
                    workload = currentTasks > 5 ? "high" : currentTasks > 2 ? "medium" : "low",
                    availability = currentTasks > 5 ? "busy" : "available"
                });
            }

            return Ok(new
            {
                success = true,
                data = teamMembers,
                count = teamMembers.Count,
                message = "Team members retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving team members",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Approve or reject a status change
    /// </summary>
    [HttpPost("approve/{id}")]
    public async Task<IActionResult> ApproveStatusChange(int id, [FromBody] ApproveStatusRequest request)
    {
        try
        {
            // Find the item to approve (could be requirement, project, etc.)
            var requirement = await _context.ProjectRequirements.FindAsync(id);
            
            if (requirement != null)
            {
                if (request.Approved)
                {
                    requirement.Status = RequirementStatusEnum.Approved;
                }
                else
                {
                    requirement.Status = RequirementStatusEnum.Cancelled;
                }
                
                requirement.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Requirement {id} {(request.Approved ? "approved" : "rejected")} successfully"
                });
            }

            // TODO: Add approval logic for other entities (projects, tasks, etc.)

            return NotFound(new
            {
                success = false,
                message = $"Item with id {id} not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while processing the approval",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Assign a task to a team member
    /// </summary>
    [HttpPost("assign-task/{taskId}")]
    public async Task<IActionResult> AssignTask(int taskId, [FromBody] AssignTaskRequest request)
    {
        try
        {
            var task = await _context.Tasks.FindAsync(taskId);
            
            if (task == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = $"Task with id {taskId} not found"
                });
            }

            // Check if assignment already exists
            var existingAssignment = await _context.TaskAssignments
                .FirstOrDefaultAsync(ta => ta.TaskId == taskId);

            if (existingAssignment != null)
            {
                // Update existing assignment
                existingAssignment.PrsId = request.AssigneeId;
                existingAssignment.AssignedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new assignment
                var assignment = new TaskAssignment
                {
                    TaskId = taskId,
                    PrsId = request.AssigneeId,
                    AssignedAt = DateTime.UtcNow
                };
                
                _context.TaskAssignments.Add(assignment);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Task {taskId} assigned to user {request.AssigneeId} successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while assigning the task",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Dismiss an action (mark as completed or dismissed)
    /// </summary>
    [HttpPost("{actionId}/dismiss")]
    public async Task<IActionResult> DismissAction(string actionId)
    {
        try
        {
            // For now, this is a placeholder - in a real implementation,
            // you might have an Action entity or mark items as dismissed
            // This could be used to dismiss notifications or mark quick actions as handled
            
            // TODO: Implement actual dismissal logic based on your business requirements
            // For example, you could have a QuickActionDismissal table or update status fields
            
            await System.Threading.Tasks.Task.CompletedTask; // Dummy await to satisfy async requirement

            return Ok(new
            {
                success = true,
                message = $"Action {actionId} dismissed successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while dismissing the action",
                error = ex.Message
            });
        }
    }

    public class ApproveStatusRequest
    {
        public bool Approved { get; set; }
        public string? Comments { get; set; }
    }

    public class AssignTaskRequest
    {
        public int AssigneeId { get; set; }
        public string? Priority { get; set; }
    }
}
