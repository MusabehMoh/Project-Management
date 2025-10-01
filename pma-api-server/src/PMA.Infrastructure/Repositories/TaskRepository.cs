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

    // Hide the base GetByIdAsync method to include assignments and dependencies
    public new async Task<TaskEntity?> GetByIdAsync(int id)
    {
        return await _context.Tasks
            .Include(t => t.Assignments)
            .Include(t => t.Dependencies_Relations)
            .Include(t => t.Sprint)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<(IEnumerable<TaskEntity> Tasks, int TotalCount)> GetTasksAsync(int page, int limit, int? sprintId = null, int? projectId = null, int? assigneeId = null, int? statusId = null)
    {
        var query = _context.Tasks
            .Include(t => t.Sprint)
            .Include(t => t.Assignments)
            .Include(t => t.Dependencies_Relations)
            .AsQueryable();

        if (sprintId.HasValue)
        {
            query = query.Where(t => t.SprintId == sprintId.Value);
        }

        if (projectId.HasValue)
        {
            query = query.Where(t => t.Sprint != null && t.Sprint.ProjectId == projectId.Value);
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
            .Where(t => t.SprintId == sprintId)
            .OrderBy(t => t.StartDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<TaskEntity>> GetTasksByAssigneeAsync(int assigneeId)
    {
        return await _context.Tasks
            .Include(t => t.Sprint)
            .Include(t => t.Assignments)
            .Include(t => t.Dependencies_Relations)
            .Where(t => t.Assignments.Any(a => a.PrsId == assigneeId))
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<TaskEntity>> GetTasksByProjectAsync(int projectId)
    {
        return await _context.Tasks
            .Include(t => t.Sprint)
            .Include(t => t.Assignments)
            .Include(t => t.Dependencies_Relations)
            .Where(t => t.Sprint != null && t.Sprint.ProjectId == projectId)
            .OrderBy(t => t.StartDate)
            .ToListAsync();
    }

    public async Task<TaskEntity?> GetTaskWithSubTasksAsync(int id)
    {
        return await _context.Tasks
            .Include(t => t.Sprint)
            .Include(t => t.Assignments)
            .Include(t => t.Dependencies_Relations)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<IEnumerable<TaskEntity>> SearchTasksAsync(string query, int? timelineId = null, int limit = 25)
    {
        var taskQuery = _context.Tasks 
            .AsQueryable();

        // Apply timeline filter if provided
        if (timelineId.HasValue)
        {
            taskQuery = taskQuery.Where(t => t.TimelineId == timelineId.Value);
        }

        // Search in name and description if query is provided
        if (!string.IsNullOrEmpty(query))
        {
            var searchTerm = query.ToLower();
            taskQuery = taskQuery.Where(t => 
                (t.Name != null && t.Name.ToLower().Contains(searchTerm)) || 
                (t.Description != null && t.Description.ToLower().Contains(searchTerm)));
        }

        return await taskQuery
            .OrderByDescending(t => t.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task UpdateTaskAssignmentsAsync(int taskId, IEnumerable<int> memberIds)
    {
        // Remove existing assignments
        var existingAssignments = await _context.TaskAssignments
            .Where(ta => ta.TaskId == taskId)
            .ToListAsync();
        
        _context.TaskAssignments.RemoveRange(existingAssignments);

        // Add new assignments
        var newAssignments = memberIds.Select(memberId => new TaskAssignment
        {
            TaskId = taskId,
            PrsId = memberId,
            AssignedAt = DateTime.UtcNow
        });

        await _context.TaskAssignments.AddRangeAsync(newAssignments);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateTaskDependenciesAsync(int taskId, IEnumerable<int> predecessorIds)
    {
        // Remove existing dependencies
        var existingDependencies = await _context.TaskDependencies
            .Where(td => td.TaskId == taskId)
            .ToListAsync();
        
        _context.TaskDependencies.RemoveRange(existingDependencies);

        // Add new dependencies
        var newDependencies = predecessorIds.Select(predecessorId => new TaskDependency
        {
            TaskId = taskId,
            DependsOnTaskId = predecessorId,
            CreatedAt = DateTime.UtcNow
        });

        await _context.TaskDependencies.AddRangeAsync(newDependencies);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<TaskAssignment>> GetTaskAssignmentsAsync(int taskId)
    {
        return await _context.TaskAssignments
            .Include(ta => ta.Employee)
            .Where(ta => ta.TaskId == taskId)
            .ToListAsync();
    }

    public async Task<IEnumerable<TaskDependency>> GetTaskDependenciesAsync(int taskId)
    {
        return await _context.TaskDependencies
            .Include(td => td.DependsOnTask)
            .Where(td => td.TaskId == taskId)
            .ToListAsync();
    }
}


