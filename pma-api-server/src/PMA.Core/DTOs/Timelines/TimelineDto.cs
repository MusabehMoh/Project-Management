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