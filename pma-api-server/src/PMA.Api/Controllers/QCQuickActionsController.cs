using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMA.Core.Enums;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/qc-quick-actions")]
public class QCQuickActionsController : ApiBaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IUserService _userService;
    private readonly ILogger<QCQuickActionsController> _logger;

    public QCQuickActionsController(
        ApplicationDbContext context,
        IUserService userService,
        ILogger<QCQuickActionsController> logger)
    {
        _context = context;
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Get QC quick actions data including tasks that need review (completed by developers)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetQCQuickActions()
    {
        try
        {
            // Get current user's department
            var currentUser = await _userService.GetCurrentUserAsync();
            var currentUserDepartmentId = currentUser?.Roles?.FirstOrDefault()?.Department?.Id;

            // Get tasks that are in "In Review" status (completed by developers, awaiting QC)
            var tasksNeedingReview = await _context.Tasks
                .Where(t => t.StatusId == TaskStatusEnum.InReview)
                .Include(t => t.ProjectRequirement)
                    .ThenInclude(pr => pr!.Project)
                .Include(t => t.Assignments)
                    .ThenInclude(ta => ta.Employee)
                .Select(t => new
                {
                    id = t.Id,
                    taskName = t.Name,
                    description = t.Description ?? "",
                    projectId = t.ProjectRequirement != null ? t.ProjectRequirement.ProjectId : 0,
                    projectName = t.ProjectRequirement != null && t.ProjectRequirement.Project != null 
                        ? t.ProjectRequirement.Project.ApplicationName 
                        : "",
                    requirementId = t.ProjectRequirementId,
                    requirementName = t.ProjectRequirement != null ? t.ProjectRequirement.Name : "",
                    priority = t.PriorityId == Priority.High ? "high" : 
                              t.PriorityId == Priority.Medium ? "medium" : "low",
                    statusId = t.StatusId,
                    completedDate = t.UpdatedAt,
                    // Get primary developer (first assignment with IsPrimary = true, or just first assignment)
                    developer = t.Assignments
                     
                        .Select(ta => ta.Employee != null ? ta.Employee.FullName : "Unassigned")
                        .FirstOrDefault() ?? 
                        t.Assignments
                        .Select(ta => ta.Employee != null ? ta.Employee.FullName : "Unassigned")
                        .FirstOrDefault() ?? "Unassigned",
                    estimatedHours = t.EstimatedHours ?? 0,
                    actualHours = t.ActualHours ?? 0,
                    progress = t.Progress  
                })
                .OrderBy(t => t.completedDate)
                .ToListAsync();

            // Format the response
            var formattedTasks = tasksNeedingReview.Select(t => new
            {
                t.id,
                t.taskName,
                t.description,
                t.projectId,
                t.projectName,
                t.requirementId,
                t.requirementName,
                t.priority,
                t.statusId,
                completedDate = t.completedDate.ToString("yyyy-MM-dd"),
                t.developer,
                t.estimatedHours,
                t.actualHours,
                t.progress
            }).ToList();

            var result = new
            {
                tasksNeedingReview = formattedTasks,
                totalCount = formattedTasks.Count
            };

            return Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving QC quick actions");
            return Error<object>("An error occurred while retrieving QC quick actions", ex.Message);
        }
    }

    /// <summary>
    /// Approve a task (move from In Review to Completed)
    /// </summary>
    [HttpPost("{taskId}/approve")]
    public async Task<IActionResult> ApproveTask(int taskId, [FromBody] ApproveTaskRequest? request)
    {
        try
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
            {
                return NotFound($"Task with ID {taskId} not found");
            }

            if (task.StatusId != TaskStatusEnum.InReview)
            {
                return BadRequest("Only tasks in 'In Review' status can be approved");
            }

            // Update task status to Completed
            task.StatusId = TaskStatusEnum.Completed;
            task.Progress = 100;
            task.UpdatedAt = DateTime.UtcNow;

            // Create status history entry
            var currentUser = await _userService.GetCurrentUserAsync();
            var statusHistory = new PMA.Core.Entities.TaskStatusHistory
            {
                TaskId = taskId,
                OldStatus = TaskStatusEnum.InReview,
                NewStatus = TaskStatusEnum.Completed,
                ChangedByPrsId = currentUser?.PrsId ?? 0,
                Comment = request?.Comment ?? "Task approved by QC",
                UpdatedAt = DateTime.UtcNow
            };

            _context.TaskStatusHistory.Add(statusHistory);
            await _context.SaveChangesAsync();

            return Success(new { message = "Task approved successfully", taskId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving task {TaskId}", taskId);
            return Error<object>("An error occurred while approving the task", ex.Message);
        }
    }

    /// <summary>
    /// Request rework on a task (move from In Review to Rework)
    /// </summary>
    [HttpPost("{taskId}/request-rework")]
    public async Task<IActionResult> RequestRework(int taskId, [FromBody] RequestReworkRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Comment))
            {
                return BadRequest("Comment is required when requesting rework");
            }

            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
            {
                return NotFound($"Task with ID {taskId} not found");
            }

            if (task.StatusId != TaskStatusEnum.InReview)
            {
                return BadRequest("Only tasks in 'In Review' status can be sent for rework");
            }

            // Update task status to Rework
            task.StatusId = TaskStatusEnum.Rework;
            task.UpdatedAt = DateTime.UtcNow;

            // Create status history entry
            var currentUser = await _userService.GetCurrentUserAsync();
            var statusHistory = new PMA.Core.Entities.TaskStatusHistory
            {
                TaskId = taskId,
                OldStatus = TaskStatusEnum.InReview,
                NewStatus = TaskStatusEnum.Rework,
                ChangedByPrsId = currentUser?.PrsId ?? 0,
                Comment = request.Comment,
                UpdatedAt = DateTime.UtcNow
            };

            _context.TaskStatusHistory.Add(statusHistory);
            await _context.SaveChangesAsync();

            return Success(new { message = "Rework requested successfully", taskId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting rework for task {TaskId}", taskId);
            return Error<object>("An error occurred while requesting rework", ex.Message);
        }
    }
}

// Request DTOs
public class ApproveTaskRequest
{
    public string? Comment { get; set; }
}

public class RequestReworkRequest
{
    public string Comment { get; set; } = string.Empty;
}
