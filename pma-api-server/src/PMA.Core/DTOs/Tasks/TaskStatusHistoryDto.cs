using PMA.Core.Enums;

namespace PMA.Core.DTOs.Tasks;

public class TaskStatusHistoryDto
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public PMA.Core.Enums.TaskStatus? OldStatus { get; set; }
    public PMA.Core.Enums.TaskStatus NewStatus { get; set; }
    public int ChangedByPrsId { get; set; }
    public string? ChangedByName { get; set; }
    public string? Comment { get; set; }
    public DateTime UpdatedAt { get; set; }
}