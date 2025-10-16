using PMA.Core.Entities;
using PMA.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class CreateProjectDto
{
    [Required(ErrorMessage = "Application name is required")]
    [MaxLength(200, ErrorMessage = "Application name cannot exceed 200 characters")]
    public string ApplicationName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Project owner is required")]
    public int ProjectOwner { get; set; }
    public int[]? Analysts { get; set; }
    public int? AlternativeOwner { get; set; }

    [Required(ErrorMessage = "Owning unit is required")]
    public int OwningUnit { get; set; }
     

    [Required(ErrorMessage = "Start date is required")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "Expected completion date is required")]
    public DateTime ExpectedCompletionDate { get; set; }

    [Required(ErrorMessage = "Description is required")]
    public string Description { get; set; } = string.Empty;


    public string Remarks { get; set; } = string.Empty;

    [Required(ErrorMessage = "Priority is required")]
    public Priority Priority { get; set; }

    public string? CreatedBy { get; set; }

    [Range(0, 100, ErrorMessage = "Progress must be between 0 and 100")]
    public int Progress { get; set; } = 0;

    public ProjectStatus Status { get; set; } = ProjectStatus.New;
}