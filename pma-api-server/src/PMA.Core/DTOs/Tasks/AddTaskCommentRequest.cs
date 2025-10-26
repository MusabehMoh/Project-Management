namespace PMA.Core.DTOs.Tasks;

/// <summary>
/// Request DTO for adding a task comment
/// </summary>
public class AddTaskCommentRequest
{
    public string CommentText { get; set; } = string.Empty;
}