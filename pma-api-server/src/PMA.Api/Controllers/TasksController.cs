using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using TaskEntity = PMA.Core.Entities.Task;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ApiBaseController
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    /// <summary>
    /// Get all tasks with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetTasks(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? sprintId = null,
        [FromQuery] int? projectId = null,
        [FromQuery] int? assigneeId = null,
        [FromQuery] int? statusId = null)
    {
        try
        {
            var (tasks, totalCount) = await _taskService.GetTasksAsync(page, limit, sprintId, projectId, assigneeId, statusId);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(tasks, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<TaskEntity>>("An error occurred while retrieving tasks", ex.Message);
        }
    }

    /// <summary>
    /// Get task by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetTaskById(int id)
    {
        try
        {
            var task = await _taskService.GetTaskByIdAsync(id);
            if (task == null)
            {
                return Error<TaskEntity>("Task not found");
            }
            
            return Success(task);
        }
        catch (Exception ex)
        {
            return Error<TaskEntity>("An error occurred while retrieving the task", ex.Message);
        }
    }

    /// <summary>
    /// Get tasks by sprint
    /// </summary>
    [HttpGet("sprint/{sprintId}")]
    [ProducesResponseType(typeof(IEnumerable<TaskEntity>), 200)]
    public async Task<IActionResult> GetTasksBySprint(int sprintId)
    {
        try
        {
            var tasks = await _taskService.GetTasksBySprintAsync(sprintId);
            return Success(tasks);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<TaskEntity>>("An error occurred while retrieving sprint tasks", ex.Message);
        }
    }

    /// <summary>
    /// Get tasks by assignee
    /// </summary>
    [HttpGet("assignee/{assigneeId}")]
    [ProducesResponseType(typeof(IEnumerable<TaskEntity>), 200)]
    public async Task<IActionResult> GetTasksByAssignee(int assigneeId)
    {
        try
        {
            var tasks = await _taskService.GetTasksByAssigneeAsync(assigneeId);
            return Success(tasks);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<TaskEntity>>("An error occurred while retrieving assignee tasks", ex.Message);
        }
    }

    /// <summary>
    /// Create a new task
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(TaskEntity), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateTask([FromBody] TaskEntity task)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<TaskEntity>("Validation failed", string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            }

            var createdTask = await _taskService.CreateTaskAsync(task);
            var response = new ApiResponse<TaskEntity>
            {
                Success = true,
                Data = createdTask,
                Message = "Task created successfully"
            };
            return CreatedAtAction(nameof(GetTaskById), new { id = createdTask.Id }, response);
        }
        catch (Exception ex)
        {
            return Error<TaskEntity>("An error occurred while creating the task", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing task
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(TaskEntity), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskEntity task)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<TaskEntity>("Validation failed", string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            }

            if (id != task.Id)
            {
                return Error<TaskEntity>("ID mismatch");
            }

            var updatedTask = await _taskService.UpdateTaskAsync(task);
            if (updatedTask == null)
            {
                return Error<TaskEntity>("Task not found");
            }
            var response = new ApiResponse<TaskEntity>
            {
                Success = true,
                Data = updatedTask,
                Message = "Task updated successfully"
            };
            return Ok(response);
        }
        catch (Exception ex)
        {
            return Error<TaskEntity>("An error occurred while updating the task", ex.Message);
        }
    }

    /// <summary>
    /// Delete a task
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteTask(int id)
    {
        try
        {
            var result = await _taskService.DeleteTaskAsync(id);
            if (!result)
            {
                return Error<object>("Task not found");
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            return Error<object>("An error occurred while deleting the task", ex.Message);
        }
    }
}