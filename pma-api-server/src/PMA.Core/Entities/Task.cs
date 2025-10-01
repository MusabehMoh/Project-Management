using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

public class Task
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SprintId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    public TaskStatus StatusId { get; set; }

    [Required]
    public Priority PriorityId { get; set; }

    public int? DepartmentId { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? EstimatedHours { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? ActualHours { get; set; }

    public string? Dependencies { get; set; }
    public int? TimelineId { get; set; }
    public int? ProjectRequirementId { get; set; }
    

    [Required]
    [Range(0, 100)]
    public int Progress { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("SprintId")]
    public Sprint? Sprint { get; set; }

    [ForeignKey("DepartmentId")]
    public Department? Department { get; set; }

    [ForeignKey("TimelineId")]
    public Timeline? Timeline { get; set; }
 

}

public enum TaskStatus
{
    ToDo = 1,
    InProgress = 2,
    InReview = 3,
    Done = 4
}


