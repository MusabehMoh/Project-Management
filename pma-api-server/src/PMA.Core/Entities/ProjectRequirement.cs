using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

public enum RequirementPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum RequirementType
{
    New = 1,
    ChangeRequest = 2
}

public enum RequirementStatusEnum
{
    New = 1,
    ManagerReview = 2,
    Approved = 3, 
    UnderDevelopment = 4,
    UnderTesting = 5,
    Completed = 6,

}

[Table("ProjectRequirements")]
public class ProjectRequirement
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ProjectId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [Column(TypeName = "int")]
    public RequirementPriority Priority { get; set; } = RequirementPriority.Medium;

    [Required]
    [Column(TypeName = "int")]
    public RequirementType Type { get; set; } = RequirementType.New;

    public DateTime? ExpectedCompletionDate { get; set; }

    [Required]
    [Column(TypeName = "int")]
    public RequirementStatusEnum Status { get; set; } = RequirementStatusEnum.New;

    public int CreatedBy { get; set; }
    public int? AssignedAnalyst { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Project? Project { get; set; }
    public virtual User? Creator { get; set; }
    public virtual User? Analyst { get; set; }
    public virtual ICollection<ProjectRequirementAttachment> Attachments { get; set; } = new List<ProjectRequirementAttachment>();
    public virtual ICollection<RequirementTask> Tasks { get; set; } = new List<RequirementTask>();
    public virtual Timeline? Timeline { get; set; }
}

[Table("RequirementTasks")]
public class RequirementTask
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ProjectRequirementId { get; set; }

    public int? DeveloperId { get; set; }
    public int? QcId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = string.Empty; // 'not-started', 'in-progress', 'testing', 'completed'

    public int CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ProjectRequirement? ProjectRequirement { get; set; }
    public virtual User? Developer { get; set; }
    public virtual User? Qc { get; set; }
    public virtual User? Creator { get; set; }
}