using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

[Table("SubTasks")]
public class SubTask
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string TreeId { get; set; } = string.Empty;

    [Required]
    public int TaskId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public int? AssigneeId { get; set; }

    [MaxLength(100)]
    public string? AssigneeName { get; set; }

    public int StatusId { get; set; } = 1;
    public int? PriorityId { get; set; }
    public int? DepartmentId { get; set; }

    public int? EstimatedHours { get; set; }
    public int? ActualHours { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Task? Task { get; set; }
    public virtual User? Assignee { get; set; }
    public virtual Department? Department { get; set; }
    public virtual Lookup? Status { get; set; }
    public virtual Lookup? Priority { get; set; }
    public virtual ICollection<SubTaskAssignment> Assignments { get; set; } = new List<SubTaskAssignment>();
}

[Table("SubTaskAssignments")]
public class SubTaskAssignment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SubTaskId { get; set; }

    [Required]
    public int UserId { get; set; }

    // Navigation properties
    public virtual SubTask? SubTask { get; set; }
    public virtual User? User { get; set; }
}