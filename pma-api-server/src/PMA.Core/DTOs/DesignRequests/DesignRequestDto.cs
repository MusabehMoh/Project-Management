namespace PMA.Core.DTOs;

public class DesignRequestDto
{
    public int Id { get; set; }
    public int? TaskId { get; set; }
    public string? Notes { get; set; }
    public int? AssignedToPrsId { get; set; }
    public string? AssignedToUserName { get; set; }
    public int? Status { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public TaskDto? Task { get; set; }
    public UserDto? AssignedToUser { get; set; }
    public ProjectRequirementDto? RequirementDetails { get; set; }
}