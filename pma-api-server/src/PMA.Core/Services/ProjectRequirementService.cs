using PMA.Core.DTOs;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class ProjectRequirementService : IProjectRequirementService
{
    private readonly IProjectRequirementRepository _projectRequirementRepository;
    private readonly IProjectRepository _projectRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICurrentUserProvider _currentUserProvider;

    public ProjectRequirementService(
        IProjectRequirementRepository projectRequirementRepository, 
        IProjectRepository projectRepository,
        IEmployeeRepository employeeRepository,
        ICurrentUserProvider currentUserProvider)
    {
        _projectRequirementRepository = projectRequirementRepository;
        _projectRepository = projectRepository;
        _employeeRepository = employeeRepository;
        _currentUserProvider = currentUserProvider;
    }

    public async Task<(IEnumerable<ProjectRequirement> ProjectRequirements, int TotalCount)> GetProjectRequirementsAsync(int page, int limit, int? projectId = null, string? status = null, string? priority = null)
    {
        return await _projectRequirementRepository.GetProjectRequirementsAsync(page, limit, projectId, status, priority);
    }

    public async Task<ProjectRequirement?> GetProjectRequirementByIdAsync(int id)
    {
        return await _projectRequirementRepository.GetByIdAsync(id);
    }

    public async Task<ProjectRequirement> CreateProjectRequirementAsync(ProjectRequirement projectRequirement)
    {
        projectRequirement.CreatedAt = DateTime.UtcNow;
        projectRequirement.UpdatedAt = DateTime.UtcNow;
        return await _projectRequirementRepository.AddAsync(projectRequirement);
    }

    public async Task<ProjectRequirement> UpdateProjectRequirementAsync(ProjectRequirement projectRequirement)
    {
        projectRequirement.UpdatedAt = DateTime.UtcNow;
        await _projectRequirementRepository.UpdateAsync(projectRequirement);
        return projectRequirement;
    }

    public async Task<bool> DeleteProjectRequirementAsync(int id)
    {
        var projectRequirement = await _projectRequirementRepository.GetByIdAsync(id);
        if (projectRequirement != null)
        {
            await _projectRequirementRepository.DeleteAsync(projectRequirement);
            return true;
        }
        return false;
    }

    public async Task<IEnumerable<ProjectRequirement>> GetProjectRequirementsByProjectAsync(int projectId)
    {
        return await _projectRequirementRepository.GetProjectRequirementsByProjectAsync(projectId);
    }

    public async Task<(IEnumerable<AssignedProjectDto> AssignedProjects, int TotalCount)> GetAssignedProjectsAsync(int? userId, int page, int limit, string? search = null, int? projectId = null)
    {
        // Get current user's PrsId for filtering assigned projects
        var currentUserPrsId = await _currentUserProvider.GetCurrentUserPrsIdAsync();
        if (string.IsNullOrWhiteSpace(currentUserPrsId))
        {
            return (Enumerable.Empty<AssignedProjectDto>(), 0);
        }

        // Delegate to repository for complex query logic
        return await _projectRepository.GetAssignedProjectsAsync(currentUserPrsId, page, limit, search, projectId);
    }
}