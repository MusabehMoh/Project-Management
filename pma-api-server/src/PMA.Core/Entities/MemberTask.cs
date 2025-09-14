using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

[Table("MemberTasks")]
public class MemberTask
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    [Range(0, 100)]
    public int Progress { get; set; } = 0;

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Priority { get; set; } = string.Empty;

    public int? DepartmentId { get; set; }
    public int? ProjectId { get; set; }
    public int? RequirementId { get; set; }
    public int? PrimaryAssigneeId { get; set; }

    public int TimeSpent { get; set; } = 0; // hours
    public int EstimatedTime { get; set; } = 0; // hours

    [MaxLength(500)]
    public string? Tags { get; set; } // JSON array of tags

    public bool IsOverdue { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Department? Department { get; set; }
    public virtual Project? Project { get; set; }
    public virtual Requirement? Requirement { get; set; }
    public virtual User? PrimaryAssignee { get; set; }
    public virtual ICollection<MemberTaskAssignment> Assignments { get; set; } = new List<MemberTaskAssignment>();
}

[Table("MemberTaskAssignments")]
public class MemberTaskAssignment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int MemberTaskId { get; set; }

    [Required]
    public int UserId { get; set; }

    // Navigation properties
    public virtual MemberTask? MemberTask { get; set; }
    public virtual User? User { get; set; }
}