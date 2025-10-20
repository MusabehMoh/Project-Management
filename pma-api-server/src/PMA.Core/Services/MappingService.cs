using PMA.Core.Entities;
using PMA.Core.DTOs;
using PMA.Core.Interfaces;
using PMA.Core.Enums;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;

namespace PMA.Core.Services;

/// <summary>
/// Service to handle mapping between entities and DTOs
/// </summary>
public class MappingService : IMappingService
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitRepository _unitRepository;

    private readonly IUserContextAccessor _userContextAccessor;

    public MappingService(IEmployeeRepository employeeRepository, IUnitRepository unitRepository, IUserContextAccessor userContextAccessor)
    {
        _employeeRepository = employeeRepository;
        _unitRepository = unitRepository;
        _userContextAccessor = userContextAccessor;
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
            ProjectOwnerEmployee = project.ProjectOwnerEmployee != null ? MapToEmployeeDto(project.ProjectOwnerEmployee) : null,
            AlternativeOwnerEmployee = project.AlternativeOwnerEmployee != null ? MapToEmployeeDto(project.AlternativeOwnerEmployee) : null,
            OwningUnit = project.OwningUnit,
            ProjectOwnerId = project.ProjectOwnerId,
            AlternativeOwnerId = project.AlternativeOwnerId,
            OwningUnitId = project.OwningUnitId, 
            AnalystIds = project.ProjectAnalysts?.Select(pa => pa.AnalystId).ToList() ?? new List<int>(),
            StartDate = project.StartDate,
            ExpectedCompletionDate = project.ExpectedCompletionDate,
            Description = project.Description,
            Remarks = project.Remarks,
            Status = project.Status,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            Priority = project.Priority, 
            Progress = project.Progress
        };
    }

    /// <summary>
    /// Maps a CreateProjectDto to a Project entity
    /// </summary>
    public async Task<Project> MapToProjectAsync(CreateProjectDto createDto)
    {

      
        if (createDto == null)
            return null!;

        // Get current user context to set CreatedBy
        var userContext = await _userContextAccessor.GetUserContextAsync();
        var createdBy = userContext?.UserName ?? createDto.CreatedBy ?? string.Empty;

        return new Project
        {
            ApplicationName = createDto.ApplicationName,
            ProjectOwnerId = createDto.ProjectOwner,
            AlternativeOwnerId = createDto.AlternativeOwner,
            OwningUnitId = createDto.OwningUnit, 
            StartDate = createDto.StartDate,
            ExpectedCompletionDate = createDto.ExpectedCompletionDate,
            Description = createDto.Description,
            Remarks = createDto.Remarks,
            Priority = createDto.Priority, 
            Progress = createDto.Progress,
            Status = createDto.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            // Navigation properties will be populated by the service layer
            ProjectOwner = string.Empty, // Will be populated from database
            AlternativeOwner = string.Empty, // Will be populated from database
            OwningUnit = string.Empty, // Will be populated from database
            CreatedBy = createdBy,

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

        // Get current user context to set UpdatedBy
        var userContext = await _userContextAccessor.GetUserContextAsync();
        var updatedBy = userContext?.UserName ?? string.Empty;

        // Update only non-null properties
        if (!string.IsNullOrEmpty(updateDto.ApplicationName))
            project.ApplicationName = updateDto.ApplicationName;

        if (updateDto.ProjectOwner.HasValue)
        {
            project.ProjectOwnerId = updateDto.ProjectOwner.Value;
            // Populate ProjectOwner name and navigation property from database
            var owner = await _employeeRepository.GetByIdAsync(updateDto.ProjectOwner.Value);
            project.ProjectOwner = owner?.FullName ?? string.Empty;
            project.ProjectOwnerEmployee = owner;
        }

        if (updateDto.AlternativeOwner.HasValue)
        {
            project.AlternativeOwnerId = updateDto.AlternativeOwner.Value;
            // Populate AlternativeOwner name and navigation property from database
            var altOwner = await _employeeRepository.GetByIdAsync(updateDto.AlternativeOwner.Value);
            project.AlternativeOwner = altOwner?.FullName ?? string.Empty;
            project.AlternativeOwnerEmployee = altOwner;
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

 
        if (updateDto.Progress.HasValue)
            project.Progress = updateDto.Progress.Value;

        if (updateDto.Status.HasValue)
            project.Status = updateDto.Status.Value;

        project.UpdatedAt = DateTime.UtcNow;
        project.UpdatedBy = updatedBy;
    }

    /// <summary>
    /// Populates navigation properties for a Project entity from database lookups
    /// </summary>
    public async System.Threading.Tasks.Task PopulateProjectNavigationPropertiesAsync(Project project)
    {
        if (project == null)
            return;

        // Populate ProjectOwner name and navigation property
        var owner = await _employeeRepository.GetByIdAsync(project.ProjectOwnerId);
        project.ProjectOwner = owner?.FullName ?? string.Empty;
        project.ProjectOwnerEmployee = owner;

        // Populate AlternativeOwner name and navigation property
        if (project.AlternativeOwnerId.HasValue)
        {
            var altOwner = await _employeeRepository.GetByIdAsync(project.AlternativeOwnerId.Value);
            project.AlternativeOwner = altOwner?.FullName;
            project.AlternativeOwnerEmployee = altOwner;
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

    /// <summary>
    /// Maps a create/update DTO to an existing or new ProjectRequirement entity.
    /// </summary>
    public ProjectRequirement MapToProjectRequirement(CreateProjectRequirementDto dto, ProjectRequirement? existing = null)
    {
        var entity = existing ?? new ProjectRequirement
        {
            CreatedAt = DateTime.UtcNow
        };

        entity.ProjectId = dto.ProjectId;
        entity.Name = dto.Name;
        entity.Description = dto.Description ?? string.Empty;
        entity.Priority = (RequirementPriority)dto.Priority;
        entity.Type = (RequirementType)dto.Type;
        entity.ExpectedCompletionDate = dto.ExpectedCompletionDate;
        if (dto.Status.HasValue)
        {
            entity.Status = (RequirementStatusEnum)dto.Status.Value;
        }
        else if (existing == null)
        {
            entity.Status = RequirementStatusEnum.New;
        }
        
        entity.UpdatedAt = DateTime.UtcNow;
        return entity;
    }
    
    /// <summary>
    /// Maps a ProjectRequirement entity to a ProjectRequirementDto
    /// </summary>
    public ProjectRequirementDto MapToProjectRequirementDto(ProjectRequirement projectRequirement)
    {
        if (projectRequirement == null)
            return null!;
            
        return new ProjectRequirementDto
        {
            Id = projectRequirement.Id,
            ProjectId = projectRequirement.ProjectId,
            Name = projectRequirement.Name,
            Description = projectRequirement.Description,
            Priority = projectRequirement.Priority,
            Type = projectRequirement.Type,
            ExpectedCompletionDate = projectRequirement.ExpectedCompletionDate,
            Status = projectRequirement.Status,
            CreatedBy = projectRequirement.CreatedBy,
            AssignedAnalyst = projectRequirement.AssignedAnalyst,
            CreatedAt = projectRequirement.CreatedAt,
            UpdatedAt = projectRequirement.UpdatedAt,
            Attachments = projectRequirement.Attachments?.Select(MapToProjectRequirementAttachmentDto).ToList() ?? new List<ProjectRequirementAttachmentDto>(),
            Project = projectRequirement.Project != null ? MapToProjectBasicInfoDto(projectRequirement.Project) : null,
            RequirementTask = projectRequirement.RequirementTask != null ? MapToRequirementTaskDto(projectRequirement.RequirementTask) : null,
            Timeline = projectRequirement.Timeline != null ? MapToTimelineBasicInfoDto(projectRequirement.Timeline) : null
        };
    }

    /// <summary>
    /// Maps a ProjectRequirementAttachment entity to a ProjectRequirementAttachmentDto
    /// </summary>
    public ProjectRequirementAttachmentDto MapToProjectRequirementAttachmentDto(ProjectRequirementAttachment attachment)
    {
        if (attachment == null)
            return null!;
            
        return new ProjectRequirementAttachmentDto
        {
            Id = attachment.Id,
            ProjectRequirementId = attachment.ProjectRequirementId,
            FileName = attachment.FileName,
            OriginalName = attachment.OriginalName,
            FilePath = attachment.FilePath,
            FileSize = attachment.FileSize,
            ContentType = attachment.ContentType,
            UploadedAt = attachment.UploadedAt
        };
    }

    /// <summary>
    /// Maps a Project entity to a ProjectBasicInfoDto
    /// </summary>
    public ProjectBasicInfoDto MapToProjectBasicInfoDto(Project project)
    {
        if (project == null)
            return null!;
            
        return new ProjectBasicInfoDto
        {
            Id = project.Id,
            ApplicationName = project.ApplicationName,
            ProjectOwner = project.ProjectOwner,
            OwningUnit = project.OwningUnit, 
            AnalystIds = project.ProjectAnalysts?.Select(pa => pa.AnalystId).ToList() ?? new List<int>()
        };
    }

    /// <summary>
    /// Maps a RequirementTask entity to a RequirementTaskDto
    /// </summary>
    public RequirementTaskDto MapToRequirementTaskDto(RequirementTask requirementTask)
    {
        if (requirementTask == null)
            return null!;
            
        return new RequirementTaskDto
        {
            Id = requirementTask.Id,
            RequirementId = requirementTask.ProjectRequirementId,
            DeveloperId = requirementTask.DeveloperId,
            DeveloperName = requirementTask.Developer?.FullName,
            QcId = requirementTask.QcId,
            QcName = requirementTask.Qc?.FullName,
            DesignerId = requirementTask.DesignerId,
            DesignerName = requirementTask.Designer?.FullName,
            ControllerId = null, // Not in entity
            ControllerName = null, // Not in entity
            Description = requirementTask.Description,
            DeveloperStartDate = requirementTask.DeveloperStartDate,
            DeveloperEndDate = requirementTask.DeveloperEndDate,
            QcStartDate = requirementTask.QcStartDate,
            QcEndDate = requirementTask.QcEndDate,
            DesignerStartDate = requirementTask.DesignerStartDate,
            DesignerEndDate = requirementTask.DesignerEndDate,
            Status = requirementTask.Status,
            CreatedAt = requirementTask.CreatedAt,
            UpdatedAt = requirementTask.UpdatedAt,
            CreatedBy = requirementTask.CreatedBy
        };
    }

    /// <summary>
    /// Maps a Timeline entity to a TimelineBasicInfoDto
    /// </summary>
    public TimelineBasicInfoDto MapToTimelineBasicInfoDto(Timeline timeline)
    {
        if (timeline == null)
            return null!;
            
        return new TimelineBasicInfoDto
        {
            Id = timeline.Id,
            Name = timeline.Name
        };
    }

    /// <summary>
    /// Maps a Timeline entity to a TimelineDto
    /// </summary>
    public TimelineDto MapToTimelineDto(Timeline timeline)
    {
        if (timeline == null)
            return null!;

        return new TimelineDto
        {
            Id = timeline.Id,
            ProjectId = timeline.ProjectId,
            ProjectRequirementId = timeline.ProjectRequirementId,
            Name = timeline.Name,
            Description = timeline.Description,
            StartDate = timeline.StartDate,
            EndDate = timeline.EndDate,
            CreatedAt = timeline.CreatedAt,
            UpdatedAt = timeline.UpdatedAt
        };
    }

    /// <summary>
    /// Maps a CreateTimelineDto to a Timeline entity
    /// </summary>
    public Timeline MapToTimeline(CreateTimelineDto createDto)
    {
        return new Timeline
        {

            ProjectId = createDto.ProjectId,
            ProjectRequirementId = createDto.ProjectRequirementId,
            Name = createDto.Name,
            Description = createDto.Description,
            StartDate = createDto.StartDate,
            EndDate = createDto.EndDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Updates a Timeline entity from an UpdateTimelineDto
    /// </summary>
    public void UpdateTimelineFromDto(Timeline timeline, UpdateTimelineDto updateDto)
    {
        if (updateDto.ProjectId.HasValue)
            timeline.ProjectId = updateDto.ProjectId.Value;
        if (updateDto.ProjectRequirementId.HasValue)
            timeline.ProjectRequirementId = updateDto.ProjectRequirementId;
        if (updateDto.Name != null)
            timeline.Name = updateDto.Name;
        if (updateDto.Description != null)
            timeline.Description = updateDto.Description;
        if (updateDto.StartDate.HasValue)
            timeline.StartDate = updateDto.StartDate.Value;
        if (updateDto.EndDate.HasValue)
            timeline.EndDate = updateDto.EndDate.Value;
        timeline.UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Maps a Timeline entity to TimelineWithSprintsDto with generated treeId
    /// </summary>
    public TimelineWithSprintsDto MapToTimelineWithSprintsDto(Timeline timeline)
    {
        return new TimelineWithSprintsDto
        {
            Id = timeline.Id,
            TreeId = $"timeline-{timeline.Id}",
            ProjectId = timeline.ProjectId,
            ProjectRequirementId = timeline.ProjectRequirementId,
            Name = timeline.Name,
            Description = timeline.Description,
            StartDate = timeline.StartDate,
            EndDate = timeline.EndDate,
            CreatedAt = timeline.CreatedAt,
            UpdatedAt = timeline.UpdatedAt,
            Sprints = timeline.Sprints?.Select(MapToSprintDto).ToList() ?? new List<SprintDto>()
        };
    }

    /// <summary>
    /// Maps a Sprint entity to SprintDto with generated treeId
    /// </summary>
    public SprintDto MapToSprintDto(Sprint sprint)
    {
        return new SprintDto
        {
            Id = sprint.Id,
            TreeId = $"sprint-{sprint.Id}",
            Name = sprint.Name,
            Description = sprint.Description,
            StartDate = sprint.StartDate,
            EndDate = sprint.EndDate,
            Status = sprint.Status,
            ProjectId = sprint.ProjectId,
            TimelineId = sprint.TimelineId,
            CreatedAt = sprint.CreatedAt,
            UpdatedAt = sprint.UpdatedAt,
            Tasks = sprint.Tasks?.Select(MapToTaskDto).ToList() ?? new List<TaskDto>()
        };
    }

    /// <summary>
    /// Maps a Task entity to TaskDto with generated treeId
    /// </summary>
    public TaskDto MapToTaskDto(PMA.Core.Entities.Task task)
    {
        return new TaskDto
        {
            Id = task.Id,
            TreeId = $"task-{task.Id}",
            SprintId = task.SprintId??null,
            Name = task.Name,
            Description = task.Description,
            StartDate = task.StartDate,
            EndDate = task.EndDate,
            StatusId = task.StatusId,
            PriorityId = task.PriorityId,
            DepartmentId = task.DepartmentId,
            TimelineId=task.TimelineId,
            EstimatedHours = task.EstimatedHours,
            ProjectRequirementId=task.ProjectRequirementId, 
            ActualHours = task.ActualHours,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            MemberIds = task.Assignments?.Select(a => a.PrsId).ToList() ?? new List<int>(),
            DepTaskIds = task.Dependencies_Relations?.Select(d => d.DependsOnTaskId).ToList() ?? new List<int>()
        };
    }

    /// <summary>
    /// Maps a User entity to UserDto
    /// </summary>
    public UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            PrsId = user.PrsId,
            IsActive = user.IsActive,
            FullName = user.FullName,
            MilitaryNumber = user.MilitaryNumber,
            GradeName = user.GradeName,
            DepartmentId = user.DepartmentId,
            Email = user.Email,
            Phone = user.Phone,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    /// <summary>
    /// Maps an Employee entity to EmployeeDto
    /// </summary>
    public EmployeeDto MapToEmployeeDto(Employee employee)
    {
        if (employee == null)
            return null!;

        return new EmployeeDto
        {
            Id = employee.Id,
            UserName = employee.UserName,
            MilitaryNumber = employee.MilitaryNumber,
            GradeName = employee.GradeName,
            FullName = employee.FullName,
            StatusId = employee.StatusId
        };
    }

    /// <summary>
    /// Maps a Project entity to ProjectWithTimelinesDto with generated treeIds
    /// </summary>
    public ProjectWithTimelinesDto MapToProjectWithTimelinesDto(Project project)
    {
        return new ProjectWithTimelinesDto
        {
            ProjectId = project.Id,
            ProjectName = project.ApplicationName,
            TimelineCount = project.Timelines?.Count ?? 0,
            Timelines = project.Timelines?.Select(MapToTimelineWithSprintsDto).ToList() ?? new List<TimelineWithSprintsDto>()
        };
    }

    /// <summary>
    /// Maps a CreateSprintDto to Sprint entity
    /// </summary>
    public Sprint MapToSprint(CreateSprintDto createSprintDto)
    {
        return new Sprint
        {
            Name = createSprintDto.Name,
            Description = createSprintDto.Description,
            StartDate = createSprintDto.StartDate,
            EndDate = createSprintDto.EndDate,
            Status = createSprintDto.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Updates a Sprint entity from UpdateSprintDto
    /// </summary>
    public void UpdateSprintFromDto(Sprint sprint, UpdateSprintDto updateSprintDto)
    {
        if (!string.IsNullOrEmpty(updateSprintDto.Name))
            sprint.Name = updateSprintDto.Name;

        if (updateSprintDto.Description != null)
            sprint.Description = updateSprintDto.Description;

        if (updateSprintDto.StartDate.HasValue)
            sprint.StartDate = updateSprintDto.StartDate.Value;

        if (updateSprintDto.EndDate.HasValue)
            sprint.EndDate = updateSprintDto.EndDate.Value;

        if (updateSprintDto.Status.HasValue)
            sprint.Status = updateSprintDto.Status.Value;

        sprint.UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Maps a CreateTaskDto to Task entity
    /// </summary>
    public PMA.Core.Entities.Task MapToTask(CreateTaskDto createTaskDto)
    {
        return new PMA.Core.Entities.Task
        {
            SprintId = createTaskDto.SprintId,
            Name = createTaskDto.Name,
            Description = createTaskDto.Description,
            StartDate = createTaskDto.StartDate,
            EndDate = createTaskDto.EndDate,
            StatusId = createTaskDto.StatusId,
            PriorityId = createTaskDto.PriorityId,
            DepartmentId = createTaskDto.DepartmentId,
            ProjectRequirementId = createTaskDto.ProjectRequirementId,
            TimelineId = createTaskDto.TimelineId,
            EstimatedHours = createTaskDto.EstimatedHours,
            Progress = createTaskDto.Progress,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            TypeId = createTaskDto.TypeId

        };
    }

    /// <summary>
    /// Maps a CreateAdHocTaskDto to Task entity
    /// </summary>
    public PMA.Core.Entities.Task MapToAdHocTask(CreateAdHocTaskDto createAdHocTaskDto)
    {
        return new PMA.Core.Entities.Task
        {
            SprintId = 1, // Default sprint for adhoc tasks
            Name = createAdHocTaskDto.Name,
            Description = createAdHocTaskDto.Description,
            StartDate = createAdHocTaskDto.StartDate,
            EndDate = createAdHocTaskDto.EndDate,
            StatusId = TaskStatusEnum.ToDo,
            PriorityId = Priority.Medium,
            TypeId = TaskTypes.AdHoc, // Set TypeId to AdHoc
            Progress = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Updates a Task entity from UpdateTaskDto
    /// </summary>
    public void UpdateTaskFromDto(PMA.Core.Entities.Task task, UpdateTaskDto updateTaskDto)
    {
        if (!string.IsNullOrEmpty(updateTaskDto.Name))
            task.Name = updateTaskDto.Name;

        if (updateTaskDto.Description != null)
            task.Description = updateTaskDto.Description;

        if (updateTaskDto.StartDate.HasValue)
            task.StartDate = updateTaskDto.StartDate.Value;

        if (updateTaskDto.EndDate.HasValue)
            task.EndDate = updateTaskDto.EndDate.Value;

        if (updateTaskDto.StatusId.HasValue)
            task.StatusId = updateTaskDto.StatusId.Value;

        if (updateTaskDto.PriorityId.HasValue)
            task.PriorityId = updateTaskDto.PriorityId.Value;

        if (updateTaskDto.DepartmentId.HasValue)
            task.DepartmentId = updateTaskDto.DepartmentId;

        if (updateTaskDto.EstimatedHours.HasValue)
            task.EstimatedHours = updateTaskDto.EstimatedHours;

        if (updateTaskDto.ActualHours.HasValue)
            task.ActualHours = updateTaskDto.ActualHours;

        if (updateTaskDto.Progress.HasValue)
            task.Progress = updateTaskDto.Progress.Value;

        task.UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Maps a DesignRequest entity to DesignRequestDto
    /// </summary>
    public DesignRequestDto MapToDesignRequestDto(DesignRequest designRequest)
    {
        return new DesignRequestDto
        {
            Id = designRequest.Id,
            TaskId = designRequest.TaskId,
            Notes = designRequest.Notes,
            AssignedToPrsId = designRequest.AssignedToPrsId,
            Status = designRequest.Status,
            DueDate = designRequest.DueDate,
            CreatedAt = designRequest.CreatedAt,
            UpdatedAt = designRequest.UpdatedAt,
            AssignedToUserName = designRequest.AssignedToUser?.FullName,
            Task = designRequest.Task != null ? MapToTaskDto(designRequest.Task) : null,
            AssignedToUser = designRequest.AssignedToUser != null ? MapToUserDto(designRequest.AssignedToUser) : null
        };
    }

    /// <summary>
    /// Maps a CreateDesignRequestDto to DesignRequest entity
    /// </summary>
    public DesignRequest MapToDesignRequest(CreateDesignRequestDto createDesignRequestDto)
    {
        return new DesignRequest
        {
            TaskId = createDesignRequestDto.TaskId,
            Notes = createDesignRequestDto.Notes,
            AssignedToPrsId = createDesignRequestDto.AssignedToPrsId,
            Status = createDesignRequestDto.Status ?? 1, // Default to pending status
            DueDate = createDesignRequestDto.DueDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreateBy= createDesignRequestDto.CreateBy
        };
    }
}