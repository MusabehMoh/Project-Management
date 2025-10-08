using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class ProjectRequirementAttachmentDto
{
    public int Id { get; set; }
    public int ProjectRequirementId { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string OriginalName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? FilePath { get; set; }

    [Required]
    public long FileSize { get; set; }

    [MaxLength(100)]
    public string? ContentType { get; set; }

    [Required]
    public DateTime UploadedAt { get; set; }
}