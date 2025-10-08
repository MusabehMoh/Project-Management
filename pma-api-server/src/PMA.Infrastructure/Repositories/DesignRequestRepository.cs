using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace PMA.Infrastructure.Repositories;

public class DesignRequestRepository : Repository<DesignRequest>, IDesignRequestRepository
{
    public DesignRequestRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<DesignRequest> DesignRequests, int TotalCount)> GetDesignRequestsAsync(int page, int limit, int? taskId = null, int? assignedToPrsId = null, int? status = null)
    {
        var query = _context.DesignRequests
            .Include(dr => dr.Task)
            .Include(dr => dr.AssignedToUser)
            .AsQueryable();

        if (taskId.HasValue)
        {
            query = query.Where(dr => dr.TaskId == taskId.Value);
        }

        if (assignedToPrsId.HasValue)
        {
            query = query.Where(dr => dr.AssignedToPrsId == assignedToPrsId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(dr => dr.Status == status.Value);
        }

        var totalCount = await query.CountAsync();
        var designRequests = await query
            .OrderByDescending(dr => dr.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (designRequests, totalCount);
    }

    public async Task<DesignRequest?> GetDesignRequestByTaskIdAsync(int taskId)
    {
        return await _context.DesignRequests
            .Include(dr => dr.Task)
            .Include(dr => dr.AssignedToUser)
            .FirstOrDefaultAsync(dr => dr.TaskId == taskId);
    }

    public async Task<bool> HasDesignRequestForTaskAsync(int taskId)
    {
        return await _context.DesignRequests
            .AnyAsync(dr => dr.TaskId == taskId);
    }

    public async Task<IEnumerable<int>> GetTaskIdsWithDesignRequestsAsync(IEnumerable<int> taskIds)
    {
        var taskIdsList = taskIds.ToList();
        return await _context.DesignRequests
            .Where(dr => dr.TaskId.HasValue && taskIdsList.Contains(dr.TaskId.Value))
            .Select(dr => dr.TaskId!.Value)
            .Distinct()
            .ToListAsync();
    }
}