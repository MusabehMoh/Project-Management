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
    
    // Project mapping methods
    ProjectDto MapToProjectDto(Project project);
    Project MapToProject(CreateProjectDto createDto);
    System.Threading.Tasks.Task UpdateProjectFromDtoAsync(Project project, UpdateProjectDto updateDto);
    System.Threading.Tasks.Task PopulateProjectNavigationPropertiesAsync(Project project);
    void CreateProjectAnalysts(Project project, int[]? analystIds);
    
    // Project Requirement mapping methods
    ProjectRequirement MapToProjectRequirement(CreateProjectRequirementDto dto, ProjectRequirement? existing = null);
    
    // Timeline mapping methods
    TimelineDto MapToTimelineDto(Timeline timeline);
    Timeline MapToTimeline(CreateTimelineDto createDto);
    void UpdateTimelineFromDto(Timeline timeline, UpdateTimelineDto updateDto);
}