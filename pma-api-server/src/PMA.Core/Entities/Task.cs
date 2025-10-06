using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;
using PMA.Core.Enums;

namespace PMA.Core.Entities;

public class Task
{
    [Key]
    public int Id { get; set; }

     
    public int? SprintId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    public string? RoleType { get; set; }
    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    public TaskStatusEnum StatusId { get; set; }
    [Required]
    public TaskTypes TypeId { get; set; }
    [Required]
    public Priority PriorityId { get; set; }

    public int? DepartmentId { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? EstimatedHours { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? ActualHours { get; set; }
     
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

    [ForeignKey("ProjectRequirementId")]
    public ProjectRequirement? ProjectRequirement { get; set; }

    // Task assignments and dependencies
    public virtual ICollection<TaskAssignment> Assignments { get; set; } = new List<TaskAssignment>();
    public virtual ICollection<TaskDependency> Dependencies_Relations { get; set; } = new List<TaskDependency>();
    public virtual ICollection<TaskDependency> DependentTasks { get; set; } = new List<TaskDependency>();
}

[Table("TaskAssignments")]
public class TaskAssignment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TaskId { get; set; }

    [Required]
    public int PrsId { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("TaskId")]
    public virtual Task? Task { get; set; }

    [ForeignKey("PrsId")]
    public virtual Employee? Employee { get; set; }
}

[Table("TaskDependencies")]
public class TaskDependency
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TaskId { get; set; }

    [Required]
    public int DependsOnTaskId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("TaskId")]
    public virtual Task? Task { get; set; }

    [ForeignKey("DependsOnTaskId")]
    public virtual Task? DependsOnTask { get; set; }
}

