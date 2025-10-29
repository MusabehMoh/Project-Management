using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

public class DesignRequest
{
    [Key]
    public int Id { get; set; }

    public int? TaskId { get; set; }

    public string? Notes { get; set; }

    public int? AssignedToPrsId { get; set; }

    public int? Status { get; set; }
    public string? CreateBy { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("TaskId")]
    public virtual Task? Task { get; set; }

    [ForeignKey("AssignedToPrsId")]
    public virtual Employee? AssignedToEmployee { get; set; }
}