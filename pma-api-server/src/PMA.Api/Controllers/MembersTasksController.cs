using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.DTOs.Tasks;
using PMA.Core.Enums;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;
using System;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MembersTasksController : ApiBaseController
{
    private readonly IMemberTaskService _memberTaskService;
    private readonly IUserContextAccessor _userContextAccessor;
    private readonly IUserService _userService;

    public MembersTasksController(IMemberTaskService memberTaskService, IUserContextAccessor userContextAccessor, IUserService userService)
    {
        _memberTaskService = memberTaskService;
        _userContextAccessor = userContextAccessor;
        _userService = userService;
    }

    /// <summary>
    /// Get team members for assignee filtering
    /// Returns members from current user's department or all members for administrators
    /// </summary>
    [HttpGet("team-members")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetTeamMembers()
    {
        try
        { 
            var teamMembers = await _memberTaskService.GetTeamMembersAsync();
            
            return Success(teamMembers, message: "Team members retrieved successfully");
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<MemberSearchResultDto>>("An error occurred while retrieving team members", ex.Message);
        }
    }

    /// <summary>
    /// Get all member tasks with pagination and filtering
    /// Service layer handles user context and role-based filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetMemberTasks(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? projectId = null,
        [FromQuery] int? primaryAssigneeId = null,
        [FromQuery] int? status = null,
        [FromQuery] int? priority = null,
        [FromQuery] string? search = null)
    {
        try
        {
            // Service layer handles user context and role-based filtering
            var (memberTasks, totalCount) = await _memberTaskService.GetMemberTasksAsync(
                page, limit, projectId, primaryAssigneeId, status, priority, departmentId: null, search: search);
            
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(memberTasks, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<TaskDto>>("An error occurred while retrieving member tasks", ex.Message);
        }
    }

    /// <summary>
    /// Get member task by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetMemberTaskById(int id)
    {
        try
        {
            var memberTask = await _memberTaskService.GetMemberTaskByIdAsync(id);
            if (memberTask == null)
            {
                var notFoundResponse = new ApiResponse<TaskDto>
                {
                    Success = false,
                    Message = "Member task not found"
                };
                return NotFound(notFoundResponse);
            }

            var response = new ApiResponse<TaskDto>
            {
                Success = true,
                Data = memberTask
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<TaskDto>
            {
                Success = false,
                Message = "An error occurred while retrieving the member task",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get member tasks by project
    /// </summary>
    [HttpGet("project/{projectId}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetMemberTasksByProject(int projectId)
    {
        try
        {
            var memberTasks = await _memberTaskService.GetMemberTasksByProjectAsync(projectId);
            var response = new ApiResponse<IEnumerable<TaskDto>>
            {
                Success = true,
                Data = memberTasks
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<TaskDto>>
            {
                Success = false,
                Message = "An error occurred while retrieving project member tasks",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get member tasks by assignee
    /// </summary>
    [HttpGet("assignee/{assigneeId}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetMemberTasksByAssignee(int assigneeId)
    {
        try
        {
            var memberTasks = await _memberTaskService.GetMemberTasksByAssigneeAsync(assigneeId);
            var response = new ApiResponse<IEnumerable<TaskDto>>
            {
                Success = true,
                Data = memberTasks
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<TaskDto>>
            {
                Success = false,
                Message = "An error occurred while retrieving assignee member tasks",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Create a new member task
    /// </summary>
    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateMemberTask([FromBody] TaskDto memberTask)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<TaskDto>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            var createdMemberTask = await _memberTaskService.CreateMemberTaskAsync(memberTask);
            var response = new ApiResponse<TaskDto>
            {
                Success = true,
                Data = createdMemberTask,
                Message = "Member task created successfully"
            };

            return CreatedAtAction(nameof(GetMemberTaskById), new { id = createdMemberTask.Id }, response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<TaskDto>
            {
                Success = false,
                Message = "An error occurred while creating the member task",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Update an existing member task
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateMemberTask(int id, [FromBody] TaskDto memberTask)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<TaskDto>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            if (id != memberTask.Id)
            {
                var mismatchResponse = new ApiResponse<TaskDto>
                {
                    Success = false,
                    Message = "ID mismatch"
                };
                return BadRequest(mismatchResponse);
            }

            var updatedMemberTask = await _memberTaskService.UpdateMemberTaskAsync(memberTask);
            if (updatedMemberTask == null)
            {
                var notFoundResponse = new ApiResponse<TaskDto>
                {
                    Success = false,
                    Message = "Member task not found"
                };
                return NotFound(notFoundResponse);
            }

            var response = new ApiResponse<TaskDto>
            {
                Success = true,
                Data = updatedMemberTask,
                Message = "Member task updated successfully"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<TaskDto>
            {
                Success = false,
                Message = "An error occurred while updating the member task",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Update task status
    /// </summary>
    [HttpPut("{id}/status")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] UpdateTaskStatusRequest request)
    {
        try
        {
            // Get the task to ensure it exists
            var task = await _memberTaskService.GetMemberTaskByIdAsync(id);
            if (task == null)
            {
                return Error<object>("Task not found");
            }

            TaskStatusEnum statusId;

            // Try to parse as integer first (for numeric status IDs 1-6)
            if (int.TryParse(request.Status, out int statusIdInt))
            {
                // Validate the numeric status ID is within valid range
                if (Enum.IsDefined(typeof(TaskStatusEnum), statusIdInt))
                {
                    statusId = (TaskStatusEnum)statusIdInt;
                }
                else
                {
                    return Error<object>($"Invalid status ID: {statusIdInt}. Valid values are 1-6.");
                }
            }
            else
            {
                // Fall back to string mapping for backward compatibility
                statusId = request.Status?.ToLower() switch
                {
                    "pending" => TaskStatusEnum.ToDo,
                    "todo" => TaskStatusEnum.ToDo,
                    "in progress" => TaskStatusEnum.InProgress,
                    "inprogress" => TaskStatusEnum.InProgress,
                    "in review" => TaskStatusEnum.InReview,
                    "inreview" => TaskStatusEnum.InReview,
                    "rework" => TaskStatusEnum.Rework,
                    "blocked" => TaskStatusEnum.OnHold,
                    "on hold" => TaskStatusEnum.OnHold,
                    "onhold" => TaskStatusEnum.OnHold,
                    "completed" => TaskStatusEnum.Completed,
                    "done" => TaskStatusEnum.Completed,
                    _ => task.StatusId // Keep existing if invalid
                };
            }

            // Update the status and progress
            task.StatusId = statusId;
            task.Progress = statusId == TaskStatusEnum.Completed ? 100 : task.Progress;

            var updatedTask = await _memberTaskService.UpdateMemberTaskAsync(task);
            
            return Success(updatedTask, message: "Task status updated successfully");
        }
        catch (Exception ex)
        {
            return Error<object>("An error occurred while updating task status", ex.Message);
        }
    }

    /// <summary>
    /// Get the next upcoming task deadline for the current user
    /// </summary>
    [HttpGet("next-deadline")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetNextDeadline()
    {
        try
        {
            // Get current user context
            var userContext = await _userContextAccessor.GetUserContextAsync();
            if (!userContext.IsAuthenticated || !int.TryParse(userContext.PrsId, out int currentUserId))
            {
                return Error<TaskDto>("Unable to retrieve current user information");
            }

            // Get all tasks for current user that are not completed
            var (memberTasks, _) = await _memberTaskService.GetMemberTasksAsync(
                page: 1, 
                limit: 1000, 
                projectId: null, 
                primaryAssigneeId: currentUserId, 
                status: null, 
                priority: null, 
                departmentId: null
            );

            // Filter for incomplete tasks with end dates and get the nearest one
            var nextTask = memberTasks
                .Where(t => t.StatusId != TaskStatusEnum.Completed && t.EndDate != default(DateTime))
                .OrderBy(t => t.EndDate)
                .FirstOrDefault();

            if (nextTask == null)
            {
                return Success<TaskDto?>(null, message: "No upcoming deadlines found");
            }

            return Success(nextTask, message: "Next deadline retrieved successfully");
        }
        catch (Exception ex)
        {
            return Error<TaskDto>("An error occurred while retrieving next deadline", ex.Message);
        }
    }

    /// <summary>
    /// Delete a member task
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteMemberTask(int id)
    {
        try
        {
            var result = await _memberTaskService.DeleteMemberTaskAsync(id);
            if (!result)
            {
                var notFoundResponse = new ApiResponse<object>
                {
                    Success = false,
                    Message = "Member task not found"
                };
                return NotFound(notFoundResponse);
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting the member task",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Change task assignees - removes old assignments and adds new ones
    /// </summary>
    [HttpPost("{id}/change-assignees")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ChangeTaskAssignees(int id, [FromBody] ChangeTaskAssigneesRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<object>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            // Validate that the task exists
            var task = await _memberTaskService.GetMemberTaskByIdAsync(id);
            if (task == null)
            {
                var notFoundResponse = new ApiResponse<object>
                {
                    Success = false,
                    Message = "Task not found"
                };
                return NotFound(notFoundResponse);
            }

            // Convert string IDs to integers with validation
            var assigneeIds = new List<int>();
            foreach (var idStr in request.AssigneeIds)
            {
                try
                {
                    int assigneeId = Convert.ToInt32(idStr);
                    assigneeIds.Add(assigneeId);
                }
                catch (FormatException)
                {
                    var errorResponse = new ApiResponse<object>
                    {
                        Success = false,
                        Message = $"Invalid assignee ID format: {idStr}"
                    };
                    return BadRequest(errorResponse);
                }
            }

            // Change the assignees
            var success = await _memberTaskService.ChangeTaskAssigneesAsync(id, assigneeIds, request.Notes);

            if (!success)
            {
                var errorResponse = new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to change task assignees"
                };
                return StatusCode(500, errorResponse);
            }

            var response = new ApiResponse<object>
            {
                Success = true,
                Message = "Task assignees changed successfully"
            };

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            var errorResponse = new ApiResponse<object>
            {
                Success = false,
                Message = "Unauthorized access",
                Error = ex.Message
            };
            return Unauthorized(errorResponse);
        }
        catch (InvalidOperationException ex)
        {
            var errorResponse = new ApiResponse<object>
            {
                Success = false,
                Message = "Invalid operation",
                Error = ex.Message
            };
            return BadRequest(errorResponse);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while changing task assignees",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }
}

public class UpdateTaskStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class ChangeTaskAssigneesRequest
{
    public List<int> AssigneeIds { get; set; } = new List<int>();
    public string Notes { get; set; } = string.Empty;
}