using PMA.Core.Entities;
using PMA.Core.Enums;
using System.ComponentModel.DataAnnotations;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;

namespace PMA.Core.DTOs;

public class TimelineDto
{
    public int Id { get; set; }
    public string TreeId { get; set; } = string.Empty;
    public int ProjectId { get; set; }
    public int? ProjectRequirementId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    // Navigation properties can be added if needed, e.g., Project name
}

public class CreateTimelineDto
{
 
    [Required(ErrorMessage = "ProjectId is required")]
    public int ProjectId { get; set; }

    public int? ProjectRequirementId { get; set; }

    [Required(ErrorMessage = "Name is required")]
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "StartDate is required")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "EndDate is required")]
    public DateTime EndDate { get; set; }
}

public class UpdateTimelineDto
{
    [MaxLength(50, ErrorMessage = "TreeId cannot exceed 50 characters")]
    public string? TreeId { get; set; }

    public int? ProjectId { get; set; }
    public int? ProjectRequirementId { get; set; }

    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string? Name { get; set; }

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class SprintDto
{
    public int Id { get; set; }
    public string TreeId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public SprintStatus Status { get; set; }
    public int? ProjectId { get; set; }
    public int? TimelineId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<TaskDto> Tasks { get; set; } = new List<TaskDto>();
}

public class TaskDto
{
    public int Id { get; set; }
    public string TreeId { get; set; } = string.Empty;
    public int? SprintId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TaskStatusEnum StatusId { get; set; }
    public Priority PriorityId { get; set; }
    public int? DepartmentId { get; set; }
    public int? TimelineId { get; set; }
    public int? ProjectRequirementId { get; set; }
    public decimal? EstimatedHours { get; set; }
    public decimal? ActualHours { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Task assignments and dependencies - matching frontend naming
    public List<int> MemberIds { get; set; } = new List<int>();
    public List<int> DepTaskIds { get; set; } = new List<int>();
}

public class CreateTaskDto
{
     
    public int SprintId { get; set; }

    [Required(ErrorMessage = "Name is required")]
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "StartDate is required")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "EndDate is required")]
    public DateTime EndDate { get; set; }
    public TaskTypes TypeId { get; set; } = TaskTypes.TimeLine;   
    public TaskStatusEnum StatusId { get; set; } = TaskStatusEnum.ToDo;
    public Priority PriorityId { get; set; } = Priority.Medium;
    public int? DepartmentId { get; set; }
    public int? TimelineId { get; set; }
    public int? ProjectRequirementId { get; set; }
    public decimal? EstimatedHours { get; set; }
    public int Progress { get; set; } = 0;
    public string? Notes { get; set; }
    
    // New fields for task assignments and dependencies - matching frontend naming
    public List<int>? MemberIds { get; set; }
    public List<int>? DepTaskIds { get; set; }
}

public class CreateAdHocTaskDto
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "StartDate is required")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "EndDate is required")]
    public DateTime EndDate { get; set; }

    [Required(ErrorMessage = "At least one member must be assigned")]
    public List<int> AssignedMembers { get; set; } = new List<int>();
}

public class UpdateTaskDto
{
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string? Name { get; set; }

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public TaskStatusEnum? StatusId { get; set; }
    public Priority? PriorityId { get; set; }
    public int? DepartmentId { get; set; }
    public int? TimelineId { get; set; }
    public int? ProjectRequirementId { get; set; }
    public decimal? EstimatedHours { get; set; }
    public decimal? ActualHours { get; set; }
    public int? Progress { get; set; }
    public string? Notes { get; set; }
    
    // New fields for task assignments and dependencies - matching frontend naming
    public List<int>? MemberIds { get; set; }
    public List<int>? DepTaskIds { get; set; }
}

public class UpdateTaskStatusDto
{
    [Required(ErrorMessage = "StatusId is required")]
    public TaskStatusEnum StatusId { get; set; }
}

public class MoveTaskDto
{
    [Required(ErrorMessage = "MoveDays is required")]
    public int MoveDays { get; set; }
}

public class MoveTaskToSprintDto
{
    [Required(ErrorMessage = "TargetSprintId is required")]
    public int TargetSprintId { get; set; }
}

public class TimelineWithSprintsDto : TimelineDto
{
    public List<SprintDto> Sprints { get; set; } = new List<SprintDto>();
}

public class CreateSprintDto
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "StartDate is required")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "EndDate is required")]
    public DateTime EndDate { get; set; }

    public SprintStatus Status { get; set; } = SprintStatus.Planned;
}

public class UpdateSprintDto
{
    [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string? Name { get; set; }

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public SprintStatus? Status { get; set; }
}

public class ProjectWithTimelinesDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int TimelineCount { get; set; }
    public List<TimelineWithSprintsDto> Timelines { get; set; } = new List<TimelineWithSprintsDto>();
}