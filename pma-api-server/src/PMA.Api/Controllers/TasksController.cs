using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.Services;
using TaskEntity = PMA.Core.Entities.Task;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ApiBaseController
{
    private readonly ITaskService _taskService;
    private readonly IMappingService _mappingService;
    private readonly IUserContextAccessor _userContextAccessor;

    public TasksController(ITaskService taskService, IMappingService mappingService, IUserContextAccessor userContextAccessor)
    {
        _taskService = taskService;
        _mappingService = mappingService;
        _userContextAccessor = userContextAccessor;
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
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto createTaskDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            // Map DTO to entity
            var task = _mappingService.MapToTask(createTaskDto);

            // Create the task
            var createdTask = await _taskService.CreateTaskAsync(task);

            // Handle assignments if provided
            if (createTaskDto.MemberIds != null && createTaskDto.MemberIds.Any())
            {
                await _taskService.UpdateTaskAssignmentsAsync(createdTask.Id, createTaskDto.MemberIds);
            }

            // Handle dependencies if provided
            if (createTaskDto.DepTaskIds != null && createTaskDto.DepTaskIds.Any())
            {
                await _taskService.UpdateTaskDependenciesAsync(createdTask.Id, createTaskDto.DepTaskIds);
            }

            // Map back to DTO for response
            var taskDto = _mappingService.MapToTaskDto(createdTask);

            return Created(taskDto, nameof(GetTaskById), new { id = createdTask.Id }, "Task created successfully");
        }
        catch (Exception ex)
        {
            return Error<TaskDto>("An error occurred while creating the task", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing task
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDto updateTaskDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            // Get existing task
            var existingTask = await _taskService.GetTaskByIdAsync(id);
            if (existingTask == null)
            {
                return Error<object>("Task not found", status: 404);
            }

            // Update the task using the mapping service
            _mappingService.UpdateTaskFromDto(existingTask, updateTaskDto);

            // Update the task
            var updatedTask = await _taskService.UpdateTaskAsync(existingTask);

            // Update assignments if provided
            if (updateTaskDto.MemberIds != null)
            {
                await _taskService.UpdateTaskAssignmentsAsync(id, updateTaskDto.MemberIds);
            }

            // Update dependencies if provided
            if (updateTaskDto.DepTaskIds != null)
            {
                await _taskService.UpdateTaskDependenciesAsync(id, updateTaskDto.DepTaskIds);
            }

            // Map back to DTO for response
            var taskDto = _mappingService.MapToTaskDto(updatedTask);

            return Success(taskDto, message: "Task updated successfully");
        }
        catch (Exception ex)
        {
            return Error<TaskDto>("An error occurred while updating the task", ex.Message);
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

    /// <summary>
    /// Move a task by specified number of days
    /// </summary>
    [HttpPost("{id}/move")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    public async Task<IActionResult> MoveTask(int id, [FromBody] MoveTaskDto moveTaskDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            // Get existing task
            var existingTask = await _taskService.GetTaskByIdAsync(id);
            if (existingTask == null)
            {
                return Error<object>("Task not found", status: 404);
            }

            // Move the task by the specified number of days
            var daysToMove = moveTaskDto.MoveDays;
            existingTask.StartDate = existingTask.StartDate.AddDays(daysToMove);
            existingTask.EndDate = existingTask.EndDate.AddDays(daysToMove);
            existingTask.UpdatedAt = DateTime.UtcNow;

            // Update the task
            var updatedTask = await _taskService.UpdateTaskAsync(existingTask);

            // Map to DTO for response
            var taskDto = _mappingService.MapToTaskDto(updatedTask);

            return Success(taskDto, message: $"Task moved by {daysToMove} days successfully");
        }
        catch (Exception ex)
        {
            return Error<TaskDto>("An error occurred while moving the task", ex.Message);
        }
    }

    /// <summary>
    /// Move a task to another sprint
    /// </summary>
    [HttpPost("{id}/move-to-sprint")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    public async Task<IActionResult> MoveTaskToSprint(int id, [FromBody] MoveTaskToSprintDto moveTaskToSprintDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            // Get existing task
            var existingTask = await _taskService.GetTaskByIdAsync(id);
            if (existingTask == null)
            {
                return Error<object>("Task not found", status: 404);
            }

            // Move the task to the target sprint
            existingTask.SprintId = moveTaskToSprintDto.TargetSprintId;
            existingTask.UpdatedAt = DateTime.UtcNow;

            // Update the task
            var updatedTask = await _taskService.UpdateTaskAsync(existingTask);

            // Map to DTO for response
            var taskDto = _mappingService.MapToTaskDto(updatedTask);

            return Success(taskDto, message: $"Task moved to sprint {moveTaskToSprintDto.TargetSprintId} successfully");
        }
        catch (Exception ex)
        {
            return Error<TaskDto>("An error occurred while moving the task to sprint", ex.Message);
        }
    }

    /// <summary>
    /// Search tasks by query and optional timeline filter
    /// </summary>
    [HttpGet("searchTasks")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> SearchTasks(
        [FromQuery] string query = "",
        [FromQuery] int? timelineId = null,
        [FromQuery] int limit = 25)
    {
        try
        {
            var tasks = await _taskService.SearchTasksAsync(query, timelineId, limit);
            return Success(tasks);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<TaskEntity>>("An error occurred while searching tasks", ex.Message);
        }
    }

    /// <summary>
    /// Create a new AdHoc task
    /// </summary>
    [HttpPost("adhoc")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    public async Task<IActionResult> CreateAdHocTask([FromBody] CreateAdHocTaskDto createAdHocTaskDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            // Map DTO to entity
            var task = _mappingService.MapToAdHocTask(createAdHocTaskDto);

            // Create the task
            var createdTask = await _taskService.CreateTaskAsync(task);

            // Handle assignments - AdHoc tasks always have assignments
            if (createAdHocTaskDto.AssignedMembers != null && createAdHocTaskDto.AssignedMembers.Any())
            {
                await _taskService.UpdateTaskAssignmentsAsync(createdTask.Id, createAdHocTaskDto.AssignedMembers);
            }

            // Map back to DTO for response
            var taskDto = _mappingService.MapToTaskDto(createdTask);

            return Created(taskDto, nameof(GetTaskById), new { id = createdTask.Id }, "AdHoc task created successfully");
        }
        catch (Exception ex)
        {
            return Error<TaskDto>("An error occurred while creating the AdHoc task", ex.Message);
        }
    }

    /// <summary>
    /// Update task status
    /// </summary>
    [HttpPatch("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] UpdateTaskStatusDto updateStatusDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<object>("Validation failed: " + string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)), status: 400);
            }

            // Get existing task
            var existingTask = await _taskService.GetTaskByIdAsync(id);
            if (existingTask == null)
            {
                return Error<object>("Task not found", status: 404);
            }

            // Get current user context
            var userContext = await _userContextAccessor.GetUserContextAsync();
            if (!userContext.IsAuthenticated || string.IsNullOrEmpty(userContext.PrsId))
            {
                return Error<object>("Unable to identify current user", status: 401);
            }

            // Parse PrsId to int
            if (!int.TryParse(userContext.PrsId, out var changedByPrsId))
            {
                return Error<object>("Invalid user identifier", status: 401);
            }

            // Create task status history record
            var taskStatusHistory = new TaskStatusHistory
            {
                TaskId = id,
                OldStatus = existingTask.StatusId,
                NewStatus = updateStatusDto.StatusId,
                ChangedByPrsId = changedByPrsId,
                Comment = updateStatusDto.Comment,
                UpdatedAt=DateTime.UtcNow
            };

            await _taskService.CreateTaskStatusHistoryAsync(taskStatusHistory);

            // Update the task status
            existingTask.StatusId = updateStatusDto.StatusId;
            existingTask.UpdatedAt = DateTime.UtcNow;
            
            // Update progress if provided, otherwise use automatic logic
            if (updateStatusDto.Progress.HasValue)
            {
                existingTask.Progress = updateStatusDto.Progress.Value;
            }
            else
            {
                // Fallback: Set to 100 if Completed, otherwise 0
                existingTask.Progress = updateStatusDto.StatusId == Core.Enums.TaskStatus.Completed ? 100 : 0;
            }
            
            // Update the task
            var updatedTask = await _taskService.UpdateTaskAsync(existingTask);

            // Map back to DTO for response
            var taskDto = _mappingService.MapToTaskDto(updatedTask);

            return Success(taskDto, message: "Task status updated successfully");
        }
        catch (Exception ex)
        {
            return Error<TaskDto>("An error occurred while updating task status", ex.Message);
        }
    }
}