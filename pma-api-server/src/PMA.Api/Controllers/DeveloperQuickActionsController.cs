using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using PMA.Core.Enums;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using PMA.Core.DTOs;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/developer-quick-actions")]
public class DeveloperQuickActionsController : ApiBaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IProjectRequirementService _projectRequirementService;
    private readonly IUserService _userService;

    public DeveloperQuickActionsController(
        ApplicationDbContext context, 
        IProjectRequirementService projectRequirementService,
        IUserService userService)
    {
        _context = context;
        _projectRequirementService = projectRequirementService;
        _userService = userService;
    }

    /// <summary>
    /// Get developer quick actions data including unassigned tasks, almost completed tasks, and available developers
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDeveloperQuickActions()
    {
        try
        {
            // Get current user's department to filter team members (same as DeveloperWorkloadController)
            var currentUser = await _userService.GetCurrentUserAsync();
            var currentUserDepartmentId = currentUser?.Roles?.FirstOrDefault()?.Department?.Id;

            // Get unassigned tasks (tasks with no assignee)
            var unassignedTasks = await _context.Tasks
                .Where(t => !_context.TaskAssignments.Any(ta => ta.TaskId == t.Id) &&
                           t.StatusId != TaskStatusEnum.Completed)
                .Include(t => t.ProjectRequirement)
                .ThenInclude(pr => pr!.Project)
                .Include(t => t.Department)
                .Select(t => new
                {
                    id = t.Id.ToString(),
                    title = t.Name,
                    description = t.Description,
                    priority = t.PriorityId == Priority.High ? "high" : 
                              t.PriorityId == Priority.Medium ? "medium" : "low",
                    status = t.StatusId == TaskStatusEnum.ToDo ? "todo" :
                            t.StatusId == TaskStatusEnum.InProgress ? "in-progress" :
                            t.StatusId == TaskStatusEnum.InReview ? "review" : "done",
                    projectId = t.ProjectRequirement != null ? t.ProjectRequirement.ProjectId.ToString() : "",
                    projectName = t.ProjectRequirement != null && t.ProjectRequirement.Project != null ?
                        t.ProjectRequirement.Project.ApplicationName : "",
                    estimatedHours = (int)(t.EstimatedHours ?? 0),
                    dueDate = t.EndDate, // Remove ToString to avoid EF translation issues
                    type = "feature", // Default type since not available in current schema
                    complexity = "medium", // Default complexity since not available in current schema
                    tags = new string[] { }, // Empty array since not available in current schema
                    requirementName = t.ProjectRequirement != null ? t.ProjectRequirement.Name : ""
                })
                .OrderBy(t => t.dueDate) // Order by the DateTime directly
                .ToListAsync();

            // Format the dates after query execution
            var formattedUnassignedTasks = unassignedTasks.Select(t => new
            {
                t.id,
                t.title,
                t.description,
                t.priority,
                t.status,
                t.projectId,
                t.projectName,
                t.estimatedHours,
                dueDate = t.dueDate.ToString("yyyy-MM-dd"), // Format date here
                t.type,
                t.complexity,
                t.tags,
                t.requirementName
            }).ToList();

            // Get almost completed tasks (tasks with progress > 80% and not completed)
            var almostCompletedTasks = await _context.Tasks 
                .Where(t => t.Progress >= 75 && t.StatusId != TaskStatusEnum.Completed)
                .Include(t => t.ProjectRequirement)
                .ThenInclude(pr => pr!.Project)
                .Include(t => t.Assignments)
                .ThenInclude(ta => ta.Employee)
                .Select(t => new
                {
                    id = t.Id,
                    treeId = t.Id.ToString(), // Using Id as treeId since TreeId doesn't exist
                    name = t.Name,
                    description = t.Description,
                    startDate = t.StartDate,
                    endDate = t.EndDate,
                    duration = (t.EndDate - t.StartDate).Days, // Calculate duration
                    projectName = t.ProjectRequirement != null && t.ProjectRequirement.Project != null ?
                        t.ProjectRequirement.Project.ApplicationName : "",
                    sprintName = t.Sprint != null ? t.Sprint.Name : "",
                    assigneeName = t.Assignments.FirstOrDefault() != null ? 
                        t.Assignments.FirstOrDefault()!.Employee!.FullName : null,
                    statusId = (int)t.StatusId,
                    priorityId = (int)t.PriorityId,
                    progress = t.Progress,
                    daysUntilDeadline = EF.Functions.DateDiffDay(DateTime.Now, t.EndDate),
                    isOverdue = t.EndDate < DateTime.Now,
                    estimatedHours = t.EstimatedHours,
                    actualHours = t.ActualHours,
                    departmentName = t.Department != null ? t.Department.Name : ""
                })
                .OrderBy(t => t.endDate)
                .ToListAsync();

            // Get overdue tasks (tasks past their due date and not completed)
            var overdueTasks = await _context.Tasks
                .Where(t => t.EndDate < DateTime.Now && t.StatusId != TaskStatusEnum.Completed)
                .Include(t => t.ProjectRequirement)
                .ThenInclude(pr => pr!.Project)
                .Include(t => t.Assignments)
                .ThenInclude(ta => ta.Employee)
                .Select(t => new
                {
                    id = t.Id,
                    treeId = t.Id.ToString(), // Using Id as treeId since TreeId doesn't exist
                    name = t.Name,
                    description = t.Description,
                    startDate = t.StartDate,
                    endDate = t.EndDate,
                    duration = (t.EndDate - t.StartDate).Days, // Calculate duration
                    projectName = t.ProjectRequirement != null && t.ProjectRequirement.Project != null ?
                        t.ProjectRequirement.Project.ApplicationName : "",
                    sprintName = t.Sprint != null ? t.Sprint.Name : "",
                    assignee = t.Assignments.FirstOrDefault() != null ?
                        t.Assignments.FirstOrDefault()!.Employee : null,
                    statusId = (int)t.StatusId,
                    priorityId = (int)t.PriorityId,
                    progress = t.Progress,
                    daysUntilDeadline = EF.Functions.DateDiffDay(DateTime.Now, t.EndDate),
                    isOverdue = t.EndDate < DateTime.Now,
                    estimatedHours = t.EstimatedHours,
                    actualHours = t.ActualHours,
                    departmentName = t.Department != null ? t.Department.Name : ""
                })
                .OrderBy(t => t.endDate)
                .ToListAsync();

            // Get available developers using the same business logic as DeveloperWorkloadController
            var teamMembersQuery = from t in _context.Teams
                                   join me in _context.MawaredEmployees on t.PrsId equals me.Id
                                   join d in _context.Departments on t.DepartmentId equals d.Id
                                   where t.IsActive && me.StatusId == 1
                                   select new
                                   {
                                       EmployeeId = me.Id,
                                       FullName = me.FullName,
                                       GradeName = me.GradeName,
                                       Department = d.Name,
                                       DepartmentId = d.Id,
                                       MilitaryNumber = me.MilitaryNumber,
                                       ActiveTasks = _context.TaskAssignments.Count(ta => ta.PrsId == me.Id && 
                                                    ta.Task != null && ta.Task.StatusId != TaskStatusEnum.Completed)

                                   };

            // Apply department filter - prioritize current user's department (same as DeveloperWorkloadController)
            if (currentUserDepartmentId.HasValue)
            {
                teamMembersQuery = teamMembersQuery.Where(x => x.DepartmentId == currentUserDepartmentId.Value);
            }

            var availableDevelopers = await teamMembersQuery
                .Where(tm => tm.ActiveTasks == 0) // Filter for developers with no active tasks (completely free)
                .Select(tm => new
                {
                    id = tm.EmployeeId,
                    fullName = tm.FullName,
                    gradeName = tm.GradeName,
                    email = "", // Not available in MawaredEmployees, set to empty
                    department = tm.Department,
                    departmentId = tm.DepartmentId,
                    militaryNumber = tm.MilitaryNumber,
                    currentTasksCount = tm.ActiveTasks
                })
                .OrderBy(u => u.fullName) // Order by name since all will have 0 tasks
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = new
                {
                    unassignedTasks = formattedUnassignedTasks,
                    almostCompletedTasks,
                    overdueTasks,
                    availableDevelopers
                },
                message = "Developer quick actions data retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving developer quick actions data",
                error = ex.Message
            });
        }
    }
  
    /// <summary>
    /// Get almost completed tasks
    /// </summary>
    [HttpGet("almost-completed-tasks")]
    public async Task<IActionResult> GetAlmostCompletedTasks()
    {
        try
        {
            var almostCompletedTasks = await _context.Tasks
                .Where(t => t.Progress > 80 && t.StatusId != TaskStatusEnum.Completed)
                .Include(t => t.ProjectRequirement)
                .ThenInclude(pr => pr!.Project)
                .Include(t => t.Assignments)
                .ThenInclude(ta => ta.Employee)
                .Select(t => new
                {
                    id = t.Id,
                    treeId = t.Id.ToString(), // Using Id as treeId since TreeId doesn't exist
                    name = t.Name,
                    description = t.Description,
                    startDate = t.StartDate,
                    endDate = t.EndDate,
                    duration = (t.EndDate - t.StartDate).Days, // Calculate duration
                    projectName = t.ProjectRequirement != null && t.ProjectRequirement.Project != null ?
                        t.ProjectRequirement.Project.ApplicationName : "",
                    sprintName = t.Sprint != null ? t.Sprint.Name : "",
                    assigneeName = t.Assignments.FirstOrDefault() != null ? 
                        t.Assignments.FirstOrDefault()!.Employee!.FullName : null,
                    statusId = (int)t.StatusId,
                    priorityId = (int)t.PriorityId,
                    progress = t.Progress,
                    daysUntilDeadline = EF.Functions.DateDiffDay(DateTime.Now, t.EndDate),
                    isOverdue = t.EndDate < DateTime.Now,
                    estimatedHours = t.EstimatedHours,
                    actualHours = t.ActualHours,
                    departmentName = t.Department != null ? t.Department.Name : ""
                })
                .OrderBy(t => t.endDate)
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = almostCompletedTasks,
                count = almostCompletedTasks.Count,
                message = "Almost completed tasks retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving almost completed tasks",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Extend task deadline
    /// </summary>
    [HttpPost("extend-task")]
    public async Task<IActionResult> ExtendTask([FromBody] ExtendTaskRequest request)
    {
        try
        {
            if (request == null || request.TaskId <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid request data"
                });
            }

            var task = await _context.Tasks.FindAsync(request.TaskId);
            if (task == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Task not found"
                });
            }

            // Update task end date
            task.EndDate = DateTime.Parse(request.NewEndDate);

            // Add additional hours if provided
            if (request.AdditionalHours.HasValue)
            {
                task.EstimatedHours = (task.EstimatedHours ?? 0) + (decimal)request.AdditionalHours.Value;
            }

            // Create a task extension record or log the extension reason
            // For now, we'll just update the task

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Task deadline extended successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while extending task deadline",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Assign developer to task
    /// </summary>
    [HttpPost("assign-developer")]
    public async Task<IActionResult> AssignDeveloper([FromBody] AssignDeveloperRequest request)
    {
        try
        {
            if (request == null || string.IsNullOrEmpty(request.TaskId) || string.IsNullOrEmpty(request.DeveloperId))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid request data"
                });
            }

            // Parse task ID (assuming it's a string that can be converted to int)
            if (!int.TryParse(request.TaskId, out var taskId))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid task ID format"
                });
            }

            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Task not found"
                });
            }

            // Parse developer ID
            if (!int.TryParse(request.DeveloperId, out var developerId))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid developer ID format"
                });
            }

      

            // Check if assignment already exists
            var existingAssignment = await _context.TaskAssignments
                .FirstOrDefaultAsync(ta => ta.TaskId == taskId);

            if (existingAssignment != null)
            {
                // Update existing assignment
                existingAssignment.PrsId = developerId;
                existingAssignment.AssignedAt = DateTime.Now;
            }
            else
            {
                // Create new assignment
                var newAssignment = new TaskAssignment
                {
                    TaskId = taskId,
                    PrsId = developerId,
                    AssignedAt = DateTime.Now
                };
                _context.TaskAssignments.Add(newAssignment);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while assigning developer",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get task completion analytics including overdue and at-risk items
    /// </summary>
    [HttpGet("task-completion-analytics")]
    public async Task<IActionResult> GetTaskCompletionAnalytics()
    {
        try
        {
            // Get current user's department to filter tasks
            var currentUser = await _userService.GetCurrentUserAsync();
            var currentUserDepartmentId = currentUser?.Roles?.FirstOrDefault()?.Department?.Id;

            // Get all tasks for summary calculation
            var allTasksQuery = _context.Tasks.AsQueryable();
            if (currentUserDepartmentId.HasValue)
            {
                allTasksQuery = allTasksQuery.Where(t => t.DepartmentId == currentUserDepartmentId.Value);
            }

            var allTasks = await allTasksQuery
                .Include(t => t.Assignments)
                .ThenInclude(ta => ta.Employee)
                .Include(t => t.ProjectRequirement)
                .ThenInclude(pr => pr!.Project)
                .ToListAsync();

            // Calculate summary statistics
            var totalTasks = allTasks.Count;
            var completedTasks = allTasks.Count(t => t.StatusId == TaskStatusEnum.Completed);
            var onTimeCompleted = allTasks.Count(t => 
                t.StatusId == TaskStatusEnum.Completed && 
                t.ActualHours <= t.EstimatedHours);
            var onTimeRate = totalTasks > 0 ? (int)Math.Round((double)onTimeCompleted / completedTasks * 100) : 0;
            
            // Calculate average delay days for overdue completed tasks
            var overdueCompletedTasks = allTasks.Where(t => 
                t.StatusId == TaskStatusEnum.Completed && 
                t.ActualHours > t.EstimatedHours).ToList();
            var avgDelayDays = overdueCompletedTasks.Any() 
                ? overdueCompletedTasks.Average(t => (t.ActualHours - t.EstimatedHours) ?? 0)
                : 0;

            // Get overdue items (tasks past due date and not completed)
            var overdueItems = allTasks
                .Where(t => t.EndDate < DateTime.Now && t.StatusId != TaskStatusEnum.Completed)
                .Select(t => new
                {
                    id = t.Id.ToString(),
                    title = t.Name,
                    type = "bug", // Default type, could be enhanced based on task type
                    priority = t.PriorityId == Priority.High ? "high" :
                              t.PriorityId == Priority.Medium ? "medium" : "low",
                    status = t.StatusId == TaskStatusEnum.ToDo ? "todo" :
                            t.StatusId == TaskStatusEnum.InProgress ? "in-progress" :
                            t.StatusId == TaskStatusEnum.InReview ? "review" : "done",
                    assignee = t.Assignments.FirstOrDefault() != null ?
                        t.Assignments.FirstOrDefault()!.Employee!.FullName : "",
                    projectName = t.ProjectRequirement != null && t.ProjectRequirement.Project != null ?
                        t.ProjectRequirement.Project.ApplicationName : "",
                    estimatedHours = (int)(t.EstimatedHours ?? 0),
                    actualHours = (int)(t.ActualHours ?? 0),
                    dueDate = t.EndDate.ToString("yyyy-MM-dd"),
                    daysOverdue = (DateTime.Now - t.EndDate).Days
                })
                .OrderBy(t => t.daysOverdue)
                .ToList();

            // Get at-risk items (tasks due within 3 days and not completed)
            var atRiskItems = allTasks
                .Where(t => t.EndDate >= DateTime.Now &&
                           t.EndDate <= DateTime.Now.AddDays(3) &&
                           t.StatusId != TaskStatusEnum.Completed)
                .Select(t => new
                {
                    id = t.Id.ToString(),
                    title = t.Name,
                    type = "feature", // Default type, could be enhanced based on task type
                    priority = t.PriorityId == Priority.High ? "high" :
                              t.PriorityId == Priority.Medium ? "medium" : "low",
                    status = t.StatusId == TaskStatusEnum.ToDo ? "todo" :
                            t.StatusId == TaskStatusEnum.InProgress ? "in-progress" :
                            t.StatusId == TaskStatusEnum.InReview ? "review" : "done",
                    assignee = t.Assignments.FirstOrDefault() != null ?
                        t.Assignments.FirstOrDefault()!.Employee!.FullName : "",
                    projectName = t.ProjectRequirement != null && t.ProjectRequirement.Project != null ?
                        t.ProjectRequirement.Project.ApplicationName : "",
                    estimatedHours = (int)(t.EstimatedHours ?? 0),
                    actualHours = (int)(t.ActualHours ?? 0),
                    dueDate = t.EndDate.ToString("yyyy-MM-dd"),
                    daysUntilDeadline = (t.EndDate - DateTime.Now).Days
                })
                .OrderBy(t => t.daysUntilDeadline)
                .ToList();            return Ok(new
            {
                success = true,
                data = new
                {
                    summary = new
                    {
                        totalTasks,
                        completedTasks,
                        onTimeCompleted,
                        onTimeRate,
                        avgDelayDays = Math.Round(avgDelayDays, 1)
                    },
                    overdueItems,
                    atRiskItems
                },
                message = "Task completion analytics retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving task completion analytics",
                error = ex.Message
            });
        }
    } 
    [HttpGet("available-members")] // Alias for frontend compatibility
    public async Task<IActionResult> GetAvailableDevelopers()
    {
        try
        {
            var currentDate = DateTime.Now;

            // Get team members with detailed workload information
            var teamMembersWorkload = await _context.Teams
                .Where(tm => tm.IsActive)
                .Include(tm => tm.Department)
                .Include(tm => tm.Employee)
                .GroupJoin(
                    _context.TaskAssignments.Include(ta => ta.Task),
                    tm => tm.PrsId,
                    ta => ta.PrsId,
                    (tm, taskAssignments) => new { tm, taskAssignments }
                )
                .Select(x => new
                {
                    DepartmentId = x.tm.DepartmentId,
                    DepartmentName = x.tm.Department != null ? x.tm.Department.Name : "",
                    EmployeeId = x.tm.PrsId,
                    EmployeeName = x.tm.Employee != null ? x.tm.Employee.FullName : "",
                    GradeName = x.tm.Employee != null ? x.tm.Employee.GradeName : "",
                    UserName = x.tm.Employee != null ? x.tm.Employee.UserName : "",
                    MilitaryNumber = x.tm.Employee != null ? x.tm.Employee.MilitaryNumber : "",

                    // Total assigned tasks
                    TotalAssignedTasks = x.taskAssignments.Count(),

                    // Active tasks (status 1 or 2)
                    ActiveTasks = x.taskAssignments
                        .Count(ta => ta.Task != null &&
                               (ta.Task.StatusId == Core.Enums.TaskStatus.ToDo ||
                                ta.Task.StatusId == Core.Enums.TaskStatus.InProgress)),

                    // Currently running tasks (within date range)
                    CurrentlyActiveTasks = x.taskAssignments
                        .Count(ta => ta.Task != null &&
                               (ta.Task.StatusId == Core.Enums.TaskStatus.ToDo ||
                                ta.Task.StatusId == Core.Enums.TaskStatus.InProgress) &&
                               ta.Task.StartDate <= currentDate &&
                               ta.Task.EndDate >= currentDate),

                    // Critical tasks (high priority active tasks)
                    CriticalTasks = x.taskAssignments
                        .Count(ta => ta.Task != null &&
                               (ta.Task.StatusId == Core.Enums.TaskStatus.ToDo ||
                                ta.Task.StatusId == Core.Enums.TaskStatus.InProgress) &&
                               ta.Task.PriorityId == Priority.High),

                    // Overdue tasks
                    OverdueTasks = x.taskAssignments
                        .Count(ta => ta.Task != null &&
                               (ta.Task.StatusId == Core.Enums.TaskStatus.ToDo ||
                                ta.Task.StatusId == Core.Enums.TaskStatus.InProgress) &&
                               ta.Task.EndDate < currentDate),

                    // Upcoming tasks (not started yet)
                    UpcomingTasks = x.taskAssignments
                        .Count(ta => ta.Task != null &&
                               (ta.Task.StatusId == Core.Enums.TaskStatus.ToDo ||
                                ta.Task.StatusId == Core.Enums.TaskStatus.InProgress) &&
                               ta.Task.StartDate > currentDate),

                    // Nearest deadline for active tasks
                    NearestDeadline = x.taskAssignments
                        .Where(ta => ta.Task != null &&
                               (ta.Task.StatusId == Core.Enums.TaskStatus.ToDo ||
                                ta.Task.StatusId == Core.Enums.TaskStatus.InProgress) &&
                               ta.Task.EndDate >= currentDate)
                        .Min(ta => ta.Task != null ? (DateTime?)ta.Task.EndDate : null),

                    // Total task days (duration) for active tasks
                    TotalTaskDays = x.taskAssignments
                        .Where(ta => ta.Task != null &&
                               (ta.Task.StatusId == Core.Enums.TaskStatus.ToDo ||
                                ta.Task.StatusId == Core.Enums.TaskStatus.InProgress))
                        .Sum(ta => ta.Task != null ? EF.Functions.DateDiffDay(ta.Task.StartDate, ta.Task.EndDate) : 0),

                    JoinDate = x.tm.JoinDate,
                    IsActiveInTeam = x.tm.IsActive
                })
                .ToListAsync();

            // Get available members (employees who are in teams with low workload)
            // First, get employees who are in active teams with their team and department info
            var employeesWithTeams = await _context.Teams
                .Where(tm => tm.IsActive)
                .Include(tm => tm.Employee)
                .Include(tm => tm.Department)
                .Where(tm => tm.Employee != null && tm.Employee.StatusId == 1) // Only active employees
                .Select(tm => new
                {
                    Employee = tm.Employee,
                    Team = tm
                })
                .ToListAsync();

            // Then get task assignments for active tasks
            var employeeTaskCounts = await _context.TaskAssignments
                .Where(ta => ta.Task != null &&
                           (ta.Task.StatusId == Core.Enums.TaskStatus.ToDo ||
                            ta.Task.StatusId == Core.Enums.TaskStatus.InProgress))
                .Include(ta => ta.Task)
                .GroupBy(ta => ta.PrsId)
                .Select(g => new
                {
                    EmployeeId = g.Key,
                    TotalActiveTasks = g.Count(),
                    CurrentlyRunningTasks = g.Count(ta => ta.Task != null && ta.Task.StartDate <= currentDate && ta.Task.EndDate >= currentDate),
                    TotalTaskDurationDays = g.Sum(ta => ta.Task != null ? EF.Functions.DateDiffDay(ta.Task.StartDate, ta.Task.EndDate) : 0)
                })
                .ToListAsync();

            // Get legacy counts for backward compatibility
            var projectAnalystCounts = await _context.ProjectAnalysts
                .Where(pa => pa.Project != null &&
                           (pa.Project.Status == ProjectStatus.New ||
                            pa.Project.Status == ProjectStatus.UnderStudy ||
                            pa.Project.Status == ProjectStatus.UnderDevelopment ||
                            pa.Project.Status == ProjectStatus.UnderTesting))
                .GroupBy(pa => pa.AnalystId)
                .Select(g => new { EmployeeId = g.Key, Count = g.Count() })
                .ToListAsync();

            var requirementCounts = await _context.ProjectRequirements
                .Where(pr => pr.Status != RequirementStatusEnum.Completed && pr.AssignedAnalyst != null)
                .GroupBy(pr => pr.AssignedAnalyst)
                .Select(g => new { EmployeeId = g.Key, Count = g.Count() })
                .ToListAsync();

            // Combine all data in memory
            var availableMembers = employeesWithTeams
                .Where(et => et.Employee != null) // Extra safety check
                .Select(et =>
                {
                    var taskData = employeeTaskCounts.FirstOrDefault(tc => tc.EmployeeId == et.Employee!.Id);
                    var projectCount = projectAnalystCounts.FirstOrDefault(pc => pc.EmployeeId == et.Employee!.Id)?.Count ?? 0;
                    var requirementCount = requirementCounts.FirstOrDefault(rc => rc.EmployeeId == et.Employee!.Id)?.Count ?? 0;

                    var totalActiveTasks = taskData?.TotalActiveTasks ?? 0;
                    var currentlyRunningTasks = taskData?.CurrentlyRunningTasks ?? 0;
                    var totalTaskDurationDays = taskData?.TotalTaskDurationDays ?? 0;

                    return new
                    {
                        EmployeeId = et.Employee!.Id,
                        UserName = et.Employee.UserName,
                        FullName = et.Employee.FullName,
                        GradeName = et.Employee.GradeName,
                        MilitaryNumber = et.Employee.MilitaryNumber,

                        // Availability status calculation
                        AvailabilityStatus = totalActiveTasks == 0 ? "No active tasks" :
                                           currentlyRunningTasks == 0 ? "No current tasks (all future/past)" :
                                           "Low workload",

                        // Task counts
                        TotalActiveTasks = totalActiveTasks,
                        CurrentlyRunningTasks = currentlyRunningTasks,
                        TotalTaskDurationDays = totalTaskDurationDays,

                        // Department information
                        DepartmentId = et.Team?.DepartmentId,
                        CurrentDepartment = et.Team?.Department?.Name ?? "",

                        // Legacy fields for backward compatibility
                        assignedProjectsCount = projectCount,
                        activeRequirementsCount = requirementCount
                    };
                })
                .Where(x =>
                    x.TotalActiveTasks == 0 || // No active tasks
                    x.CurrentlyRunningTasks == 0 || // No currently running tasks
                    x.TotalActiveTasks < 3 || // Low workload (less than 3 active tasks)
                    x.TotalTaskDurationDays < 30 // Less than 30 days of total work
                )
                .OrderBy(x => x.CurrentlyRunningTasks)
                .ThenBy(x => x.TotalActiveTasks)
                .ThenBy(x => x.TotalTaskDurationDays)
                .ThenBy(x => x.FullName)
                .ToList();

            return Ok(new
            {
                success = true,
                data = new
                {
                    availableMembers,
                    teamWorkload = teamMembersWorkload,
                    summary = new
                    {
                        totalAvailableMembers = availableMembers.Count,
                        totalTeamMembers = teamMembersWorkload.Count,
                        membersWithNoTasks = availableMembers.Count(m => m.TotalActiveTasks == 0),
                        membersWithLowWorkload = availableMembers.Count(m => m.TotalActiveTasks > 0 && m.TotalActiveTasks < 3),
                        membersInTeams = availableMembers.Count // All are in teams now
                    }
                },
                count = availableMembers.Count,
                message = "Available members with workload information retrieved successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrieving available members",
                error = ex.Message
            });
        }
    }

    public class ExtendTaskRequest
    {
        public int TaskId { get; set; }
        public string NewEndDate { get; set; } = string.Empty;
        public string ExtensionReason { get; set; } = string.Empty;
        public double? AdditionalHours { get; set; }
    }

    public class AssignDeveloperRequest
    {
        public string TaskId { get; set; } = string.Empty;
        public string DeveloperId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
    }

    public class AssignReviewerRequest
    {
        public string PullRequestId { get; set; } = string.Empty;
        public string ReviewerId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
    }
}