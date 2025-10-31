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
    /// Get QC quick actions data including tasks that need QC assignment (developer tasks in preview, not yet assigned to QC)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetQCQuickActions()
    {
        try
        {
            // Get current user's department
            var currentUser = await _userService.GetCurrentUserAsync();
            var currentUserDepartmentId = currentUser?.Roles?.FirstOrDefault()?.Department?.Id;

            // Get QC Department ID (assuming it's 2 based on the enum pattern)
            const int QC_DEPARTMENT_ID = 2;

            // Get task IDs that have no dependent tasks
            var taskIdsWithNoDependents = await _context.Tasks
                .Where(t => !_context.TaskDependencies.Any(dep => dep.TaskId == t.Id))
                .Select(t => t.Id)
                .ToListAsync();
            var taskIdsWithNoDependentsSet = new HashSet<int>(taskIdsWithNoDependents);

            // Get tasks that are in "In Review" status (completed by developers) 
            // AND do NOT have a QC member assigned yet
            var tasksNeedingQCAssignment = await _context.Tasks
                .Where(t => t.StatusId == TaskStatusEnum.InReview && t.RoleType=="developer")
                .Include(t => t.ProjectRequirement)
                    .ThenInclude(pr => pr!.Project)
                .Include(t => t.Assignments)
                    .ThenInclude(ta => ta.Employee) 
                .Select(t => new
                {
                    id = t.Id,
                    taskName = t.Name,
                    description = t.Description ?? "",
                    typeId = t.TypeId,
                    projectId = t.ProjectRequirement != null ? t.ProjectRequirement.ProjectId : 0,
                    projectName = t.ProjectRequirement != null && t.ProjectRequirement.Project != null 
                        ? t.ProjectRequirement.Project.ApplicationName 
                        : "",
                    requirementId = t.ProjectRequirementId,
                    requirementName = t.ProjectRequirement != null ? t.ProjectRequirement.Name : "",
                    priority = t.PriorityId == Priority.High ? "high" : 
                              t.PriorityId == Priority.Medium ? "medium" : "low",
                    priorityId = t.PriorityId,
                    statusId = t.StatusId,
                    completedDate = t.UpdatedAt,
                    startDate = t.StartDate,
                    endDate = t.EndDate,
                    // Get primary developer (developer who completed the task)
                    developer = t.Assignments
                        .Where(ta => ta.Employee != null  ) // Development Department
                        .Select(ta => ta.Employee!.FullName)
                        .FirstOrDefault() ?? "Unassigned",
                    developerId = t.Assignments
                        .Where(ta => ta.Employee != null  )
                        .Select(ta => ta.Employee!.Id)
                        .FirstOrDefault(),
                    estimatedHours = t.EstimatedHours ?? 0,
                    actualHours = t.ActualHours ?? 0,
                    progress = t.Progress,
                    // Get all current assignees (developers)
                    assignedMembers = t.Assignments
                        .Where(ta => ta.Employee != null)
                        .Select(ta => new
                        {
                            id = ta.Employee!.Id,
                            name = ta.Employee.FullName 
                        })
                        .ToList()
                })
                .OrderBy(t => t.completedDate)
                .ToListAsync();

            // Format the response
            var formattedTasks = tasksNeedingQCAssignment.Select(t => new
            {
                t.id,
                t.taskName,
                t.description,
                t.typeId,
                t.projectId,
                t.projectName,
                t.requirementId,
                t.requirementName,
                hasNoDependentTasks = taskIdsWithNoDependentsSet.Contains(t.id),
                t.priority,
                t.priorityId,
                t.statusId,
                completedDate = t.completedDate.ToString("yyyy-MM-dd"),
                startDate = t.startDate.ToString("yyyy-MM-dd"),
                endDate = t.endDate.ToString("yyyy-MM-dd"),
                t.developer,
                t.developerId,
                t.estimatedHours,
                t.actualHours,
                t.progress,
                t.assignedMembers
            }).ToList();

            var result = new
            {
                tasksNeedingQCAssignment = formattedTasks,
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
    /// Assign QC member(s) to a task - creates QC assignments for review
    /// Same business logic as change-assignees but specifically for QC workflow
    /// </summary>
    [HttpPost("{taskId}/assign-qc")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AssignQCToTask(int taskId, [FromBody] AssignQCRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Validation failed" });
            }

            // Validate that the task exists
            var task = await _context.Tasks
                .Include(t => t.Assignments)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                return NotFound(new { success = false, message = "Task not found" });
            }

            // Validate task is in correct status (In Review)
            if (task.StatusId != TaskStatusEnum.InReview)
            {
                return BadRequest(new { success = false, message = "Only tasks in 'In Review' status can be assigned to QC" });
            }

            // Convert string IDs to integers with validation
            var qcMemberIds = new List<int>();
            foreach (var idStr in request.QCMemberIds)
            {
                if (int.TryParse(idStr, out int qcMemberId))
                {
                    qcMemberIds.Add(qcMemberId);
                }
                else
                {
                    return BadRequest(new { success = false, message = $"Invalid QC member ID format: {idStr}" });
                }
            }

            if (qcMemberIds.Count == 0)
            {
                return BadRequest(new { success = false, message = "At least one QC member must be selected" });
            }

            // Verify QC members exist and are in QC department
            const int QC_DEPARTMENT_ID = 2;
            var qcMembers = await _context.MawaredEmployees
              
                .Where(e => qcMemberIds.Contains(e.Id)  )
                .ToListAsync();

            if (qcMembers.Count != qcMemberIds.Count)
            {
                return BadRequest(new { success = false, message = "One or more selected members are not valid QC team members" });
            }

            // Update task dates if provided
            if (request.StartDate.HasValue)
            {
                task.StartDate = request.StartDate.Value;
            }

            if (request.EndDate.HasValue)
            {
                task.EndDate = request.EndDate.Value;
            }

            // Create QC assignments (don't remove existing developer assignments)
            foreach (var qcMemberId in qcMemberIds)
            {
                // Check if this QC member is already assigned
                var existingAssignment = task.Assignments
                    .FirstOrDefault(a => a.PrsId == qcMemberId);

                if (existingAssignment == null)
                {
                    var newAssignment = new PMA.Core.Entities.TaskAssignment
                    {
                        TaskId = taskId,
                        PrsId = qcMemberId, 
                        AssignedAt = DateTime.UtcNow, 
                    };

                    _context.TaskAssignments.Add(newAssignment);
                }
            }

            // Add audit log/comment if provided
            if (!string.IsNullOrWhiteSpace(request.Notes))
            {
                // Create a status history entry to track the assignment
                var currentUser = await _userService.GetCurrentUserAsync();
                var statusHistory = new PMA.Core.Entities.TaskStatusHistory
                {
                    TaskId = taskId,
                    OldStatus = task.StatusId,
                    NewStatus = task.StatusId, // Status doesn't change, just logging the assignment
                    ChangedByPrsId = currentUser?.PrsId ?? 0,
                    Comment = $"QC Assignment: {request.Notes}",
                    UpdatedAt = DateTime.UtcNow
                };

                _context.TaskStatusHistory.Add(statusHistory);
            }

            await _context.SaveChangesAsync();

            return Success(new { message = "QC member(s) assigned successfully", taskId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning QC to task {TaskId}", taskId);
            return Error<object>("An error occurred while assigning QC member(s)", ex.Message);
        }
    }
}

// Request DTO
public class AssignQCRequest
{
    public List<string> QCMemberIds { get; set; } = new List<string>();
    public string? Notes { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
