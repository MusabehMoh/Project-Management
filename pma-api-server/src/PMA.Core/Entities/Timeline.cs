using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

[Table("Timelines")]
public class Timeline
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ProjectId { get; set; }

    public int? ProjectRequirementId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Project? Project { get; set; }
    public virtual ProjectRequirement? ProjectRequirement { get; set; }
    public virtual ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
}