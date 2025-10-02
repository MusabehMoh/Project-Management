//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using PMA.Infrastructure.Data;

//namespace PMA.Api.Controllers;

//[ApiController]
//[Route("api/team-workload")]
//public class TeamWorkloadController : ApiBaseController
//{
//    private readonly ApplicationDbContext _context;
//    private readonly ILogger<TeamWorkloadController> _logger;

//    public TeamWorkloadController(
//        ApplicationDbContext context,
//        ILogger<TeamWorkloadController> logger)
//    {
//        _context = context;
//        _logger = logger;
//    }

//    /// <summary>
//    /// Get team workload performance metrics for all team members
//    /// Returns: workload, busy status, performance scores, and task counts
//    /// </summary>
//    [HttpGet("performance")]
//    public async Task<IActionResult> GetTeamWorkloadPerformance(
//        [FromQuery] int? departmentId = null,
//        [FromQuery] string? busyStatus = null,
//        [FromQuery] int page = 1,
//        [FromQuery] int limit = 10)
//    {
//        try
//        {
//            var today = DateTime.UtcNow.Date;

//            // Get team members with their workload data
//            var teamMembersQuery = _context.Users
//                .Include(u => u.Department)
//                .AsQueryable();

//            // Filter by department if provided
//            if (departmentId.HasValue)
//            {
//                teamMembersQuery = teamMembersQuery.Where(u => u.DepartmentId == departmentId.Value);
//            }

//            var teamMembers = await teamMembersQuery
//                .Select(u => new
//                {
//                    userId = u.Id,
//                    fullName = u.FullName,
//                    email = u.Email,
//                    department = u.Department != null ? u.Department.Name : "N/A",
//                    departmentId = u.DepartmentId,
                    
//                    // Task assignments and counts
//                    assignedTasksCount = _context.TaskAssignments
//                        .Count(ta => ta.EmployeeId == u.Id &&
//                               ta.Task.StatusId != Core.Entities.TaskStatus.Completed &&
//                               ta.Task.StatusId != Core.Entities.TaskStatus.Cancelled),
                    
//                    completedTasksCount = _context.TaskAssignments
//                        .Count(ta => ta.EmployeeId == u.Id &&
//                               ta.Task.StatusId == Core.Entities.TaskStatus.Completed),
                    
//                    overdueTasksCount = _context.TaskAssignments
//                        .Count(ta => ta.EmployeeId == u.Id &&
//                               ta.Task.EndDate < today &&
//                               ta.Task.StatusId != Core.Entities.TaskStatus.Completed &&
//                               ta.Task.StatusId != Core.Entities.TaskStatus.Cancelled),
                    
//                    // Project assignments
//                    assignedProjectsCount = _context.ProjectAnalysts
//                        .Count(pa => pa.AnalystId == u.Id &&
//                              (pa.Project.Status == Core.Entities.ProjectStatus.New ||
//                               pa.Project.Status == Core.Entities.ProjectStatus.UnderStudy ||
//                               pa.Project.Status == Core.Entities.ProjectStatus.UnderDevelopment ||
//                               pa.Project.Status == Core.Entities.ProjectStatus.UnderTesting)),
                    
//                    // Requirements assignments
//                    assignedRequirementsCount = _context.Requirements
//                        .Count(r => r.AssignedToId == u.Id &&
//                               r.Status != Core.Entities.RequirementStatus.Completed &&
//                               r.Status != Core.Entities.RequirementStatus.Cancelled),
                    
//                    // Calculate busy until date (latest task end date)
//                    busyUntil = _context.TaskAssignments
//                        .Where(ta => ta.EmployeeId == u.Id &&
//                               ta.Task.StatusId != Core.Entities.TaskStatus.Completed &&
//                               ta.Task.StatusId != Core.Entities.TaskStatus.Cancelled)
//                        .Max(ta => (DateTime?)ta.Task.EndDate),
                    
//                    // Estimated and actual hours
//                    totalEstimatedHours = _context.TaskAssignments
//                        .Where(ta => ta.EmployeeId == u.Id &&
//                               ta.Task.StatusId != Core.Entities.TaskStatus.Completed)
//                        .Sum(ta => (decimal?)ta.Task.EstimatedHours) ?? 0,
                    
//                    totalActualHours = _context.TaskAssignments
//                        .Where(ta => ta.EmployeeId == u.Id &&
//                               ta.Task.StatusId == Core.Entities.TaskStatus.Completed)
//                        .Sum(ta => (decimal?)ta.Task.ActualHours) ?? 0
//                })
//                .ToListAsync();

