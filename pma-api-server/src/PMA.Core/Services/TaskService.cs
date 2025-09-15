using PMA.Core.Entities;
using PMA.Core.Interfaces;
using Task = System.Threading.Tasks.Task;
using TaskEntity = PMA.Core.Entities.Task;

namespace PMA.Core.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;

    public TaskService(ITaskRepository taskRepository)
    {
        _taskRepository = taskRepository;
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
        task.CreatedAt = DateTime.UtcNow;
        task.UpdatedAt = DateTime.UtcNow;
        return await _taskRepository.AddAsync(task);
    }

    public async Task<(IEnumerable<TaskEntity> Tasks, int TotalCount)> GetTasksAsync(int page, int limit, int? sprintId = null, int? projectId = null, int? assigneeId = null, int? statusId = null)
    {
        return await _taskRepository.GetTasksAsync(page, limit, sprintId, projectId, assigneeId, statusId);
    }

    public async Task<TaskEntity> UpdateTaskAsync(TaskEntity task)
    {
        task.UpdatedAt = DateTime.UtcNow;
        await _taskRepository.UpdateAsync(task);
        return task;
    }

    public async Task<bool> DeleteTaskAsync(int id)
    {
        var task = await _taskRepository.GetByIdAsync(id);
        if (task != null)
        {
            await _taskRepository.DeleteAsync(task);
            return true;
        }
        return false;
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
}



