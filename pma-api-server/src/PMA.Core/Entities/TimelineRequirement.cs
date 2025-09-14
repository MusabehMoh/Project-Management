using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

[Table("TimelineRequirements")]
public class TimelineRequirement
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string TreeId { get; set; } = string.Empty;

    [Required]
    public int TimelineId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public int Duration { get; set; } // in days

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public int? DepartmentId { get; set; }
    public int StatusId { get; set; } = 1;
    public int PriorityId { get; set; } = 1;

    [Range(0, 100)]
    public int Progress { get; set; } = 0;

    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Timeline? Timeline { get; set; }
    public virtual Department? Department { get; set; }
    public virtual Lookup? Status { get; set; }
    public virtual Lookup? Priority { get; set; }
    public virtual ICollection<TimelineRequirementAssignment> Assignments { get; set; } = new List<TimelineRequirementAssignment>();
    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
}

[Table("TimelineRequirementAssignments")]
public class TimelineRequirementAssignment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TimelineRequirementId { get; set; }

    [Required]
    public int UserId { get; set; }

    // Navigation properties
    public virtual TimelineRequirement? TimelineRequirement { get; set; }
    public virtual User? User { get; set; }
}