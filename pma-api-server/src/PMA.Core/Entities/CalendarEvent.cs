using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

[Table("CalendarEvents")]
public class CalendarEvent
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = string.Empty; // 'project', 'requirement', 'meeting', 'deadline', 'milestone'

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = string.Empty; // 'upcoming', 'in-progress', 'completed', 'overdue'

    [Required]
    [MaxLength(20)]
    public string Priority { get; set; } = string.Empty; // 'low', 'medium', 'high', 'critical'

    public int? ProjectId { get; set; }
    public int? RequirementId { get; set; }
    public int? SprintId { get; set; }

    [MaxLength(500)]
    public string? Location { get; set; }

    public bool IsAllDay { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    [Required]
    public int CreatedBy { get; set; }

    // Navigation properties
    public virtual Project? Project { get; set; }
    public virtual Requirement? Requirement { get; set; }
    public virtual Sprint? Sprint { get; set; }
    public virtual User? Creator { get; set; }
    public virtual ICollection<CalendarEventAssignment> Assignments { get; set; } = new List<CalendarEventAssignment>();
}

[Table("CalendarEventAssignments")]
public class CalendarEventAssignment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int CalendarEventId { get; set; }

    [Required]
    public int UserId { get; set; }

    // Navigation properties
    public virtual CalendarEvent? CalendarEvent { get; set; }
    public virtual User? User { get; set; }
}