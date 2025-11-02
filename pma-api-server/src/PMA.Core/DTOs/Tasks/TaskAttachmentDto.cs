namespace PMA.Core.DTOs.Tasks;

/// <summary>
/// DTO for task attachments
/// </summary>
public class TaskAttachmentDto
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? ContentType { get; set; }
    public DateTime UploadedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
}