using PMA.Core.Enums;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;

namespace PMA.Core.DTOs;

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
    public string DepartmentName { get; set; } = string.Empty;
    public DepartmentDto? Department { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public ProjectDto? Project { get; set; }
    public RequirementBasicDto? Requirement { get; set; }
    public int? TimelineId { get; set; }
    public int? ProjectRequirementId { get; set; }
    public decimal? EstimatedHours { get; set; }
    public decimal? ActualHours { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int Progress { get; set; }
    // Task assignments and dependencies - matching frontend naming
    public List<int> MemberIds { get; set; } = new List<int>();
    public List<MemberSearchResultDto> AssignedMembers { get; set; } = new List<MemberSearchResultDto>();

    public List<int> DepTaskIds { get; set; } = new List<int>();
}