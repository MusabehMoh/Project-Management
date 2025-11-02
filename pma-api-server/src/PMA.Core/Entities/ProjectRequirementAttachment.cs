using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

[Table("ProjectRequirementAttachments")]
public class ProjectRequirementAttachment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ProjectRequirementId { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string OriginalName { get; set; } = string.Empty;

    [Required]
    public byte[] FileData { get; set; } = Array.Empty<byte>();

    [Required]
    public long FileSize { get; set; }

    [MaxLength(100)]
    public string? ContentType { get; set; }

    [Required]
    public DateTime UploadedAt { get; set; }

    // Navigation properties
    [ForeignKey("ProjectRequirementId")]
    public virtual ProjectRequirement? ProjectRequirement { get; set; }
}