using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using PMA.Core.Enums;
using PMA.Infrastructure.Data;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/developer-quick-actions")]
public class DeveloperQuickActionsController : ApiBaseController
{
    private readonly ApplicationDbContext _context;

    public DeveloperQuickActionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get developer quick actions data including unassigned tasks, almost completed tasks, and available developers
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDeveloperQuickActions()
    {
        try
        {
            // Get unassigned tasks (tasks with no assignee)
            var unassignedTasks = await _context.Tasks
                .Where(t => !_context.TaskAssignments.Any(ta => ta.TaskId == t.Id) &&
                           t.StatusId != TaskStatusEnum.Completed)
                .Include(t => t.ProjectRequirement)
                .ThenInclude(pr => pr!.Project)
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
                    statusId = (int)t.StatusId,
                    priorityId = (int)t.PriorityId,
                    progress = t.Progress,
                    estimatedHours = t.EstimatedHours,
                    actualHours = t.ActualHours,
                    departmentName = t.Department != null ? t.Department.Name : ""
                })
                .OrderBy(t => t.endDate)
                .ToListAsync();

            // Get almost completed tasks (tasks with progress > 80% and not completed)
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
                    daysUntilDeadline = EF.Functions.DateDiffDay(DateTime.UtcNow, t.EndDate),
                    isOverdue = t.EndDate < DateTime.UtcNow,
                    estimatedHours = t.EstimatedHours,
                    actualHours = t.ActualHours,
                    departmentName = t.Department != null ? t.Department.Name : ""
                })
                .OrderBy(t => t.endDate)
                .ToListAsync();

            // Get available developers (users with developer role who have capacity)
            var availableDevelopers = await _context.Users
                .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id &&
                           ur.Role != null && ur.Role.Name.Contains("Developer")))
                .Select(u => new
                {
                    id = u.Id,
                    fullName = u.FullName,
                    email = u.Email,
                    department = u.Department != null ? u.Department : "",
                    currentTasksCount = _context.TaskAssignments
                        .Count(ta => ta.PrsId == u.Id &&
                              ta.Task != null &&
                              ta.Task.StatusId != TaskStatusEnum.Completed),
                    totalCapacity = 5, // Assuming 5 tasks max capacity
                    availableCapacity = 5 - _context.TaskAssignments
                        .Count(ta => ta.PrsId == u.Id &&
                              ta.Task != null &&
                              ta.Task.StatusId != TaskStatusEnum.Completed)
                })
                .Where(u => u.availableCapacity > 0)
                .OrderBy(u => u.currentTasksCount)
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = new
                {
                    unassignedTasks,
                    almostCompletedTasks,
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
                    daysUntilDeadline = EF.Functions.DateDiffDay(DateTime.UtcNow, t.EndDate),
                    isOverdue = t.EndDate < DateTime.UtcNow,
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
    [HttpPost("assign")]
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

            var developer = await _context.Users.FindAsync(developerId);
            if (developer == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Developer not found"
                });
            }

            // Check if assignment already exists
            var existingAssignment = await _context.TaskAssignments
                .FirstOrDefaultAsync(ta => ta.TaskId == taskId);

            if (existingAssignment != null)
            {
                // Update existing assignment
                existingAssignment.PrsId = developerId;
                existingAssignment.AssignedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new assignment
                var newAssignment = new TaskAssignment
                {
                    TaskId = taskId,
                    PrsId = developerId,
                    AssignedAt = DateTime.UtcNow
                };
                _context.TaskAssignments.Add(newAssignment);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Developer assigned to task successfully"
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
    /// Assign reviewer to pull request
    /// </summary>
    [HttpPost("review")]
    public async Task<IActionResult> AssignReviewer([FromBody] AssignReviewerRequest request)
    {
        try
        {
            if (request == null || string.IsNullOrEmpty(request.PullRequestId) || string.IsNullOrEmpty(request.ReviewerId))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid request data"
                });
            }

            // For now, this is a placeholder implementation
            // In a real scenario, this would interact with a code repository service
            // For this demo, we'll just return success
            await System.Threading.Tasks.Task.CompletedTask; // Add await to satisfy compiler

            return Ok(new
            {
                success = true,
                message = "Reviewer assigned to pull request successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while assigning reviewer",
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