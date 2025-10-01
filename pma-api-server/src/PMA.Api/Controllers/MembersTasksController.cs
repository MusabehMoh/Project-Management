using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MembersTasksController : ApiBaseController
{
    private readonly IMemberTaskService _memberTaskService;
    private readonly ICurrentUserProvider _currentUserProvider;

    public MembersTasksController(IMemberTaskService memberTaskService, ICurrentUserProvider currentUserProvider)
    {
        _memberTaskService = memberTaskService;
        _currentUserProvider = currentUserProvider;
    }

    /// <summary>
    /// Get all member tasks with pagination and filtering
    /// </summary>
    [HttpGet]
    [AllowAnonymous] // Temporary for testing - remove in production
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetMemberTasks(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? projectId = null,
        [FromQuery] int? primaryAssigneeId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? priority = null)
    {
        try
        {
            // Get current user's PRS ID - for testing with anonymous access, use a default user
            var currentUserPrsId = await _currentUserProvider.GetCurrentUserPrsIdAsync();
            if (string.IsNullOrEmpty(currentUserPrsId))
            {
                // For testing purposes, use a default user ID when no authentication
                // In production, this should return Unauthorized
                currentUserPrsId = "1"; // Default test user ID
                // return Unauthorized("Unable to determine current user");
            }

            // Convert PRS ID to int (assuming PRS ID can be converted to int)
            if (!int.TryParse(currentUserPrsId, out int currentUserId))
            {
                return BadRequest("Invalid user identifier");
            }

            // Use the current user ID as the primaryAssigneeId filter to get only tasks assigned to this user
            var (memberTasks, totalCount) = await _memberTaskService.GetMemberTasksAsync(page, limit, projectId, currentUserId, status, priority);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(memberTasks, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<MemberTask>>("An error occurred while retrieving member tasks", ex.Message);
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
                var notFoundResponse = new ApiResponse<MemberTask>
                {
                    Success = false,
                    Message = "Member task not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<MemberTask>
            {
                Success = true,
                Data = memberTask
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<MemberTask>
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
            var response = new ApiResponse<IEnumerable<MemberTask>>
            {
                Success = true,
                Data = memberTasks
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<MemberTask>>
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
            var response = new ApiResponse<IEnumerable<MemberTask>>
            {
                Success = true,
                Data = memberTasks
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<MemberTask>>
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
    public async Task<IActionResult> CreateMemberTask([FromBody] MemberTask memberTask)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<MemberTask>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            var createdMemberTask = await _memberTaskService.CreateMemberTaskAsync(memberTask);
            var response = new ApiResponse<MemberTask>
            {
                Success = true,
                Data = createdMemberTask,
                Message = "Member task created successfully"
            };
            
            return CreatedAtAction(nameof(GetMemberTaskById), new { id = createdMemberTask.Id }, response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<MemberTask>
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
    public async Task<IActionResult> UpdateMemberTask(int id, [FromBody] MemberTask memberTask)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<MemberTask>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            if (id != memberTask.Id)
            {
                var mismatchResponse = new ApiResponse<MemberTask>
                {
                    Success = false,
                    Message = "ID mismatch"
                };
                return BadRequest(mismatchResponse);
            }

            var updatedMemberTask = await _memberTaskService.UpdateMemberTaskAsync(memberTask);
            if (updatedMemberTask == null)
            {
                var notFoundResponse = new ApiResponse<MemberTask>
                {
                    Success = false,
                    Message = "Member task not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<MemberTask>
            {
                Success = true,
                Data = updatedMemberTask,
                Message = "Member task updated successfully"
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<MemberTask>
            {
                Success = false,
                Message = "An error occurred while updating the member task",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
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
}