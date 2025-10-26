namespace PMA.Core.Entities;

/// <summary>
/// Represents a group of related changes to an entity. Each SaveChanges() creates one ChangeGroup per modified entity.
/// </summary>
public class ChangeGroup
{
    public int Id { get; set; }

    /// <summary>
    /// The type of entity that was changed (e.g., 'Task', 'ProjectRequirement')
    /// </summary>
    public string EntityType { get; set; } = string.Empty;

    /// <summary>
    /// The ID of the entity record that was changed
    /// </summary>
    public int EntityId { get; set; }

    /// <summary>
    /// User or employee identifier who made the change
    /// </summary>
    public string ChangedBy { get; set; } = "system";

    /// <summary>
    /// Timestamp when the change was made (UTC)
    /// </summary>
    public DateTime ChangedAt { get; set; } = DateTime.Now;

    /// <summary>
    /// Collection of individual field changes within this change group
    /// </summary>
    public ICollection<ChangeItem> Items { get; set; } = new List<ChangeItem>();
}
