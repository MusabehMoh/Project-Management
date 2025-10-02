using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class MemberTaskDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public int Progress { get; set; }
    public TaskStatusDto Status { get; set; } = new();
    public TaskPriorityDto Priority { get; set; } = new();
    public TaskDepartmentDto Department { get; set; } = new();
    public List<MemberSearchResultDto> AssignedMembers { get; set; } = new();
    public MemberSearchResultDto? PrimaryAssignee { get; set; }
    public List<int> MemberIds { get; set; } = new();
    public ProjectBasicDto Project { get; set; } = new();
    public RequirementBasicDto Requirement { get; set; } = new();
    public bool CanRequestDesign { get; set; }
    public int TimeSpent { get; set; }
    public int EstimatedTime { get; set; }
    public List<string> Tags { get; set; } = new();
    public bool IsOverdue { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class TaskStatusDto
{
    public int Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class TaskPriorityDto
{
    public int Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class TaskDepartmentDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class MemberSearchResultDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string MilitaryNumber { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public int StatusId { get; set; }
    public string Department { get; set; } = string.Empty;
}

public class ProjectBasicDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class RequirementBasicDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class MemberTasksResponseDto
{
    public List<MemberTaskDto> Tasks { get; set; } = new();
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPrevPage { get; set; }
}