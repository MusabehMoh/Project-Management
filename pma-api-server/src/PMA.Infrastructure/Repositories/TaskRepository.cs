using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;
using TaskEntity = PMA.Core.Entities.Task;

namespace PMA.Infrastructure.Repositories;

public class TaskRepository : Repository<TaskEntity>, ITaskRepository
{
    public TaskRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<TaskEntity> Tasks, int TotalCount)> GetTasksAsync(int page, int limit, int? sprintId = null, int? projectId = null, int? assigneeId = null, int? statusId = null)
    {
        var query = _context.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.Sprint)
            .Include(t => t.SubTasks)
            .AsQueryable();

        if (sprintId.HasValue)
        {
            query = query.Where(t => t.SprintId == sprintId.Value);
        }

        if (projectId.HasValue)
        {
            query = query.Where(t => t.Sprint != null && t.Sprint.ProjectId == projectId.Value);
        }

        if (assigneeId.HasValue)
        {
            query = query.Where(t => t.AssigneeId == assigneeId.Value);
        }

        if (statusId.HasValue)
        {
            query = query.Where(t => (int)t.StatusId == statusId.Value);
        }

        var totalCount = await query.CountAsync();
        var tasks = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (tasks, totalCount);
    }

    public async Task<IEnumerable<TaskEntity>> GetTasksBySprintAsync(int sprintId)
    {
        return await _context.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.SubTasks)
            .Where(t => t.SprintId == sprintId)
            .OrderBy(t => t.StartDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<TaskEntity>> GetTasksByAssigneeAsync(int assigneeId)
    {
        return await _context.Tasks
            .Include(t => t.Sprint)
            .Include(t => t.SubTasks)
            .Where(t => t.AssigneeId == assigneeId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<TaskEntity>> GetTasksByProjectAsync(int projectId)
    {
        return await _context.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.Sprint)
            .Include(t => t.SubTasks)
            .Where(t => t.Sprint != null && t.Sprint.ProjectId == projectId)
            .OrderBy(t => t.StartDate)
            .ToListAsync();
    }

    public async Task<TaskEntity?> GetTaskWithSubTasksAsync(int id)
    {
        return await _context.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.Sprint)
            .Include(t => t.SubTasks)
            .FirstOrDefaultAsync(t => t.Id == id);
    }
}