//            // Calculate metrics and busy status for each member
//            var teamMemberMetrics = teamMembers.Select(member =>
//            {
//                // Calculate workload percentage (0-100)
//                // Based on assigned tasks count - simple heuristic: 10+ tasks = 100% workload
//                var workload = Math.Min((member.assignedTasksCount * 10), 100);
                
//                // Calculate performance score (0-100)
//                // Based on completed vs assigned tasks and overdue tasks
//                var totalTasks = member.assignedTasksCount + member.completedTasksCount;
//                var completionRate = totalTasks > 0 ? (member.completedTasksCount * 100 / totalTasks) : 100;
//                var overdueRate = member.assignedTasksCount > 0 
//                    ? (member.overdueTasksCount * 100 / member.assignedTasksCount) 
//                    : 0;
//                var performance = Math.Max(0, completionRate - overdueRate);
                
//                // Determine busy status
//                string busyStatusValue = "Available";
//                if (member.busyUntil.HasValue)
//                {
//                    var daysUntilFree = (member.busyUntil.Value - today).Days;
//                    if (daysUntilFree > 7)
//                        busyStatusValue = "Very Busy";
//                    else if (daysUntilFree > 3)
//                        busyStatusValue = "Busy";
//                    else if (daysUntilFree > 0)
//                        busyStatusValue = "Moderately Busy";
//                }
                
//                return new
//                {
//                    userId = member.userId,
//                    fullName = member.fullName,
//                    email = member.email,
//                    department = member.department,
//                    departmentId = member.departmentId,
//                    busyStatus = busyStatusValue,
//                    busyUntil = member.busyUntil,
//                    metrics = new
//                    {
//                        workload = workload,
//                        performance = performance,
//                        tasksAssigned = member.assignedTasksCount,
//                        tasksCompleted = member.completedTasksCount,
//                        tasksOverdue = member.overdueTasksCount,
//                        projectsAssigned = member.assignedProjectsCount,
//                        requirementsAssigned = member.assignedRequirementsCount,
//                        estimatedHours = member.totalEstimatedHours,
//                        actualHours = member.totalActualHours
//                    }
//                };
//            }).ToList();

//            // Apply busy status filter if provided
//            if (!string.IsNullOrEmpty(busyStatus))
//            {
//                teamMemberMetrics = teamMemberMetrics
//                    .Where(m => m.busyStatus.Equals(busyStatus, StringComparison.OrdinalIgnoreCase))
//                    .ToList();
//            }

//            // Apply pagination
//            var totalCount = teamMemberMetrics.Count;
//            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
//            var paginatedData = teamMemberMetrics
//                .Skip((page - 1) * limit)
//                .Take(limit)
//                .ToList();

//            return Ok(new
//            {
//                success = true,
//                data = paginatedData,
//                pagination = new
//                {
//                    page,
//                    limit,
//                    total = totalCount,
//                    totalPages
//                },
//                message = "Team workload performance retrieved successfully"
//            });
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Error occurred while retrieving team workload performance");
//            return StatusCode(500, new
//            {
//                success = false,
//                message = "An error occurred while retrieving team workload performance",
//                error = ex.Message
//            });
//        }
//    }

//    /// <summary>
//    /// Get workload summary statistics
//    /// </summary>
//    [HttpGet("summary")]
//    public async Task<IActionResult> GetWorkloadSummary()
//    {
//        try
//        {
//            var today = DateTime.UtcNow.Date;

//            var summary = new
//            {
//                totalTeamMembers = await _context.Users.CountAsync(),
                
//                busyMembersCount = await _context.TaskAssignments
//                    .Where(ta => ta.Task.EndDate >= today &&
//                               ta.Task.StatusId != Core.Entities.TaskStatus.Completed &&
//                               ta.Task.StatusId != Core.Entities.TaskStatus.Cancelled)
//                    .Select(ta => ta.EmployeeId)
//                    .Distinct()
//                    .CountAsync(),
                
//                availableMembersCount = await _context.Users
//                    .Where(u => !_context.TaskAssignments
//                        .Any(ta => ta.EmployeeId == u.Id &&
//                               ta.Task.EndDate >= today &&
//                               ta.Task.StatusId != Core.Entities.TaskStatus.Completed &&
//                               ta.Task.StatusId != Core.Entities.TaskStatus.Cancelled))
//                    .CountAsync(),
                
//                totalActiveTasks = await _context.Tasks
//                    .Where(t => t.StatusId != Core.Entities.TaskStatus.Completed &&
//                               t.StatusId != Core.Entities.TaskStatus.Cancelled)
//                    .CountAsync(),
                
