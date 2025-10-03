using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

 
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

 