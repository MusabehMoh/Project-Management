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
    private readonly ILookupService _lookupService;
    private readonly IProjectRequirementRepository _projectRequirementRepository;

    public ProjectService(
        IProjectRepository projectRepository, 
        INotificationService notificationService, 
        IUserService userService,
        IUserContextAccessor userContextAccessor,
        ILookupService lookupService,
        IProjectRequirementRepository projectRequirementRepository)
    {
        _projectRepository = projectRepository;
        _notificationService = notificationService;
        _userService = userService;
        _userContextAccessor = userContextAccessor;
        _lookupService = lookupService;
        _projectRequirementRepository = projectRequirementRepository;
    }

    public async System.Threading.Tasks.Task<(IEnumerable<Project> Projects, int TotalCount)> GetProjectsAsync(int page, int limit, string? search = null, int? status = null, string? priority = null)
    {
        // Single optimized query that returns both projects and total count
        return await _projectRepository.GetProjectsWithPaginationAndCountAsync(page, limit, search, status, priority);
    }

    public async System.Threading.Tasks.Task<Project?> GetProjectByIdAsync(int id)
    {
        return await _projectRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<Project> CreateProjectAsync(Project project)
    {
        // Use the new UserContext pattern to get current user info
        var userContext = await _userContextAccessor.GetUserContextAsync();
        if (!userContext.IsAuthenticated)
            throw new UnauthorizedAccessException("User must be authenticated to create a project");

        project.CreatedAt = DateTime.Now;
        project.UpdatedAt = DateTime.Now;
        // Set CreatedBy if your Project entity has such a field
        // project.CreatedBy = userContext.PrsId;
        
        return await _projectRepository.AddAsync(project);
    }

    public async System.Threading.Tasks.Task UpdateProjectAsync(Project project)
    {
        project.UpdatedAt = DateTime.Now;
        await _projectRepository.UpdateAsync(project);
    }

    public async System.Threading.Tasks.Task DeleteProjectAsync(int id)
    {
        var project = await _projectRepository.GetByIdAsync(id);
        if (project == null)
        {
            throw new KeyNotFoundException($"Project with ID {id} not found");
        }

        // Check for dependencies before deletion
        var dependencies = await _projectRepository.CheckProjectDependenciesAsync(id);
        if (dependencies.Any())
        {
            var errorMessage = $"Cannot delete project. Project is referenced in: {string.Join(", ", dependencies)}";
            throw new InvalidOperationException(errorMessage);
        }

        await _projectRepository.DeleteAsync(project);
    }

    public async System.Threading.Tasks.Task<IEnumerable<Project>> SearchProjectsAsync(string query, int? status = null, string? priority = null, int page = 1, int limit = 20)
    {
        return await _projectRepository.SearchProjectsAsync(query, status, priority, page, limit);
    }

    public async System.Threading.Tasks.Task<object> GetProjectStatsAsync()
    {
        var allProjects = await _projectRepository.GetAllAsync();
        var projects = allProjects.ToList();

        // Get project status lookups from database
        var statusLookups = await _lookupService.GetLookupsAsync("ProjectStatus");
        var statusLookupDict = statusLookups.ToDictionary(s => s.Value, s => new { s.Name, s.NameAr });

        return new
        {
            Total = projects.Count,
            New = projects.Count(p => p.Status == ProjectStatus.New),
            UnderTesting = projects.Count(p => p.Status == ProjectStatus.UnderTesting),
            Delayed = projects.Count(p => p.Status == ProjectStatus.Delayed),
            UnderStudy = projects.Count(p => p.Status == ProjectStatus.UnderStudy),
            UnderDevelopment = projects.Count(p => p.Status == ProjectStatus.UnderDevelopment),
            Production = projects.Count(p => p.Status == ProjectStatus.Production),
            StatusNames = new
            {
                New = new { En = statusLookupDict.GetValueOrDefault(1)?.Name ?? "New", Ar = statusLookupDict.GetValueOrDefault(1)?.NameAr ?? "جديد" },
                UnderStudy = new { En = statusLookupDict.GetValueOrDefault(2)?.Name ?? "Under Analysis", Ar = statusLookupDict.GetValueOrDefault(2)?.NameAr ?? "قيد التحليل" },
                UnderDevelopment = new { En = statusLookupDict.GetValueOrDefault(3)?.Name ?? "Under Development", Ar = statusLookupDict.GetValueOrDefault(3)?.NameAr ?? "قيد البرمجة" },
                UnderTesting = new { En = statusLookupDict.GetValueOrDefault(4)?.Name ?? "Under Testing", Ar = statusLookupDict.GetValueOrDefault(4)?.NameAr ?? "بيئة الفحص" },
                Production = new { En = statusLookupDict.GetValueOrDefault(5)?.Name ?? "Production Environment", Ar = statusLookupDict.GetValueOrDefault(5)?.NameAr ?? "بيئة الانتاج" },
                Delayed = new { En = statusLookupDict.GetValueOrDefault(6)?.Name ?? "Postponed", Ar = statusLookupDict.GetValueOrDefault(6)?.NameAr ?? "مؤجل" }
            }
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
        project.UpdatedAt = DateTime.Now;
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
                    CreatedAt = DateTime.Now
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

    /// <summary>
    /// Updates project status based on requirement statuses and states.
    /// Logic:
    /// - If project has no requirements: No status change
    /// - If first requirement is created: Project status changes to UnderStudy (2)
    /// - If all requirements are completed: Project status changes to Production (5)
    /// - If any requirement is NOT completed: Project status remains at current state or reverts to UnderDevelopment
    /// </summary>
    public async System.Threading.Tasks.Task<bool> UpdateProjectStatusByRequirementsAsync(int projectId)
    {
        try
        {
            var project = await _projectRepository.GetByIdAsync(projectId);
            if (project == null)
            {
                return false;
            }

            // Get all requirements for this project
            var requirements = await _projectRequirementRepository.GetProjectRequirementsByProjectAsync(projectId);
            var requirementsList = requirements.ToList();

            // If no requirements exist, no status change needed
            if (!requirementsList.Any())
            {
                return false;
            }

            var oldStatus = project.Status;

            // Check if all requirements are completed
            var allCompleted = requirementsList.All(r => r.Status == RequirementStatusEnum.Completed);

            // Check if any requirement is not in completed or cancelled state
            var anyIncomplete = requirementsList.Any(r => 
                r.Status != RequirementStatusEnum.Completed && 
                r.Status != RequirementStatusEnum.Cancelled);

            // Check if any requirement is not in understdy or new
            var anyUnderStudy = requirementsList.Any(r =>
                r.Status == RequirementStatusEnum.New ||
                r.Status == RequirementStatusEnum.ManagerReview ||
                r.Status == RequirementStatusEnum.Approved);
            if (allCompleted)
            {
                // All requirements are completed, set project to Production
                project.Status = ProjectStatus.Production;
                project.Progress = 100;
            }
            else if (anyUnderStudy)
            {
                // First requirement created, set project to UnderStudy
                project.Status = ProjectStatus.UnderStudy;
            }
            else if (anyIncomplete && project.Status == ProjectStatus.Production)
            {
                // If we're in Production but have incomplete requirements, move back to UnderDevelopment
                project.Status = ProjectStatus.UnderDevelopment;
            }

            // Update the project if status changed
            if (oldStatus != project.Status)
            {
                project.UpdatedAt = DateTime.Now;
                await _projectRepository.UpdateAsync(project);
                return true;
            }

            return false;
        }
        catch
        {
            return false;
        }
    }
}



