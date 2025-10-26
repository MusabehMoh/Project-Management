namespace PMA.Core.DTOs.Tasks;

/// <summary>
/// DTO for task comments
/// </summary>
public class TaskCommentDto
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public string CommentText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
}