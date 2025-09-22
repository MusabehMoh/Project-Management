using PMA.Core.Entities;
using PMA.Core.DTOs;
using PMA.Core.Interfaces;

namespace PMA.Core.Services;

/// <summary>
/// Service to handle mapping between entities and DTOs
/// </summary>
public class MappingService : IMappingService
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitRepository _unitRepository;

    public MappingService(IEmployeeRepository employeeRepository, IUnitRepository unitRepository)
    {
        _employeeRepository = employeeRepository;
        _unitRepository = unitRepository;
    }
    /// <summary>
    /// Maps a Role entity to a RoleDto
    /// </summary>
    public RoleDto MapToRoleDto(Role role)
    {
        if (role == null)
            return null!;

        var roleDto = new RoleDto
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            IsActive = role.IsActive,
            RoleOrder = role.RoleOrder,
            CreatedAt = role.CreatedAt,
            UpdatedAt = role.UpdatedAt,
            Actions = role.RoleActions?.Select(ra => new ActionDto
            {
                Id = ra.Permission?.Id ?? 0,
                Name = ra.Permission?.Name ?? string.Empty,
                Description = ra.Permission?.Description,
                Category = ra.Permission?.Category ?? string.Empty,
                IsActive = ra.Permission?.IsActive ?? false
            }).ToList()
        };

        return roleDto;
    }

    /// <summary>
    /// Maps a RoleCreateDto to a Role entity
    /// </summary>
    public Role MapToRole(RoleCreateDto roleDto)
    {
        if (roleDto == null)
            return null!;

        return new Role
        {
            Name = roleDto.Name,
            Description = roleDto.Description,
            IsActive = roleDto.IsActive,
            RoleOrder = roleDto.RoleOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Updates a Role entity from a RoleUpdateDto
    /// </summary>
    public void UpdateRoleFromDto(Role role, RoleUpdateDto roleDto)
    {
        if (role == null || roleDto == null)
            return;

        role.Name = roleDto.Name;
        role.Description = roleDto.Description;
        role.IsActive = roleDto.IsActive;
        role.RoleOrder = roleDto.RoleOrder;
        role.UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Maps a Permission entity to an ActionDto
    /// </summary>
    public ActionDto MapToActionDto(Permission permission)
    {
        if (permission == null)
            return null!;

        return new ActionDto
        {
            Id = permission.Id,
            Name = permission.Name,
            Description = permission.Description,
            Category = permission.Category,
            IsActive = permission.IsActive
        };
    }

    /// <summary>
    /// Maps a Project entity to a ProjectDto
    /// </summary>
    public ProjectDto MapToProjectDto(Project project)
    {
        if (project == null)
            return null!;

        return new ProjectDto
        {
            Id = project.Id,
            ApplicationName = project.ApplicationName,
            ProjectOwner = project.ProjectOwner,
            AlternativeOwner = project.AlternativeOwner,
            OwningUnit = project.OwningUnit,
            ProjectOwnerId = project.ProjectOwnerId,
            AlternativeOwnerId = project.AlternativeOwnerId,
            OwningUnitId = project.OwningUnitId,
            Analysts = project.Analysts,
            AnalystIds = project.ProjectAnalysts?.Select(pa => pa.AnalystId).ToList() ?? new List<int>(),
            StartDate = project.StartDate,
            ExpectedCompletionDate = project.ExpectedCompletionDate,
            Description = project.Description,
            Remarks = project.Remarks,
            Status = project.Status,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            Priority = project.Priority,
            Budget = project.Budget,
            Progress = project.Progress
        };
    }

    /// <summary>
    /// Maps a CreateProjectDto to a Project entity
    /// </summary>
    public Project MapToProject(CreateProjectDto createDto)
    {
        if (createDto == null)
            return null!;

        return new Project
        {
            ApplicationName = createDto.ApplicationName,
            ProjectOwnerId = createDto.ProjectOwner,
            AlternativeOwnerId = createDto.AlternativeOwner,
            OwningUnitId = createDto.OwningUnit,
            Analysts = null, // Will be populated later from ProjectAnalyst entities
            StartDate = createDto.StartDate,
            ExpectedCompletionDate = createDto.ExpectedCompletionDate,
            Description = createDto.Description,
            Remarks = createDto.Remarks,
            Priority = createDto.Priority,
            Budget = createDto.Budget,
            Progress = createDto.Progress,
            Status = createDto.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            // Navigation properties will be populated by the service layer
            ProjectOwner = string.Empty, // Will be populated from database
            AlternativeOwner = string.Empty, // Will be populated from database
            OwningUnit = string.Empty, // Will be populated from database
            ProjectAnalysts = new List<ProjectAnalyst>() // Initialize empty collection
        };
    }

    /// <summary>
    /// Updates a Project entity from an UpdateProjectDto
    /// </summary>
    public async System.Threading.Tasks.Task UpdateProjectFromDtoAsync(Project project, UpdateProjectDto updateDto)
    {
        if (project == null || updateDto == null)
            return;

        // Update only non-null properties
        if (!string.IsNullOrEmpty(updateDto.ApplicationName))
            project.ApplicationName = updateDto.ApplicationName;

        if (updateDto.ProjectOwner.HasValue)
        {
            project.ProjectOwnerId = updateDto.ProjectOwner.Value;
            // Populate ProjectOwner name from database
            var owner = await _employeeRepository.GetByIdAsync(updateDto.ProjectOwner.Value);
            project.ProjectOwner = owner?.FullName ?? string.Empty;
        }

        if (updateDto.AlternativeOwner.HasValue)
        {
            project.AlternativeOwnerId = updateDto.AlternativeOwner.Value;
            // Populate AlternativeOwner name from database
            var altOwner = await _employeeRepository.GetByIdAsync(updateDto.AlternativeOwner.Value);
            project.AlternativeOwner = altOwner?.FullName ?? string.Empty;
        }

        if (updateDto.OwningUnit.HasValue)
        {
            project.OwningUnitId = updateDto.OwningUnit.Value;
            // Populate OwningUnit name from database
            var unit = await _unitRepository.GetByIdAsync(updateDto.OwningUnit.Value);
            project.OwningUnit = unit?.Name ?? string.Empty;
        }

        if (updateDto.Analysts != null)
        {
            // Clear existing ProjectAnalyst relationships
            project.ProjectAnalysts?.Clear();
            if (project.ProjectAnalysts == null)
                project.ProjectAnalysts = new List<ProjectAnalyst>();

            // Add new ProjectAnalyst relationships
            foreach (var analystId in updateDto.Analysts)
            {
                project.ProjectAnalysts.Add(new ProjectAnalyst
                {
                    ProjectId = project.Id,
                    AnalystId = analystId
                });
            }
            
            // Set Analysts to null, will be populated later from database lookups
            project.Analysts = null;
        }

        if (updateDto.StartDate.HasValue)
            project.StartDate = updateDto.StartDate.Value;

        if (updateDto.ExpectedCompletionDate.HasValue)
            project.ExpectedCompletionDate = updateDto.ExpectedCompletionDate.Value;

        if (updateDto.Description != null)
            project.Description = updateDto.Description;

        if (updateDto.Remarks != null)
            project.Remarks = updateDto.Remarks;

        if (updateDto.Priority.HasValue)
            project.Priority = updateDto.Priority.Value;

        if (updateDto.Budget.HasValue)
            project.Budget = updateDto.Budget.Value;

        if (updateDto.Progress.HasValue)
            project.Progress = updateDto.Progress.Value;

        if (updateDto.Status.HasValue)
            project.Status = updateDto.Status.Value;

        project.UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Populates navigation properties for a Project entity from database lookups
    /// </summary>
    public async System.Threading.Tasks.Task PopulateProjectNavigationPropertiesAsync(Project project)
    {
        if (project == null)
            return;

        // Populate ProjectOwner name
        var owner = await _employeeRepository.GetByIdAsync(project.ProjectOwnerId);
        project.ProjectOwner = owner?.FullName ?? string.Empty;

        // Populate AlternativeOwner name
        if (project.AlternativeOwnerId.HasValue)
        {
            var altOwner = await _employeeRepository.GetByIdAsync(project.AlternativeOwnerId.Value);
            project.AlternativeOwner = altOwner?.FullName;
        }

        // Populate OwningUnit name
        var unit = await _unitRepository.GetByIdAsync(project.OwningUnitId);
        project.OwningUnit = unit?.Name ?? string.Empty;

        // Populate Analysts names from ProjectAnalyst entities
        if (project.ProjectAnalysts != null && project.ProjectAnalysts.Any())
        {
            var analystNames = new List<string>();
            
            foreach (var projectAnalyst in project.ProjectAnalysts)
            {
                var analyst = await _employeeRepository.GetByIdAsync(projectAnalyst.AnalystId);
                if (analyst != null)
                {
                    analystNames.Add(analyst.FullName);
                }
            }
            
            project.Analysts = analystNames.Any() ? string.Join(", ", analystNames) : null;
        }
    }

    /// <summary>
    /// Creates ProjectAnalyst entities for a project from analyst IDs
    /// </summary>
    public void CreateProjectAnalysts(Project project, int[]? analystIds)
    {
        if (project == null || analystIds == null || analystIds.Length == 0)
            return;

        project.ProjectAnalysts ??= new List<ProjectAnalyst>();
        project.ProjectAnalysts.Clear();

        foreach (var analystId in analystIds)
        {
            project.ProjectAnalysts.Add(new ProjectAnalyst
            {
                ProjectId = project.Id,
                AnalystId = analystId,
                Project = project
            });
        }
    }
}