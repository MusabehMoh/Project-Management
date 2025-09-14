using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

[Table("Lookups")]
public class Lookup
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty; // 'projectStatus', 'priority', 'taskStatus', etc.

    [Required]
    [MaxLength(50)]
    public string Value { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Label { get; set; } = string.Empty;

    [MaxLength(7)]
    public string? Color { get; set; } // Hex color code

    public int Order { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}