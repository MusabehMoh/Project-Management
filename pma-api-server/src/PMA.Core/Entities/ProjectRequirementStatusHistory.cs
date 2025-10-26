using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

[Table("ProjectRequirementStatusHistory")]
public class ProjectRequirementStatusHistory
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int RequirementId { get; set; }

    [Required]
    public int FromStatus { get; set; }

    [Required]
    public int ToStatus { get; set; }

    [Required]
    public int CreatedBy { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [StringLength(500)]
    public string? Reason { get; set; }

    // Navigation properties
    [ForeignKey("RequirementId")]
    public virtual ProjectRequirement? Requirement { get; set; }

    [ForeignKey("CreatedBy")]
    public virtual Employee? CreatedByUser { get; set; }
}