using PMA.Core.DTOs;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.Enums;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;

namespace PMA.Core.Services;

/// <summary>
/// Service for managing requirement tasks and their associated role-specific tasks
/// Follows Single Responsibility Principle by focusing only on requirement task management
/// Uses existing ITaskService for task operations
/// </summary>
public class RequirementTaskManagementService : IRequirementTaskManagementService
{
    private readonly IProjectRequirementService _projectRequirementService;
    private readonly ITaskService _taskService;

    public RequirementTaskManagementService(
        IProjectRequirementService projectRequirementService,
        ITaskService taskService)
    {
        _projectRequirementService = projectRequirementService;
        _taskService = taskService;
    }

    public async Task<RequirementTaskResult> CreateOrUpdateRequirementTaskAsync(int requirementId, CreateRequirementTaskDto taskDto)
    {
        try
        {
            // Create or update the main requirement task
            var requirementTask = await _projectRequirementService.CreateRequirementTaskAsync(requirementId, taskDto);
            if (requirementTask == null)
            {
                return new RequirementTaskResult
                {
                    Success = false,
                    ErrorMessage = "Project requirement not found"
                };
            }

            // Get the project requirement details
            var requirement = await _projectRequirementService.GetProjectRequirementByIdAsync(requirementId);
            if (requirement == null)
            {
                return new RequirementTaskResult
                {
                    Success = false,
                    ErrorMessage = "Project requirement not found"
                };
            }

            // Create tasks for all assigned roles
            var createdTasks = await CreateTasksForAssignedRolesAsync(requirementId, taskDto, requirement);

            return new RequirementTaskResult
            {
                RequirementTask = requirementTask,
                CreatedTasks = createdTasks,
                Success = true
            };
        }
        catch (Exception ex)
        {
            return new RequirementTaskResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    #region Private Helper Methods

    /// <summary>
    /// Creates tasks for all assigned roles (Developer, QC, Designer)
    /// Each assignee gets their own separate task
    /// Handles reassignments by cleaning up old assignee tasks
    /// Creates dependencies between tasks (QC depends on Developer)
    /// </summary>
    private async System.Threading.Tasks.Task<List<PMA.Core.Entities.Task>> CreateTasksForAssignedRolesAsync(
        int requirementId, 
        CreateRequirementTaskDto taskDto, 
        ProjectRequirement requirement)
    {
        var createdTasks = new List<PMA.Core.Entities.Task>();
        PMA.Core.Entities.Task? developerTask = null;

        // Handle Developer reassignment
        await HandleRoleReassignmentAsync(requirementId, "Developer", taskDto.DeveloperId);
        if (taskDto.DeveloperId.HasValue)
        {
            developerTask = await CreateOrUpdateTaskForRoleAsync(
                requirementId, 
                taskDto.DeveloperId.Value, 
                "Developer", 
                taskDto.DeveloperStartDate, 
                taskDto.DeveloperEndDate,
                TaskStatusEnum.ToDo,
                taskDto.Description, 
                requirement);
            
            if (developerTask != null)
                createdTasks.Add(developerTask);
        }

        // Handle QC reassignment
        await HandleRoleReassignmentAsync(requirementId, "QC", taskDto.QcId);
        if (taskDto.QcId.HasValue)
        {
            var qcTask = await CreateOrUpdateTaskForRoleAsync(
                requirementId, 
                taskDto.QcId.Value, 
                "QC", 
                taskDto.QcStartDate, 
                taskDto.QcEndDate,
                TaskStatusEnum.Blocked,
                taskDto.Description,
                requirement);
            
            if (qcTask != null)
            {
                createdTasks.Add(qcTask);
                
                // Create dependency: QC task depends on Developer task
                if (developerTask != null)
                {
                    await _taskService.UpdateTaskDependenciesAsync(qcTask.Id, new List<int> { developerTask.Id });
                }
            }
        }

        // Handle Designer reassignment
        await HandleRoleReassignmentAsync(requirementId, "Designer", taskDto.DesignerId);
        if (taskDto.DesignerId.HasValue)
        {
            var designerTask = await CreateOrUpdateTaskForRoleAsync(
                requirementId, 
                taskDto.DesignerId.Value, 
                "Designer", 
                taskDto.DesignerStartDate, 
                taskDto.DesignerEndDate,
                TaskStatusEnum.ToDo,
                taskDto.Description, 
                requirement);
            
            if (designerTask != null)
                createdTasks.Add(designerTask);
        }

        return createdTasks;
    }

    /// <summary>
    /// Handles role reassignment by cleaning up tasks from old assignees
    /// </summary>
    private async System.Threading.Tasks.Task HandleRoleReassignmentAsync(int requirementId, string roleType, int? newAssigneeId)
    {
        var existingTasks = await GetExistingTasksForRoleAsync(requirementId, roleType);
        
        foreach (var existingTask in existingTasks)
        {
            var currentAssignees = existingTask.Assignments.Select(a => a.PrsId).ToList();
            
            // If no new assignee is specified, remove all existing tasks for this role
            if (!newAssigneeId.HasValue)
            {
                await _taskService.DeleteTaskAsync(existingTask.Id);
                continue;
            }
            
            // If the task is assigned to someone other than the new assignee, remove it
            if (currentAssignees.Any() && !currentAssignees.Contains(newAssigneeId.Value))
            {
                await _taskService.DeleteTaskAsync(existingTask.Id);
            }
        }
    }

    /// <summary>
    /// Removes tasks for assignees that are no longer assigned to a specific role
    /// </summary>
    private async System.Threading.Tasks.Task CleanupUnassignedRoleTasksAsync(int requirementId, string roleType, IEnumerable<int> currentAssigneeIds)
    {
        // Get all existing tasks for this requirement and role type
        var existingTasks = await GetExistingTasksForRoleAsync(requirementId, roleType);
        
        // Find tasks assigned to users who are no longer in the current assignee list
        var tasksToRemove = existingTasks.Where(task => 
            task.Assignments.Any(assignment => !currentAssigneeIds.Contains(assignment.PrsId))
        ).ToList();

        foreach (var taskToRemove in tasksToRemove)
        {
            await _taskService.DeleteTaskAsync(taskToRemove.Id);
        }
    }

    /// <summary>
    /// Removes all tasks for a specific role when no one is assigned
    /// </summary>
    private async System.Threading.Tasks.Task CleanupAllRoleTasksAsync(int requirementId, string roleType)
    {
        var existingTasks = await GetExistingTasksForRoleAsync(requirementId, roleType);
        
        foreach (var task in existingTasks)
        {
            await _taskService.DeleteTaskAsync(task.Id);
        }
    }

    /// <summary>
    /// Gets all existing tasks for a specific requirement and role type
    /// </summary>
    private async System.Threading.Tasks.Task<List<PMA.Core.Entities.Task>> GetExistingTasksForRoleAsync(int requirementId, string roleType)
    {
        // Get all tasks and filter by requirement and role type
        var (allTasks, _) = await _taskService.GetTasksAsync(1, 1000, projectId: null, assigneeId: null, statusId: null);
        
        return allTasks.Where(t => 
            t.ProjectRequirementId == requirementId &&
            t.TypeId == TaskTypes.ChangeRequest &&
            !string.IsNullOrEmpty(t.RoleType) && 
            t.RoleType == roleType
        ).ToList();
    }

    /// <summary>
    /// Creates or updates a task for a specific assignee and role
    /// </summary>
    private async Task<PMA.Core.Entities.Task?> CreateOrUpdateTaskForRoleAsync(
        int requirementId,
        int assigneeId,
        string roleType,
        DateTime? startDate,
        DateTime? endDate,
        TaskStatusEnum? StatusId,
        string? description,
        ProjectRequirement requirement)
    {
        // Look for existing task for this specific requirement and assignee
        var existingTask = await FindExistingTaskForAssigneeAsync(requirementId, assigneeId, roleType);

        if (existingTask != null)
        {
            return await UpdateExistingTaskAsync(existingTask, startDate, endDate, description, assigneeId);
        }
        else
        {
            return await CreateNewTaskForRoleAsync(requirementId, assigneeId, roleType, 
                startDate, endDate, description, StatusId, requirement);
        }
    }

    /// <summary>
    /// Finds an existing ChangeRequest task for a specific requirement and assignee
    /// </summary>
    private async Task<PMA.Core.Entities.Task?> FindExistingTaskForAssigneeAsync(int requirementId, int assigneeId, string roleType)
    {
        // Get all tasks for this assignee
        var assigneeTasks = await _taskService.GetTasksByAssigneeAsync(assigneeId);
        
        // Find task for this specific requirement and role type
        return assigneeTasks.FirstOrDefault(task => 
            task.ProjectRequirementId == requirementId && 
            task.TypeId == TaskTypes.ChangeRequest &&
            !string.IsNullOrEmpty(task.RoleType) && 
            task.RoleType.Contains(roleType)); // Use role type in name to differentiate
    }

    /// <summary>
    /// Updates an existing task with new information
    /// </summary>
    private async Task<PMA.Core.Entities.Task> UpdateExistingTaskAsync(
        PMA.Core.Entities.Task existingTask,
        DateTime? startDate,
        DateTime? endDate,
        string? description,
        int assigneeId)
    {
        existingTask.Description = description ?? existingTask.Description;
        existingTask.StartDate = startDate ?? existingTask.StartDate;
        existingTask.EndDate = endDate ?? existingTask.EndDate;
        existingTask.UpdatedAt = DateTime.Now;

        await _taskService.UpdateTaskAsync(existingTask);
        await _taskService.UpdateTaskAssignmentsAsync(existingTask.Id, new List<int> { assigneeId });
        
        return existingTask;
    }

    /// <summary>
    /// Creates a new task for a specific role
    /// </summary>
    private async Task<PMA.Core.Entities.Task?> CreateNewTaskForRoleAsync(
        int requirementId,
        int assigneeId,
        string roleType,
        DateTime? startDate,
        DateTime? endDate,
        string? description,
        TaskStatusEnum? StatusId,
        ProjectRequirement requirement)
    {
        var newTask = TaskEntityFactory.CreateChangeRequestTask(
            requirementId, roleType, startDate, endDate, description, StatusId, requirement);
            
        var createdTask = await _taskService.CreateTaskAsync(newTask);

        if (createdTask != null)
        {
            await _taskService.UpdateTaskAssignmentsAsync(createdTask.Id, new List<int> { assigneeId });
        }

        return createdTask;
    }

    #endregion
}

/// <summary>
/// Factory for creating task entities
/// Follows Single Responsibility Principle for task creation logic
/// </summary>
public static class TaskEntityFactory
{
    private const int DefaultSprintId = 1; // This should come from configuration

    public static PMA.Core.Entities.Task CreateChangeRequestTask(
        int requirementId,
        string roleType,
        DateTime? startDate,
        DateTime? endDate,
        string? description,
        TaskStatusEnum? StatusId,
        ProjectRequirement requirement)
    {
        var defaultStartDate = DateTime.Now;
        var defaultEndDate = DateTime.Now.AddDays(7);

        return new PMA.Core.Entities.Task
        {
            Name = requirement.Name,
            Description = description ?? $"{roleType} task for requirement: {requirement.Name}",
            ProjectRequirementId = requirementId,
            SprintId=null,
            StartDate = startDate ?? defaultStartDate,
            EndDate = endDate ?? defaultEndDate,
            StatusId = StatusId ?? TaskStatusEnum.ToDo,
            PriorityId = Priority.Medium,
            TypeId = TaskTypes.ChangeRequest,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now,
            RoleType = roleType,
            Progress = 0
        };
    }
}