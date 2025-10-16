using PMA.Core.Entities;
using PMA.Core.DTOs;

namespace PMA.Core.Services;

/// <summary>
/// Interface for mapping between entities and DTOs
/// </summary>
public interface IMappingService
{
    RoleDto MapToRoleDto(Role role);
    Role MapToRole(RoleCreateDto roleDto);
    void UpdateRoleFromDto(Role role, RoleUpdateDto roleDto);
    ActionDto MapToActionDto(Permission permission);
    
    // Add new method for mapping ProjectRequirement to ProjectRequirementDto
    ProjectRequirementDto MapToProjectRequirementDto(ProjectRequirement projectRequirement);
    ProjectRequirementAttachmentDto MapToProjectRequirementAttachmentDto(ProjectRequirementAttachment attachment);
    ProjectBasicInfoDto MapToProjectBasicInfoDto(Project project);
    RequirementTaskDto MapToRequirementTaskDto(RequirementTask requirementTask);
    TimelineBasicInfoDto MapToTimelineBasicInfoDto(Timeline timeline);
    
    // Project mapping methods
    ProjectDto MapToProjectDto(Project project);
    System.Threading.Tasks.Task<Project> MapToProjectAsync(CreateProjectDto createDto);
    System.Threading.Tasks.Task UpdateProjectFromDtoAsync(Project project, UpdateProjectDto updateDto);
    System.Threading.Tasks.Task PopulateProjectNavigationPropertiesAsync(Project project);
    void CreateProjectAnalysts(Project project, int[]? analystIds);
    
    // Project Requirement mapping methods
    ProjectRequirement MapToProjectRequirement(CreateProjectRequirementDto dto, ProjectRequirement? existing = null);
    
    // Timeline mapping methods
    TimelineDto MapToTimelineDto(Timeline timeline);
    Timeline MapToTimeline(CreateTimelineDto createDto);
    void UpdateTimelineFromDto(Timeline timeline, UpdateTimelineDto updateDto);
    
    // Project with timelines mapping methods
    TimelineWithSprintsDto MapToTimelineWithSprintsDto(Timeline timeline);
    SprintDto MapToSprintDto(Sprint sprint);
    TaskDto MapToTaskDto(PMA.Core.Entities.Task task);
    ProjectWithTimelinesDto MapToProjectWithTimelinesDto(Project project);

    // Sprint creation and update mapping methods
    Sprint MapToSprint(CreateSprintDto createSprintDto);
    void UpdateSprintFromDto(Sprint sprint, UpdateSprintDto updateSprintDto);

    // Task creation and update mapping methods
    PMA.Core.Entities.Task MapToTask(CreateTaskDto createTaskDto);
    PMA.Core.Entities.Task MapToAdHocTask(CreateAdHocTaskDto createAdHocTaskDto);
    void UpdateTaskFromDto(PMA.Core.Entities.Task task, UpdateTaskDto updateTaskDto);

    // Design Request mapping methods
    DesignRequestDto MapToDesignRequestDto(DesignRequest designRequest);
    DesignRequest MapToDesignRequest(CreateDesignRequestDto createDesignRequestDto);
}