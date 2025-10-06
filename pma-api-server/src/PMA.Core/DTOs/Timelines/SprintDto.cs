using PMA.Core.Enums;

namespace PMA.Core.DTOs;

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