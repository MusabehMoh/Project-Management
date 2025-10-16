using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PMA.Core.Enums;

namespace PMA.Core.Entities;

public class Project
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string ApplicationName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ProjectOwner { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? AlternativeOwner { get; set; }

    [Required]
    [MaxLength(100)]
    public string OwningUnit { get; set; } = string.Empty;

    [Required]
    public int ProjectOwnerId { get; set; }

    public int? AlternativeOwnerId { get; set; }

    [Required]
    public int OwningUnitId { get; set; }



    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime ExpectedCompletionDate { get; set; }

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Remarks { get; set; } = string.Empty;

    [Required]
    public ProjectStatus Status { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    [Required]
    public Priority Priority { get; set; }

  
    [Required]
    [Range(0, 100)]
    public int Progress { get; set; }

    // Navigation properties
    [ForeignKey("ProjectOwnerId")]
    public Employee? ProjectOwnerEmployee { get; set; }

    [ForeignKey("AlternativeOwnerId")]
    public Employee? AlternativeOwnerEmployee { get; set; }

    [ForeignKey("OwningUnitId")]
    public Unit? OwningUnitEntity { get; set; }

    [ForeignKey("ProjectId")]
    public ICollection<ProjectAnalyst>? ProjectAnalysts { get; set; }

    public ICollection<Task>? Tasks { get; set; }
    public ICollection<ProjectRequirement>? ProjectRequirements { get; set; }
    public ICollection<Timeline>? Timelines { get; set; }
}


