namespace PMA.Core.Entities;

/// <summary>
/// Represents a single field change within a ChangeGroup.
/// </summary>
public class ChangeItem
{
    public int Id { get; set; }

    /// <summary>
    /// The ID of the parent ChangeGroup
    /// </summary>
    public int ChangeGroupId { get; set; }

    /// <summary>
    /// The name of the field that changed (e.g., 'StatusId', 'AssignedAnalyst')
    /// </summary>
    public string FieldName { get; set; } = string.Empty;

    /// <summary>
    /// The previous value of the field
    /// </summary>
    public string? OldValue { get; set; }

    /// <summary>
    /// The new value of the field
    /// </summary>
    public string? NewValue { get; set; }

    /// <summary>
    /// Navigation property to the parent ChangeGroup
    /// </summary>
    public ChangeGroup ChangeGroup { get; set; } = null!;
}
