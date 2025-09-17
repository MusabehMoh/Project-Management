using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace PMA.Core.Services;

public class ProjectService : IProjectService
{
    private readonly IProjectRepository _projectRepository;
    private readonly INotificationService _notificationService;
    private readonly IUserService _userService;

    public ProjectService(IProjectRepository projectRepository, INotificationService notificationService, IUserService userService)
    {
        _projectRepository = projectRepository;
        _notificationService = notificationService;
        _userService = userService;
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

    public async System.Threading.Tasks.Task<Project> SendProjectAsync(int projectId)
    {
        var project = await _projectRepository.GetByIdAsync(projectId);
        if (project == null)
        {
            throw new KeyNotFoundException("Project not found");
        }

        // Update project status to Under Review
        project.Status = ProjectStatus.UnderReview;
        project.UpdatedAt = DateTime.UtcNow;
        await _projectRepository.UpdateAsync(project);

        // Parse analyst IDs from the string (assuming comma-separated)
        var analystIds = new List<int>();
        if (!string.IsNullOrEmpty(project.AnalystIds))
        {
            analystIds = project.AnalystIds.Split(',')
                .Select(id => int.TryParse(id.Trim(), out var parsedId) ? parsedId : 0)
                .Where(id => id > 0)
                .ToList();
        }

        // Get analyst usernames
        var analystUsernames = new List<string>();
        foreach (var analystId in analystIds)
        {
            var analyst = await _userService.GetUserByIdAsync(analystId);
            if (analyst != null)
            {
                analystUsernames.Add(analyst.UserName);
            }
        }

        // Get project owner username
        var targetUsernames = new List<string>(analystUsernames);
        var projectOwner = await _userService.GetUserByIdAsync(project.ProjectOwnerId);
        if (projectOwner != null)
        {
            targetUsernames.Add(projectOwner.UserName);
        }

        // Create notification for each target user
        foreach (var username in targetUsernames.Distinct())
        {
            var user = await _userService.GetUserByUserNameAsync(username);
            if (user != null)
            {
                var notification = new Notification
                {
                    Title = "Project Sent for Review",
                    Message = $"Project \"{project.ApplicationName}\" has been sent for review",
                    Type = NotificationType.Info,
                    Priority = NotificationPriority.Medium,
                    UserId = user.Id,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationService.CreateNotificationAsync(notification);
            }
        }

        return project;
    }
}



