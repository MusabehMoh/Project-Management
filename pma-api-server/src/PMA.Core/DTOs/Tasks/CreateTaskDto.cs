using PMA.Core.Enums;
using System.ComponentModel.DataAnnotations;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;

namespace PMA.Core.DTOs;

public class CreateTaskDto
{
     
    public int? SprintId { get; set; }

    [Required(ErrorMessage = "Name is required")]
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }
    public string? RoleType { get; set; }
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