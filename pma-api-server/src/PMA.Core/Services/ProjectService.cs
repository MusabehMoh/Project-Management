using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.Enums;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace PMA.Core.Services;

public class ProjectService : IProjectService
{
    private readonly IProjectRepository _projectRepository;
    private readonly INotificationService _notificationService;
    private readonly IUserService _userService;
    private readonly IUserContextAccessor _userContextAccessor;

    public ProjectService(
        IProjectRepository projectRepository, 
        INotificationService notificationService, 
        IUserService userService,
        IUserContextAccessor userContextAccessor)
    {
        _projectRepository = projectRepository;
        _notificationService = notificationService;
        _userService = userService;
        _userContextAccessor = userContextAccessor;
    }

    public async System.Threading.Tasks.Task<(IEnumerable<Project> Projects, int TotalCount)> GetProjectsAsync(int page, int limit, string? search = null, int? status = null, string? priority = null)
    {
        // Single optimized query that returns both projects and total count
        return await _projectRepository.GetProjectsWithPaginationAndCountAsync(page, limit, search, status, priority);
    }

    public async System.Threading.Tasks.Task<Project?> GetProjectByIdAsync(int id)
    {
        return await _projectRepository.GetProjectWithDetailsAsync(id);
    }

    public async System.Threading.Tasks.Task<Project> CreateProjectAsync(Project project)
    {
        // Use the new UserContext pattern to get current user info
        var userContext = await _userContextAccessor.GetUserContextAsync();
        if (!userContext.IsAuthenticated)
            throw new UnauthorizedAccessException("User must be authenticated to create a project");

        project.CreatedAt = DateTime.UtcNow;
        project.UpdatedAt = DateTime.UtcNow;
        // Set CreatedBy if your Project entity has such a field
        // project.CreatedBy = userContext.PrsId;
        
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
            UnderTesting = projects.Count(p => p.Status == ProjectStatus.UnderTesting),
            Delayed = projects.Count(p => p.Status == ProjectStatus.Delayed),
            UnderStudy = projects.Count(p => p.Status == ProjectStatus.UnderStudy),
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
        project.Status = ProjectStatus.UnderStudy;
        project.UpdatedAt = DateTime.UtcNow;
        await _projectRepository.UpdateAsync(project);

        // Parse analyst IDs from ProjectAnalyst entities
        var analystIds = new List<int>();
        if (project.ProjectAnalysts != null && project.ProjectAnalysts.Any())
        {
            analystIds = project.ProjectAnalysts.Select(pa => pa.AnalystId).ToList();
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

    public async System.Threading.Tasks.Task<IEnumerable<Project>> GetProjectsWithTimelinesAsync()
    {
        return await _projectRepository.GetProjectsWithTimelinesAsync();
    }

    public async System.Threading.Tasks.Task<Project?> GetProjectWithTimelinesAsync(int projectId)
    {
        return await _projectRepository.GetProjectWithTimelinesAsync(projectId);
    }
}