//                totalOverdueTasks = await _context.Tasks
//                    .Where(t => t.EndDate < today &&
//                               t.StatusId != Core.Entities.TaskStatus.Completed &&
//                               t.StatusId != Core.Entities.TaskStatus.Cancelled)
//                    .CountAsync(),
                
//                averageTasksPerMember = await _context.TaskAssignments
//                    .Where(ta => ta.Task.StatusId != Core.Entities.TaskStatus.Completed &&
//                               ta.Task.StatusId != Core.Entities.TaskStatus.Cancelled)
//                    .GroupBy(ta => ta.EmployeeId)
//                    .Select(g => g.Count())
//                    .DefaultIfEmpty(0)
//                    .AverageAsync()
//            };

//            return Ok(new
//            {
//                success = true,
//                data = summary,
//                message = "Workload summary retrieved successfully"
//            });
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Error occurred while retrieving workload summary");
//            return StatusCode(500, new
//            {
//                success = false,
//                message = "An error occurred while retrieving workload summary",
//                error = ex.Message
//            });
//        }
//    }

//    /// <summary>
//    /// Get individual team member workload details
//    /// </summary>
//    [HttpGet("member/{userId}")]
//    public async Task<IActionResult> GetMemberWorkload(int userId)
//    {
//        try
//        {
//            var today = DateTime.UtcNow.Date;

//            var user = await _context.Users
//                .Include(u => u.Department)
//                .FirstOrDefaultAsync(u => u.Id == userId);

//            if (user == null)
//            {
//                return NotFound(new
//                {
//                    success = false,
//                    message = "User not found"
//                });
//            }

//            // Get assigned tasks with details
//            var assignedTasks = await _context.TaskAssignments
//                .Where(ta => ta.EmployeeId == userId &&
//                           ta.Task.StatusId != Core.Entities.TaskStatus.Completed &&
//                           ta.Task.StatusId != Core.Entities.TaskStatus.Cancelled)
//                .Include(ta => ta.Task)
//                .Select(ta => new
//                {
//                    taskId = ta.TaskId,
//                    taskName = ta.Task.Name,
//                    status = ta.Task.StatusId.ToString(),
//                    priority = ta.Task.PriorityId.ToString(),
//                    startDate = ta.Task.StartDate,
//                    endDate = ta.Task.EndDate,
//                    progress = ta.Task.Progress,
//                    estimatedHours = ta.Task.EstimatedHours,
//                    actualHours = ta.Task.ActualHours,
//                    isOverdue = ta.Task.EndDate < today
//                })
//                .OrderBy(t => t.endDate)
//                .ToListAsync();

//            // Get assigned projects
//            var assignedProjects = await _context.ProjectAnalysts
//                .Where(pa => pa.AnalystId == userId &&
//                          (pa.Project.Status == Core.Entities.ProjectStatus.New ||
//                           pa.Project.Status == Core.Entities.ProjectStatus.UnderStudy ||
//                           pa.Project.Status == Core.Entities.ProjectStatus.UnderDevelopment ||
//                           pa.Project.Status == Core.Entities.ProjectStatus.UnderTesting))
//                .Include(pa => pa.Project)
//                .Select(pa => new
//                {
//                    projectId = pa.ProjectId,
//                    projectName = pa.Project.ApplicationName,
//                    status = pa.Project.Status.ToString(),
//                    startDate = pa.Project.StartDate,
//                    expectedCompletionDate = pa.Project.ExpectedCompletionDate
//                })
//                .ToListAsync();

//            var memberWorkload = new
//            {
//                userId = user.Id,
//                fullName = user.FullName,
//                email = user.Email,
//                department = user.Department?.Name ?? "N/A",
//                assignedTasks,
//                assignedProjects,
//                summary = new
//                {
//                    totalAssignedTasks = assignedTasks.Count,
//                    overdueTasks = assignedTasks.Count(t => t.isOverdue),
//                    totalProjects = assignedProjects.Count,
//                    totalEstimatedHours = assignedTasks.Sum(t => t.estimatedHours ?? 0),
//                    totalActualHours = assignedTasks.Sum(t => t.actualHours ?? 0)
//                }
//            };

//            return Ok(new
//            {
//                success = true,
//                data = memberWorkload,
//                message = "Member workload retrieved successfully"
//            });
//        }
//        catch (Exception ex)
//        {
//            _logger.LogError(ex, "Error occurred while retrieving member workload for user {UserId}", userId);
//            return StatusCode(500, new
//            {
//                success = false,
//                message = "An error occurred while retrieving member workload",
//                error = ex.Message
//            });
//        }
//    }
//}
