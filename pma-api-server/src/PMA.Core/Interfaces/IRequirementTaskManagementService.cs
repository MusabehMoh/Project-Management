using PMA.Core.DTOs;
using PMA.Core.Entities;

namespace PMA.Core.Interfaces;

/// <summary>
/// Service for managing requirement tasks and their associated role-specific tasks
/// </summary>
public interface IRequirementTaskManagementService
{
    /// <summary>
    /// Creates or updates a requirement task and all associated role-specific tasks
    /// </summary>
    /// <param name="requirementId">The requirement ID</param>
    /// <param name="taskDto">The task creation/update data</param>
    /// <returns>Result containing the requirement task and created/updated tasks</returns>
    Task<RequirementTaskResult> CreateOrUpdateRequirementTaskAsync(int requirementId, CreateRequirementTaskDto taskDto);
}

/// <summary>
/// Result of requirement task creation/update operation
/// </summary>
public class RequirementTaskResult
{
    public RequirementTask RequirementTask { get; set; } = null!;
    public List<PMA.Core.Entities.Task> CreatedTasks { get; set; } = new();
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}