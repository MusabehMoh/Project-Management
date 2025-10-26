namespace PMA.Core.Entities;

/// <summary>
/// Represents a comment made on a task.
/// </summary>
public class TaskComment
{
    public int Id { get; set; }

    /// <summary>
    /// The ID of the task this comment belongs to
    /// </summary>
    public int TaskId { get; set; }

    /// <summary>
    /// The text content of the comment
    /// </summary>
    public string CommentText { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when the comment was created (UTC)
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    /// <summary>
    /// User or employee identifier who created the comment
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Navigation property to the related task
    /// </summary>
    public Task Task { get; set; } = null!;
}