namespace PMA.Core.DTOs;

/// <summary>
/// DTO for a single field change within an audit log entry
/// </summary>
public class ChangeItemDto
{
    public int Id { get; set; }
    public int ChangeGroupId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
}

/// <summary>
/// DTO for a group of related changes to an entity
/// </summary>
public class ChangeGroupDto
{
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string ChangedBy { get; set; } = "system";
    public DateTime ChangedAt { get; set; }
    public ICollection<ChangeItemDto> Items { get; set; } = new List<ChangeItemDto>();
}
