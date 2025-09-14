using PMA.Core.Entities;
using PMA.Core.Interfaces;
using Task = System.Threading.Tasks.Task;

namespace PMA.Core.Services;

public class RequirementService : IRequirementService
{
    private readonly IRequirementRepository _requirementRepository;

    public RequirementService(IRequirementRepository requirementRepository)
    {
        _requirementRepository = requirementRepository;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Requirement>> GetAllRequirementsAsync()
    {
        return await _requirementRepository.GetAllAsync();
    }

    public async System.Threading.Tasks.Task<Requirement?> GetRequirementByIdAsync(int id)
    {
        return await _requirementRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<Requirement> CreateRequirementAsync(Requirement requirement)
    {
        requirement.CreatedAt = DateTime.UtcNow;
        requirement.UpdatedAt = DateTime.UtcNow;
        return await _requirementRepository.AddAsync(requirement);
    }

    public async Task<(IEnumerable<Requirement> Requirements, int TotalCount)> GetRequirementsAsync(int page, int limit, int? projectId = null, string? status = null, string? priority = null)
    {
        return await _requirementRepository.GetRequirementsAsync(page, limit, projectId, status, priority);
    }

    public async Task<Requirement> UpdateRequirementAsync(Requirement requirement)
    {
        requirement.UpdatedAt = DateTime.UtcNow;
        await _requirementRepository.UpdateAsync(requirement);
        return requirement;
    }

    public async Task<bool> DeleteRequirementAsync(int id)
    {
        var requirement = await _requirementRepository.GetByIdAsync(id);
        if (requirement != null)
        {
            await _requirementRepository.DeleteAsync(requirement);
            return true;
        }
        return false;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Requirement>> GetRequirementsByProjectAsync(int projectId)
    {
        return await _requirementRepository.GetRequirementsByProjectAsync(projectId);
    }

    public async System.Threading.Tasks.Task<Requirement?> GetRequirementWithCommentsAsync(int id)
    {
        return await _requirementRepository.GetRequirementWithCommentsAsync(id);
    }
}



