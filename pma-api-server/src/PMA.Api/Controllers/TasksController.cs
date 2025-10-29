using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyModel;
using PMA.Core.DTOs;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
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
    private readonly IDesignRequestService _designRequestService;

    public TasksController(
        ITaskService taskService, 
        IMappingService mappingService, 
        IUserContextAccessor userContextAccessor,
        IDesignRequestService designRequestService)
    {
        _taskService = taskService;
        _mappingService = mappingService;
        _userContextAccessor = userContextAccessor;
        _designRequestService = designRequestService;
    }

    /// <summary>
    /// Handle automatic dependent task status updates when developer task status changes
    /// </summary>
    private async Task<IActionResult?> HandleDependentTaskStatusUpdatesAsync(int taskId, Core.Enums.TaskStatus newStatus, int changedByPrsId)
    {
        try
        {
            // Find dependent tasks that are QC tasks
            var taskDependencies = await _taskService.GetTaskDependenciesAsync(taskId);
            var dependentTaskIds = taskDependencies
                .Where(td => td.TaskId != taskId) // Tasks that depend on this task
                .Select(td => td.TaskId)
                .Distinct()
                .ToList();

            // Get the actual dependent task entities
            var dependentTasks = new List<TaskEntity>();
            foreach (var depTaskId in dependentTaskIds)
            {
                var depTask = await _taskService.GetTaskByIdAsync(depTaskId);
                if (depTask != null)
                {
                    dependentTasks.Add(depTask);
                }
            }

            // Handle different status transitions
            if (newStatus == Core.Enums.TaskStatus.InReview)
            {
                // Developer task moved to In Review - unblock dependent QC tasks
                var qcBlockedTasks = dependentTasks
                    .Where(t => t.RoleType?.ToLower() == "qc")
                    .ToList();

                foreach (var qcTask in qcBlockedTasks)
                {
                    qcTask.StatusId = Core.Enums.TaskStatus.InReview;
                    qcTask.Progress = 0; // Reset progress for To Do status
                    qcTask.UpdatedAt = DateTime.Now;

                    // Create task status history record for the dependent task
                    var dependentTaskHistory = new TaskStatusHistory
                    {
                        TaskId = qcTask.Id,
                        OldStatus = Core.Enums.TaskStatus.Blocked,
                        NewStatus = Core.Enums.TaskStatus.InReview,
                        ChangedByPrsId = changedByPrsId,
                        Comment = $"Status automatically changed from Blocked to To Do due to dependent developer task moving to In Review",
                        UpdatedAt = DateTime.Now
                    };

                    await _taskService.CreateTaskStatusHistoryAsync(dependentTaskHistory);
                    await _taskService.UpdateTaskAsync(qcTask);
                }
            }
            else if (newStatus == Core.Enums.TaskStatus.ToDo || newStatus == Core.Enums.TaskStatus.InProgress)
            {
                // Developer task moved back to To Do or In Progress - block dependent QC tasks
                var qcUnblockedTasks = dependentTasks
                    .Where(t => t.RoleType?.ToLower() == "qc" )
                    .ToList();

                foreach (var qcTask in qcUnblockedTasks)
                {
                    var oldStatus = qcTask.StatusId;
                    qcTask.StatusId = Core.Enums.TaskStatus.Blocked;
                    qcTask.Progress = 0; // Reset progress when blocked
                    qcTask.UpdatedAt = DateTime.Now;

                    // Create task status history record for the dependent task
                    var dependentTaskHistory = new TaskStatusHistory
                    {
                        TaskId = qcTask.Id,
                        OldStatus = oldStatus,
                        NewStatus = Core.Enums.TaskStatus.Blocked,
                        ChangedByPrsId = changedByPrsId,
                        Comment = $"Status automatically changed to Blocked due to dependent developer task moving back to {newStatus.ToString()}",
                        UpdatedAt = DateTime.Now
                    };

                    await _taskService.CreateTaskStatusHistoryAsync(dependentTaskHistory);
                    await _taskService.UpdateTaskAsync(qcTask);
                }
            }
            
            return null; // Success - no error
        }
        catch (Exception ex)
        {
            return Error<object>("An error occurred while updating dependent tasks", ex.Message);
        }
    }
    private async Task<IActionResult?> HandlePrerequisitesTaskStatusUpdatesAsync(int taskId, Core.Enums.TaskStatus newStatus, int changedByPrsId)
    {
        try
        {
            

            // Find Prerequisites tasks that are QC tasks
            var taskPrerequisites = await _taskService.GetTaskPrerequisitesAsync(taskId);
            var PrerequisitesTaskIds = taskPrerequisites 
                .Select(td => td.DependsOnTaskId)
                .Distinct()
                .ToList();

            // Get the actual dependent task entities
            var prerequisitesTasks = new List<TaskEntity>();
            foreach (var preTaskId in PrerequisitesTaskIds)
            {
                var preTask = await _taskService.GetTaskByIdAsync(preTaskId);
                if (preTask != null)
                {
                    prerequisitesTasks.Add(preTask);
                }
            }
            if (newStatus == Core.Enums.TaskStatus.InReview)
            {
                // Developer task moved to In Review - unblock dependent QC tasks
                var developerBlockedTasks = prerequisitesTasks
                    .Where(t => t.RoleType?.ToLower() == "developer")
                    .ToList();

                foreach (var qcTask in developerBlockedTasks)
                {
                    qcTask.StatusId = Core.Enums.TaskStatus.InReview;
                    qcTask.Progress = 0; // Reset progress for To Do status
                    qcTask.UpdatedAt = DateTime.Now;

                    // Create task status history record for the dependent task
                    var dependentTaskHistory = new TaskStatusHistory
                    {
                        TaskId = qcTask.Id,
                        OldStatus = Core.Enums.TaskStatus.Blocked,
                        NewStatus = Core.Enums.TaskStatus.InReview,
                        ChangedByPrsId = changedByPrsId,
                        Comment = $"Status automatically changed from Blocked to To Do due to dependent developer task moving to In Review",
                        UpdatedAt = DateTime.Now
                    };

                    await _taskService.CreateTaskStatusHistoryAsync(dependentTaskHistory);
                    await _taskService.UpdateTaskAsync(qcTask);
                }
            }
            else if (newStatus == Core.Enums.TaskStatus.Completed)
            {
                // Task completed - update prerequisites tasks to completed
                foreach (var prereqTask in prerequisitesTasks)
                {
                    var oldStatus = prereqTask.StatusId;
                    prereqTask.StatusId = Core.Enums.TaskStatus.Completed;
                    prereqTask.Progress = 100;
                    prereqTask.UpdatedAt = DateTime.Now;

                    // Create task status history record for the prerequisite task
                    var prereqTaskHistory = new TaskStatusHistory
                    {
                        TaskId = prereqTask.Id,
                        OldStatus = oldStatus,
                        NewStatus = Core.Enums.TaskStatus.Completed,
                        ChangedByPrsId = changedByPrsId,
                        Comment = $"Status automatically changed to Completed due to dependent task being completed",
                        UpdatedAt = DateTime.Now
                    };

                    await _taskService.CreateTaskStatusHistoryAsync(prereqTaskHistory);
                    await _taskService.UpdateTaskAsync(prereqTask);
                }
            }
            else if (newStatus == Core.Enums.TaskStatus.Rework)
            {
                // Task moved to rework - update prerequisites tasks to in progress
                foreach (var prereqTask in prerequisitesTasks)
                {
                    var oldStatus = prereqTask.StatusId;
                    prereqTask.StatusId = Core.Enums.TaskStatus.InProgress;
                    prereqTask.Progress = 25; // Set progress for In Progress status
                    prereqTask.UpdatedAt = DateTime.Now;

                    // Create task status history record for the prerequisite task
                    var prereqTaskHistory = new TaskStatusHistory
                    {
                        TaskId = prereqTask.Id,
                        OldStatus = oldStatus,
                        NewStatus = Core.Enums.TaskStatus.InProgress,
                        ChangedByPrsId = changedByPrsId,
                        Comment = $"Status automatically changed to In Progress due to dependent task moving to Rework",
                        UpdatedAt = DateTime.Now
                    };

                    await _taskService.CreateTaskStatusHistoryAsync(prereqTaskHistory);
                    await _taskService.UpdateTaskAsync(prereqTask);
                }
            }

            return null; // Success - no error
        }
        catch (Exception ex)
        {
            return Error<object>("An error occurred while updating dependent tasks", ex.Message);
        }
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
            // Get current user context for audit trail
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
            // Handle dependent task status updates when developer task status changes
            if (updateTaskDto.StatusId.HasValue &&
                ((int)updateTaskDto.StatusId.Value == (int)Core.Enums.TaskStatus.InReview ||
                 (int)updateTaskDto.StatusId.Value == (int)Core.Enums.TaskStatus.ToDo ||
                 (int)updateTaskDto.StatusId.Value == (int)Core.Enums.TaskStatus.InProgress) &&
                existingTask.RoleType?.ToLower() == "developer")
            {
              

                // Handle dependent task updates
                var dependentUpdateResult = await HandleDependentTaskStatusUpdatesAsync(id, updateTaskDto.StatusId.Value, changedByPrsId);
                if (dependentUpdateResult != null)
                {
                    return dependentUpdateResult;
                }
            }
            // Handle Prerequesite task status updates when developer task status changes
            if ((updateTaskDto.StatusId == Core.Enums.TaskStatus.Completed ||
                 updateTaskDto.StatusId == Core.Enums.TaskStatus.Rework ||
                 updateTaskDto.StatusId == Core.Enums.TaskStatus.InReview) &&
                existingTask.RoleType?.ToLower() == "qc")
            {

                // Handle dependent task updates
                var dependentUpdateResult = await HandlePrerequisitesTaskStatusUpdatesAsync(id, updateTaskDto.StatusId.Value, changedByPrsId);
                if (dependentUpdateResult != null)
                {
                    return dependentUpdateResult;
                }
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
            existingTask.UpdatedAt = DateTime.Now;

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
            existingTask.UpdatedAt = DateTime.Now;

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
                UpdatedAt=DateTime.Now
            };

            await _taskService.CreateTaskStatusHistoryAsync(taskStatusHistory);

            // Update the task status
            existingTask.StatusId = updateStatusDto.StatusId;
            existingTask.UpdatedAt = DateTime.Now;
            
            // Update progress if provided, otherwise use automatic logic
            if (updateStatusDto.Progress.HasValue)
            {
                existingTask.Progress = updateStatusDto.Progress.Value;
            }
            else
            {
                // Set progress based on status
                existingTask.Progress = updateStatusDto.StatusId switch
                {
                     Core.Enums.TaskStatus.ToDo => 0,
                     Core.Enums.TaskStatus.InProgress => 25,
                     Core.Enums.TaskStatus.InReview => 75,
                     Core.Enums.TaskStatus.Completed => 100,
                    _ => 0 // Default fallback
                };
            }
            
            // Update the task
            var updatedTask = await _taskService.UpdateTaskAsync(existingTask);

            // Handle dependent task status updates when developer task status changes
            if ((updateStatusDto.StatusId == Core.Enums.TaskStatus.InReview ||
                 updateStatusDto.StatusId == Core.Enums.TaskStatus.ToDo ||
                 updateStatusDto.StatusId == Core.Enums.TaskStatus.InProgress) &&
                existingTask.RoleType?.ToLower() == "developer")
            {
                // Handle dependent task updates
                var dependentUpdateResult = await HandleDependentTaskStatusUpdatesAsync(id, updateStatusDto.StatusId, changedByPrsId);
                if (dependentUpdateResult != null)
                {
                    return dependentUpdateResult;
                }
            }

            // Handle Prerequesite task status updates when developer task status changes
            if ((updateStatusDto.StatusId == Core.Enums.TaskStatus.Completed ||
                 updateStatusDto.StatusId == Core.Enums.TaskStatus.Rework ||
                 updateStatusDto.StatusId == Core.Enums.TaskStatus.InReview) &&
                existingTask.RoleType?.ToLower() == "qc")
            {
                // Handle dependent task updates
                var dependentUpdateResult = await HandlePrerequisitesTaskStatusUpdatesAsync(id, updateStatusDto.StatusId, changedByPrsId);
                if (dependentUpdateResult != null)
                {
                    return dependentUpdateResult;
                }
            }

            // Map back to DTO for response
            var taskDto = _mappingService.MapToTaskDto(updatedTask);

            return Success(taskDto, message: "Task status updated successfully");
        }
        catch (Exception ex)
        {
            return Error<TaskDto>("An error occurred while updating task status", ex.Message);
        }
    }

    /// <summary>
    /// Check if task has a design request and return its details
    /// </summary>
    [HttpGet("{id}/design-request-check")]
    [ProducesResponseType(typeof(ApiResponse<DesignRequestCheckDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> CheckDesignRequest(int id)
    {
        try
        {
            var task = await _taskService.GetTaskByIdAsync(id);
            if (task == null)
            {
                return Error<object>("Task not found", status: 404);
            }

            // Check if task has a design request
            var designRequest = task.DesignRequests?.FirstOrDefault();
            
            if (designRequest == null)
            {
                return Success(new DesignRequestCheckDto
                {
                    HasDesignRequest = false,
                    DesignRequestId = null,
                    HasDesignerTask = false,
                    DesignerTaskId = null
                });
            }

            return Success(new DesignRequestCheckDto
            {
                HasDesignRequest = true,
                DesignRequestId = designRequest.Id,
                HasDesignerTask = designRequest.DesignerTaskId.HasValue,
                DesignerTaskId = designRequest.DesignerTaskId
            });
        }
        catch (Exception ex)
        {
            return Error<DesignRequestCheckDto>("An error occurred while checking design request", ex.Message);
        }
    }

    /// <summary>
    /// Handle developer completing task without designer (delete design request or mark designer task as completed)
    /// </summary>
    [HttpPost("{id}/complete-from-developer")]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> CompleteFromDeveloper(int id, [FromBody] CompleteFromDeveloperDto dto)
    {
        try
        {
            var task = await _taskService.GetTaskByIdAsync(id);
            if (task == null)
            {
                return Error<object>("Task not found", status: 404);
            }

            // Get design request
            var designRequest = task.DesignRequests?.FirstOrDefault();
            if (designRequest == null)
            {
                return Error<object>("No design request found for this task", status: 400);
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

            // Case 1: No designer task assigned yet - just delete the design request
            if (!designRequest.DesignerTaskId.HasValue)
            {
                await _designRequestService.DeleteDesignRequestAsync(designRequest.Id);
                
                // Mark task as completed from developer
                task.CompletedFromDeveloper = true;
                await _taskService.UpdateTaskAsync(task);

                return Success(new { Message = "Design request deleted successfully" });
            }

            // Case 2: Designer task exists
            if (dto.CompletedWithoutDesigner)
            {
                // Mark the designer task as completed
                var designerTask = await _taskService.GetTaskByIdAsync(designRequest.DesignerTaskId.Value);
                if (designerTask != null)
                {
                    // Create task status history
                    var taskStatusHistory = new TaskStatusHistory
                    {
                        TaskId = designerTask.Id,
                        OldStatus = designerTask.StatusId,
                        NewStatus = Core.Enums.TaskStatus.Completed,
                        ChangedByPrsId = changedByPrsId,
                        Comment = "Completed by developer without designer assistance",
                        UpdatedAt = DateTime.Now
                    };
                    await _taskService.CreateTaskStatusHistoryAsync(taskStatusHistory);

                    designerTask.StatusId = Core.Enums.TaskStatus.Completed;
                    designerTask.Progress = 100;
                    designerTask.UpdatedAt = DateTime.Now;
                    await _taskService.UpdateTaskAsync(designerTask);
                }

                // Mark main task as completed from developer
                task.CompletedFromDeveloper = true;
                await _taskService.UpdateTaskAsync(task);

                return Success(new { Message = "Designer task marked as completed" });
            }
            else
            {
                return Error<object>("CompletedWithoutDesigner flag must be true when designer task exists", status: 400);
            }
        }
        catch (Exception ex)
        {
            return Error<object>("An error occurred while processing the request", ex.Message);
        }
    }
}