using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

public class Sprint
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    public SprintStatus Status { get; set; }

    public int? ProjectId { get; set; }

    public int? TimelineId { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("ProjectId")]
    public Project? Project { get; set; }

    [ForeignKey("TimelineId")]
    public Timeline? Timeline { get; set; }

    public ICollection<Task>? Tasks { get; set; }
}

public enum SprintStatus
{
    Planned = 1,
    Active = 2,
    Completed = 3,
    Cancelled = 4
}


