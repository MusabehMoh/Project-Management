//using PMA.Core.Entities;
//using PMA.Core.Interfaces;
//using PMA.Infrastructure.Data;
//using Microsoft.EntityFrameworkCore;
//using Task = System.Threading.Tasks.Task;

//namespace PMA.Infrastructure.Repositories;

//public class MemberTaskRepository : Repository<MemberTask>, IMemberTaskRepository
//{
//    public MemberTaskRepository(ApplicationDbContext context) : base(context)
//    {
//    }

//    public async Task<(IEnumerable<MemberTask> MemberTasks, int TotalCount)> GetMemberTasksAsync(int page, int limit, int? projectId = null, int? primaryAssigneeId = null, string? status = null, string? priority = null)
//    {
//        var query = _context.MemberTasks
//            .Include(mt => mt.Department)
//            .AsQueryable();

//        if (projectId.HasValue)
//        {
//            query = query.Where(mt => mt.ProjectId == projectId.Value);
//        }

//        if (primaryAssigneeId.HasValue)
//        {
//            query = query.Where(mt => mt.PrimaryAssigneeId == primaryAssigneeId.Value);
//        }

//        if (!string.IsNullOrEmpty(status))
//        {
//            query = query.Where(mt => mt.Status == status);
//        }

//        if (!string.IsNullOrEmpty(priority))
//        {
//            query = query.Where(mt => mt.Priority == priority);
//        }

//        var totalCount = await query.CountAsync();
//        var memberTasks = await query
//            .OrderByDescending(mt => mt.CreatedAt)
//            .Skip((page - 1) * limit)
//            .Take(limit)
//            .ToListAsync();

//        return (memberTasks, totalCount);
//    }

//    public async Task<IEnumerable<MemberTask>> GetMemberTasksByProjectAsync(int projectId)
//    {
//        return await _context.MemberTasks
//            .Include(mt => mt.Department)
//            .Where(mt => mt.ProjectId == projectId)
//            .OrderByDescending(mt => mt.CreatedAt)
//            .ToListAsync();
//    }

//    public async Task<IEnumerable<MemberTask>> GetMemberTasksByAssigneeAsync(int assigneeId)
//    {
//        return await _context.MemberTasks
//            .Include(mt => mt.Department)
//            .Where(mt => mt.PrimaryAssigneeId == assigneeId)
//            .OrderByDescending(mt => mt.CreatedAt)
//            .ToListAsync();
//    }
//}