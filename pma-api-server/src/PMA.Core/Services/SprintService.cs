using PMA.Core.Entities;
using PMA.Core.Interfaces;
using Task = System.Threading.Tasks.Task;

namespace PMA.Core.Services;

public class SprintService : ISprintService
{
    private readonly ISprintRepository _sprintRepository;

    public SprintService(ISprintRepository sprintRepository)
    {
        _sprintRepository = sprintRepository;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Sprint>> GetAllSprintsAsync()
    {
        return await _sprintRepository.GetAllAsync();
    }

    public async System.Threading.Tasks.Task<Sprint?> GetSprintByIdAsync(int id)
    {
        return await _sprintRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<Sprint> CreateSprintAsync(Sprint sprint)
    {
        sprint.CreatedAt = DateTime.Now;
        sprint.UpdatedAt = DateTime.Now;
        return await _sprintRepository.AddAsync(sprint);
    }

    public async Task<(IEnumerable<Sprint> Sprints, int TotalCount)> GetSprintsAsync(int page, int limit, int? projectId = null, int? status = null)
    {
        return await _sprintRepository.GetSprintsAsync(page, limit, projectId, status);
    }

    public async Task<Sprint> UpdateSprintAsync(Sprint sprint)
    {
        sprint.UpdatedAt = DateTime.Now;
        await _sprintRepository.UpdateAsync(sprint);
        return sprint;
    }

    public async Task<bool> DeleteSprintAsync(int id)
    {
        var sprint = await _sprintRepository.GetByIdAsync(id);
        if (sprint != null)
        {
            await _sprintRepository.DeleteAsync(sprint);
            return true;
        }
        return false;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Sprint>> GetSprintsByProjectAsync(int projectId)
    {
        return await _sprintRepository.GetSprintsByProjectAsync(projectId);
    }

    public async System.Threading.Tasks.Task<Sprint?> GetActiveSprintByProjectAsync(int projectId)
    {
        return await _sprintRepository.GetActiveSprintByProjectAsync(projectId);
    }
}



