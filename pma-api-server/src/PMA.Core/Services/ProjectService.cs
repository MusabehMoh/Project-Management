using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class ProjectService : IProjectService
{
    private readonly IProjectRepository _projectRepository;

    public ProjectService(IProjectRepository projectRepository)
    {
        _projectRepository = projectRepository;
    }

    public async System.Threading.Tasks.Task<(IEnumerable<Project> Projects, int TotalCount)> GetProjectsAsync(int page, int limit, string? search = null, int? status = null, string? priority = null)
    {
        var projects = await _projectRepository.GetProjectsWithPaginationAsync(page, limit, search, status, priority);
        var totalCount = await _projectRepository.GetTotalProjectsCountAsync(search, status, priority);
        return (projects, totalCount);
    }

    public async System.Threading.Tasks.Task<Project?> GetProjectByIdAsync(int id)
    {
        return await _projectRepository.GetProjectWithDetailsAsync(id);
    }

    public async System.Threading.Tasks.Task<Project> CreateProjectAsync(Project project)
    {
        project.CreatedAt = DateTime.UtcNow;
        project.UpdatedAt = DateTime.UtcNow;
        return await _projectRepository.AddAsync(project);
    }

    public async System.Threading.Tasks.Task UpdateProjectAsync(Project project)
    {
        project.UpdatedAt = DateTime.UtcNow;
        await _projectRepository.UpdateAsync(project);
    }

    public async System.Threading.Tasks.Task DeleteProjectAsync(int id)
    {
        var project = await _projectRepository.GetByIdAsync(id);
        if (project != null)
        {
            await _projectRepository.DeleteAsync(project);
        }
    }

    public async System.Threading.Tasks.Task<IEnumerable<Project>> SearchProjectsAsync(string query, int? status = null, string? priority = null, int page = 1, int limit = 20)
    {
        return await _projectRepository.SearchProjectsAsync(query, status, priority, page, limit);
    }

    public async System.Threading.Tasks.Task<object> GetProjectStatsAsync()
    {
        var allProjects = await _projectRepository.GetAllAsync();
        var projects = allProjects.ToList();

        return new
        {
            Total = projects.Count,
            New = projects.Count(p => p.Status == ProjectStatus.New),
            Delayed = projects.Count(p => p.Status == ProjectStatus.Delayed),
            UnderReview = projects.Count(p => p.Status == ProjectStatus.UnderReview),
            UnderDevelopment = projects.Count(p => p.Status == ProjectStatus.UnderDevelopment),
            Production = projects.Count(p => p.Status == ProjectStatus.Production)
        };
    }
}



