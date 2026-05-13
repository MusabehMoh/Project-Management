using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

[Table("ProjectManagerAssignments")]
public class ProjectManagerAssignment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ProjectId { get; set; }

    [Required]
    public int UserId { get; set; }

    public int AssignedBy { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.Now;

    [ForeignKey("ProjectId")]
    public virtual Project? Project { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("AssignedBy")]
    public virtual User? AssignedByUser { get; set; }
}
