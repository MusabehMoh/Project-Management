using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace PMA.Infrastructure.Repositories;

public class TaskStatusHistoryRepository : Repository<TaskStatusHistory>, ITaskStatusHistoryRepository
{
    public TaskStatusHistoryRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<TaskStatusHistory>> GetTaskStatusHistoryAsync(int taskId)
    {
        return await _context.TaskStatusHistory
            .Where(h => h.TaskId == taskId)
            .Include(h => h.ChangedBy)
            .OrderByDescending(h => h.UpdatedAt)
            .ToListAsync();
    }
}