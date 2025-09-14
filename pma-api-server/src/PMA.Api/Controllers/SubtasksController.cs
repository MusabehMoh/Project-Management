using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubtasksController : ApiBaseController
{
    private readonly ISubTaskService _subTaskService;

    public SubtasksController(ISubTaskService subTaskService)
    {
        _subTaskService = subTaskService;
    }

    /// <summary>
    /// Get all subtasks with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetSubtasks(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? taskId = null,
        [FromQuery] int? assigneeId = null,
        [FromQuery] int? statusId = null)
    {
        try
        {
            var (subtasks, totalCount) = await _subTaskService.GetSubTasksAsync(page, limit, taskId, assigneeId, statusId);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(subtasks, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<SubTask>>("An error occurred while retrieving subtasks", ex.Message);
        }
    }

    /// <summary>
    /// Get subtask by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetSubtaskById(int id)
    {
        try
        {
            var subtask = await _subTaskService.GetSubTaskByIdAsync(id);
            if (subtask == null)
            {
                return Error<SubTask>("Subtask not found");
            }
            
            return Success(subtask);
        }
        catch (Exception ex)
        {
            return Error<SubTask>("An error occurred while retrieving the subtask", ex.Message);
        }
    }

    /// <summary>
    /// Get subtasks by task
    /// </summary>
    [HttpGet("task/{taskId}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetSubtasksByTask(int taskId)
    {
        try
        {
            var subtasks = await _subTaskService.GetSubTasksByTaskAsync(taskId);
            return Success(subtasks);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<SubTask>>("An error occurred while retrieving task subtasks", ex.Message);
        }
    }

    /// <summary>
    /// Get subtasks by assignee
    /// </summary>
    [HttpGet("assignee/{assigneeId}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetSubtasksByAssignee(int assigneeId)
    {
        try
        {
            var subtasks = await _subTaskService.GetSubTasksByAssigneeAsync(assigneeId);
            return Success(subtasks);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<SubTask>>("An error occurred while retrieving assignee subtasks", ex.Message);
        }
    }

    /// <summary>
    /// Create a new subtask
    /// </summary>
    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateSubtask([FromBody] SubTask subtask)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<SubTask>("Validation failed", string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            }

            var createdSubtask = await _subTaskService.CreateSubTaskAsync(subtask);
            var response = new ApiResponse<SubTask>
            {
                Success = true,
                Data = createdSubtask,
                Message = "Subtask created successfully"
            };
            return CreatedAtAction(nameof(GetSubtaskById), new { id = createdSubtask.Id }, response);
        }
        catch (Exception ex)
        {
            return Error<SubTask>("An error occurred while creating the subtask", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing subtask
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateSubtask(int id, [FromBody] SubTask subtask)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<SubTask>("Validation failed", string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            }

            if (id != subtask.Id)
            {
                return Error<SubTask>("ID mismatch");
            }

            var updatedSubtask = await _subTaskService.UpdateSubTaskAsync(subtask);
            if (updatedSubtask == null)
            {
                return Error<SubTask>("Subtask not found");
            }
            
            var response = new ApiResponse<SubTask>
            {
                Success = true,
                Data = updatedSubtask,
                Message = "Subtask updated successfully"
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            return Error<SubTask>("An error occurred while updating the subtask", ex.Message);
        }
    }

    /// <summary>
    /// Delete a subtask
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteSubtask(int id)
    {
        try
        {
            var result = await _subTaskService.DeleteSubTaskAsync(id);
            if (!result)
            {
                return Error<object>("Subtask not found");
            }
            
            return NoContent();
        }
        catch (Exception ex)
        {
            return Error<object>("An error occurred while deleting the subtask", ex.Message);
        }
    }
}