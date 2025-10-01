using PMA.Core.Entities;
using PMA.Core.Interfaces;
using Task = System.Threading.Tasks.Task;

namespace PMA.Core.Services;

public class MemberTaskService : IMemberTaskService
{
    private readonly IMemberTaskRepository _memberTaskRepository;

    public MemberTaskService(IMemberTaskRepository memberTaskRepository)
    {
        _memberTaskRepository = memberTaskRepository;
    }

    public async Task<(IEnumerable<MemberTask> MemberTasks, int TotalCount)> GetMemberTasksAsync(int page, int limit, int? projectId = null, int? primaryAssigneeId = null, string? status = null, string? priority = null)
    {
        return await _memberTaskRepository.GetMemberTasksAsync(page, limit, projectId, primaryAssigneeId, status, priority);
    }

    public async Task<MemberTask?> GetMemberTaskByIdAsync(int id)
    {
        return await _memberTaskRepository.GetByIdAsync(id);
    }

    public async Task<MemberTask> CreateMemberTaskAsync(MemberTask memberTask)
    {
        memberTask.CreatedAt = DateTime.UtcNow;
        memberTask.UpdatedAt = DateTime.UtcNow;
        return await _memberTaskRepository.AddAsync(memberTask);
    }

    public async Task<MemberTask> UpdateMemberTaskAsync(MemberTask memberTask)
    {
        memberTask.UpdatedAt = DateTime.UtcNow;
        await _memberTaskRepository.UpdateAsync(memberTask);
        return memberTask;
    }

    public async Task<bool> DeleteMemberTaskAsync(int id)
    {
        var memberTask = await _memberTaskRepository.GetByIdAsync(id);
        if (memberTask != null)
        {
            await _memberTaskRepository.DeleteAsync(memberTask);
            return true;
        }
        return false;
    }

    public async Task<IEnumerable<MemberTask>> GetMemberTasksByProjectAsync(int projectId)
    {
        return await _memberTaskRepository.GetMemberTasksByProjectAsync(projectId);
    }

    public async Task<IEnumerable<MemberTask>> GetMemberTasksByAssigneeAsync(int assigneeId)
    {
        return await _memberTaskRepository.GetMemberTasksByAssigneeAsync(assigneeId);
    }
}