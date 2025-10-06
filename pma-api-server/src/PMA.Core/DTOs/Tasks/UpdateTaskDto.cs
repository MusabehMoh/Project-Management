using PMA.Core.Enums;
using System.ComponentModel.DataAnnotations;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;

namespace PMA.Core.DTOs;

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