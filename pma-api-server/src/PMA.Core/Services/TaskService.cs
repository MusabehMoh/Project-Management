using PMA.Core.Entities;
using PMA.Core.Interfaces;
using Task = System.Threading.Tasks.Task;
using TaskEntity = PMA.Core.Entities.Task;

namespace PMA.Core.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly ITaskStatusHistoryRepository _taskStatusHistoryRepository;

    public TaskService(ITaskRepository taskRepository, ITaskStatusHistoryRepository taskStatusHistoryRepository)
    {
        _taskRepository = taskRepository;
        _taskStatusHistoryRepository = taskStatusHistoryRepository;
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetAllTasksAsync()
    {
        return await _taskRepository.GetAllAsync();
    }

    public async System.Threading.Tasks.Task<TaskEntity?> GetTaskByIdAsync(int id)
    {
        return await _taskRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<TaskEntity> CreateTaskAsync(TaskEntity task)
    {
        task.CreatedAt = DateTime.Now;
        task.UpdatedAt = DateTime.Now;
        return await _taskRepository.AddAsync(task);
    }

    public async Task<(IEnumerable<TaskEntity> Tasks, int TotalCount)> GetTasksAsync(int page, int limit, int? sprintId = null, int? projectId = null, int? assigneeId = null, int? statusId = null)
    {
        return await _taskRepository.GetTasksAsync(page, limit, sprintId, projectId, assigneeId, statusId);
    }

    public async Task<TaskEntity> UpdateTaskAsync(TaskEntity task)
    {
        task.UpdatedAt = DateTime.Now;
        await _taskRepository.UpdateAsync(task);
        return task;
    }

    public async Task<bool> DeleteTaskAsync(int id)
    {
        var task = await _taskRepository.GetByIdAsync(id);
        if (task != null)
        {
            // Clean up assignments before deleting
            await CleanupTaskAssignmentsAsync(id);
            
            // Clean up dependencies before deleting the task
            await CleanupTaskDependenciesAsync(id);
            await _taskRepository.DeleteAsync(task);
            return true;
        }
        return false;
    }

    /// <summary>
    /// Clean up all task assignments for a specific task
    /// Performance: Single database call to remove all assignments
    /// </summary>
    private async System.Threading.Tasks.Task CleanupTaskAssignmentsAsync(int taskId)
    {
        await _taskRepository.CleanupTaskAssignmentsAsync(taskId);
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksBySprintAsync(int sprintId)
    {
        return await _taskRepository.GetTasksBySprintAsync(sprintId);
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksByAssigneeAsync(int assigneeId)
    {
        return await _taskRepository.GetTasksByAssigneeAsync(assigneeId);
    }

    public async System.Threading.Tasks.Task<TaskEntity?> GetTaskWithSubTasksAsync(int id)
    {
        return await _taskRepository.GetTaskWithSubTasksAsync(id);
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskEntity>> SearchTasksAsync(string query, int? timelineId = null, int limit = 25)
    {
        return await _taskRepository.SearchTasksAsync(query, timelineId, limit);
    }

    public async System.Threading.Tasks.Task UpdateTaskAssignmentsAsync(int taskId, IEnumerable<int> memberIds)
    {
        await _taskRepository.UpdateTaskAssignmentsAsync(taskId, memberIds);
    }

    public async System.Threading.Tasks.Task UpdateTaskDependenciesAsync(int taskId, IEnumerable<int> predecessorIds)
    {
        await _taskRepository.UpdateTaskDependenciesAsync(taskId, predecessorIds);
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskAssignment>> GetTaskAssignmentsAsync(int taskId)
    {
        return await _taskRepository.GetTaskAssignmentsAsync(taskId);
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskDependency>> GetTaskDependenciesAsync(int taskId)
    {
        return await _taskRepository.GetTaskDependenciesAsync(taskId);
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskDependency>> GetTaskPrerequisitesAsync(int taskId)
    {
        return await _taskRepository.GetTaskPrerequisitesAsync(taskId);
    }

    public async System.Threading.Tasks.Task CleanupTaskDependenciesAsync(int taskId)
    {
        await _taskRepository.CleanupTaskDependenciesAsync(taskId);
    }

    /// <summary>
    /// Get multiple tasks by IDs in a single database call - reduces N+1 queries
    /// </summary>
    public async System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksByIdsAsync(IEnumerable<int> taskIds)
    {
        return await _taskRepository.GetTasksByIdsAsync(taskIds);
    }

    /// <summary>
    /// Get dependent tasks in a single query - eliminates separate dependency lookup
    /// </summary>
    public async System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetDependentTasksAsync(int taskId)
    {
        return await _taskRepository.GetDependentTasksAsync(taskId);
    }

    /// <summary>
    /// Get prerequisite tasks in a single query - eliminates separate dependency lookup
    /// </summary>
    public async System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetPrerequisiteTasksAsync(int taskId)
    {
        return await _taskRepository.GetPrerequisiteTasksAsync(taskId);
    }

    // TaskStatusHistory methods
    public async System.Threading.Tasks.Task<TaskStatusHistory> CreateTaskStatusHistoryAsync(TaskStatusHistory taskStatusHistory)
    {
        taskStatusHistory.UpdatedAt = DateTime.Now;
        return await _taskStatusHistoryRepository.AddAsync(taskStatusHistory);
    }

    public async System.Threading.Tasks.Task<IEnumerable<TaskStatusHistory>> GetTaskStatusHistoryAsync(int taskId)
    {
        return await _taskStatusHistoryRepository.GetTaskStatusHistoryAsync(taskId);
    }

    // Comments and history methods
    public async System.Threading.Tasks.Task<IEnumerable<TaskComment>> GetTaskCommentsAsync(int taskId)
    {
        return await _taskRepository.GetTaskCommentsAsync(taskId);
    }

    public async System.Threading.Tasks.Task<TaskComment> AddTaskCommentAsync(int taskId, string commentText, string createdBy)
    {
        return await _taskRepository.AddTaskCommentAsync(taskId, commentText, createdBy);
    }

    public async System.Threading.Tasks.Task<IEnumerable<ChangeGroup>> GetTaskHistoryAsync(int taskId)
    {
        return await _taskRepository.GetTaskHistoryAsync(taskId);
    }

    // Attachment methods
    public async System.Threading.Tasks.Task<IEnumerable<TaskAttachment>> GetTaskAttachmentsAsync(int taskId)
    {
        return await _taskRepository.GetTaskAttachmentsAsync(taskId);
    }

    public async System.Threading.Tasks.Task<TaskAttachment?> GetTaskAttachmentByIdAsync(int attachmentId)
    {
        return await _taskRepository.GetTaskAttachmentByIdAsync(attachmentId);
    }

    public async System.Threading.Tasks.Task<TaskAttachment> AddTaskAttachmentAsync(TaskAttachment attachment)
    {
        return await _taskRepository.AddTaskAttachmentAsync(attachment);
    }

    public async System.Threading.Tasks.Task DeleteTaskAttachmentAsync(int attachmentId)
    {
        await _taskRepository.DeleteTaskAttachmentAsync(attachmentId);
    }

    /// <summary>
    /// Cascade task completion status to project requirement and project
    /// Performance optimized: Single query to get all requirements' completion status
    /// Minimal DB calls: Only updates changed statuses
    /// </summary>
    public async System.Threading.Tasks.Task UpdateCascadingStatusAsync(
        TaskEntity completedTask, 
        IProjectRequirementService projectRequirementService,
        IProjectService projectService)
    {
        // Exit early if task not completed or no requirement assigned
        if (completedTask.StatusId != Core.Enums.TaskStatus.Completed || !completedTask.ProjectRequirementId.HasValue)
            return;

        var requirementId = completedTask.ProjectRequirementId.Value;
        var requirement = await projectRequirementService.GetProjectRequirementByIdAsync(requirementId);
        
        if (requirement == null || requirement.Status == Core.Enums.RequirementStatusEnum.Completed)
            return; // Already completed, no need to process

        // OPTIMIZATION: Single query to get all tasks for this requirement
        var requirementTasks = await _taskRepository.GetTasksByProjectRequirementIdAsync(requirementId);
        
        // Check if all tasks are completed
        if (requirementTasks.All(t => t.StatusId == Core.Enums.TaskStatus.Completed))
        {
            // Update requirement status to Completed
            requirement.Status = Core.Enums.RequirementStatusEnum.Completed;
            await projectRequirementService.UpdateProjectRequirementAsync(requirement);

            // OPTIMIZATION: Single query to get all requirements' completion status for the project
            var projectRequirementsStatus = await _taskRepository.GetProjectRequirementsCompletionStatusAsync(requirement.ProjectId);
            
            // Check if all requirements are completed
            if (projectRequirementsStatus.All(r => r.IsCompleted))
            {
                // Update project status to Production
                var project = await projectService.GetProjectByIdAsync(requirement.ProjectId);
                if (project != null && project.Status != Core.Enums.ProjectStatus.Production)
                {
                    project.Status = Core.Enums.ProjectStatus.Production;
                    project.Progress = 100;
                    await projectService.UpdateProjectAsync(project);
                }
            }
        }
    }
}



