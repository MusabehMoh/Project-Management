using PMA.Core.Entities;
using System.ComponentModel.DataAnnotations;

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