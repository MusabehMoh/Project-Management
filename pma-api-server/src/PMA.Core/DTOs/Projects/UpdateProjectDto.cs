using PMA.Core.Entities;
using PMA.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class UpdateProjectDto
{
    [MaxLength(200, ErrorMessage = "Application name cannot exceed 200 characters")]
    public string? ApplicationName { get; set; }

    public int? ProjectOwner { get; set; }
    public int? AlternativeOwner { get; set; }
    public int? OwningUnit { get; set; }

    public int[]? Analysts { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? ExpectedCompletionDate { get; set; }

    public string? Description { get; set; }
    public string? Remarks { get; set; }

    public string? UpdatedBy { get; set; }
    public Priority? Priority { get; set; } 

    [Range(0, 100, ErrorMessage = "Progress must be between 0 and 100")]
    public int? Progress { get; set; }

    public ProjectStatus? Status { get; set; }
}