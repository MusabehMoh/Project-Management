using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

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
    [MaxLength(20)]
    public string Priority { get; set; } = string.Empty; // 'high', 'medium', 'low'

    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = string.Empty; // 'new', 'change request'

    public DateTime? ExpectedCompletionDate { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = string.Empty; // 'draft', 'approved', 'in-development', 'completed'

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
}

[Table("ProjectRequirementAttachments")]
public class ProjectRequirementAttachment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ProjectRequirementId { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string OriginalName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? FilePath { get; set; }

    public long FileSize { get; set; }

    [MaxLength(100)]
    public string? ContentType { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public virtual ProjectRequirement? ProjectRequirement { get; set; }
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