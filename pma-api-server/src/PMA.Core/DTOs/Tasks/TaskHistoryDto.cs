namespace PMA.Core.DTOs.Tasks;

/// <summary>
/// DTO for task history (audit trail)
/// </summary>
public class TaskHistoryDto
{
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
    public string ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public List<TaskHistoryItemDto> Items { get; set; } = new List<TaskHistoryItemDto>();
}

/// <summary>
/// DTO for individual history items
/// </summary>
public class TaskHistoryItemDto
{
    public int Id { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
}