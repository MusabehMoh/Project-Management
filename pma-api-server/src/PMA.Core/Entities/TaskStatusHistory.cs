using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PMA.Core.Enums;

namespace PMA.Core.Entities;

[Table("TaskStatusHistory")]
public class TaskStatusHistory
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TaskId { get; set; }

    public PMA.Core.Enums.TaskStatus? OldStatus { get; set; }

    [Required]
    public PMA.Core.Enums.TaskStatus NewStatus { get; set; }

    [Required]
    public int ChangedByPrsId { get; set; }

    public string? Comment { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("TaskId")]
    public virtual Task? Task { get; set; }

    [ForeignKey("ChangedByPrsId")]
    public virtual Employee? ChangedBy { get; set; }
}