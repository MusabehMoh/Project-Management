using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace PMA.Core.Entities;

public class Requirement
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public RequirementType Type { get; set; }

    [Required]
    public RequirementStatus Status { get; set; }

    [Required]
    public Priority Priority { get; set; }

    public int? ProjectId { get; set; }
    public int? AssignedToId { get; set; }
    public DateTime? DueDate { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    [JsonIgnore]
    [ForeignKey("ProjectId")]
    public Project? Project { get; set; }

    [ForeignKey("AssignedToId")]
    public User? AssignedTo { get; set; }

    public ICollection<RequirementComment>? Comments { get; set; }
}

 

public enum RequirementStatus
{
    Draft = 1,
    InReview = 2,
    Approved = 3,
    InProgress = 4,
    Completed = 5,
    Rejected = 6
}

public class RequirementComment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int RequirementId { get; set; }

    [Required]
    public string Comment { get; set; } = string.Empty;

    [Required]
    public int CreatedById { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    [ForeignKey("RequirementId")]
    public Requirement? Requirement { get; set; }

    [ForeignKey("CreatedById")]
    public User? CreatedBy { get; set; }
}


