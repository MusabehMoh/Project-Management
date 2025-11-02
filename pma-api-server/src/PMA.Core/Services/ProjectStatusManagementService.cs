using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.Enums;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace PMA.Core.Services;

/// <summary>
/// Service to manage project status updates based on requirement statuses.
/// Handles automatic status transitions when requirements are created/deleted/completed.
/// </summary>
public class ProjectStatusManagementService
{
    private readonly IProjectRepository _projectRepository;
    private readonly IProjectRequirementRepository _projectRequirementRepository;

    public ProjectStatusManagementService(
        IProjectRepository projectRepository,
        IProjectRequirementRepository projectRequirementRepository)
    {
        _projectRepository = projectRepository;
        _projectRequirementRepository = projectRequirementRepository;
    }

    /// <summary>
    /// Updates project status based on requirement statuses and states.
    /// Logic:
    /// - If project has no requirements: No status change
    /// - If first requirement is created: Project status changes to UnderStudy (2)
    /// - If all requirements are completed: Project status changes to Production (5)
    /// - If any requirement is NOT completed: Project status remains at current state
    /// </summary>
    public async Task<bool> UpdateProjectStatusByRequirementsAsync(int projectId)
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

            if (allCompleted)
            {
                // All requirements are completed, set project to Production
                project.Status = ProjectStatus.Production;
                project.Progress = 100;
            }
            else if (anyIncomplete && project.Status == ProjectStatus.New)
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

    /// <summary>
    /// Updates project status based on a single requirement status change.
    /// This is useful when a requirement status is explicitly updated.
    /// </summary>
    public async Task<bool> UpdateProjectStatusOnRequirementStatusChangeAsync(int projectId, RequirementStatusEnum newStatus)
    {
        return await UpdateProjectStatusByRequirementsAsync(projectId);
    }

    /// <summary>
    /// Checks if a project should be assigned to analyst based on requirements.
    /// Returns true if project has requirements and analyst should be assigned.
    /// </summary>
    public async Task<bool> ShouldProjectBeAssignedToAnalystAsync(int projectId)
    {
        var requirements = await _projectRequirementRepository.GetProjectRequirementsByProjectAsync(projectId);
        return requirements.Any();
    }

    /// <summary>
    /// Gets the count of completed vs total requirements for a project.
    /// Useful for progress calculation.
    /// </summary>
    public async Task<(int Completed, int Total)> GetRequirementCompletionAsync(int projectId)
    {
        var requirements = await _projectRequirementRepository.GetProjectRequirementsByProjectAsync(projectId);
        var requirementsList = requirements.ToList();
        var completedCount = requirementsList.Count(r => 
            r.Status == RequirementStatusEnum.Completed || 
            r.Status == RequirementStatusEnum.Cancelled);
        
        return (completedCount, requirementsList.Count);
    }
}
