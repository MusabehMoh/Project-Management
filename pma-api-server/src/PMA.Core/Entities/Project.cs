using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    [Required]
    [MaxLength(100)]
    public string AlternativeOwner { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string OwningUnit { get; set; } = string.Empty;

    [Required]
    public int ProjectOwnerId { get; set; }

    [Required]
    public int AlternativeOwnerId { get; set; }

    [Required]
    public int OwningUnitId { get; set; }

    public string? Analysts { get; set; }
    public string AnalystIds { get; set; }

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

    [Required]
    public Priority Priority { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Budget { get; set; }

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

    public ICollection<Task>? Tasks { get; set; }
    public ICollection<Requirement>? Requirements { get; set; }
}

public enum ProjectStatus
{
    New = 1,
    Delayed = 2,
    UnderReview = 3,
    UnderDevelopment = 4,
    Production = 5
}

public enum Priority
{
    Low,
    Medium,
    High,
    Critical
}


