using PMA.Core.Enums;

namespace PMA.Core.DTOs;

public class AssignedProjectDto
{
    public int Id { get; set; }
    public string ApplicationName { get; set; } = string.Empty;
    public string ProjectOwner { get; set; } = string.Empty;
    public string OwningUnit { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; }
    public int RequirementsCount { get; set; }
    public int CompletedRequirements { get; set; }
    public string LastActivity { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? Analysts { get; set; } // Display names for analysts (comma-separated)
}