namespace PMA.Core.DTOs;

/// <summary>
/// DTO for managing attachments on a project requirement without modifying core requirement fields.
/// Used in PATCH endpoints to handle attachment lifecycle separately from requirement data.
/// </summary>
public class UpdateRequirementAttachmentsDto
{
    /// <summary>
    /// List of attachment IDs to keep (preserve). IDs not in this list will be considered for removal
    /// if they currently exist on the requirement.
    /// </summary>
    public List<int> AttachmentIdsToKeep { get; set; } = new();

    /// <summary>
    /// List of attachment IDs to explicitly delete. This is an alternative to AttachmentIdsToKeep.
    /// If AttachmentIdsToKeep is provided and non-empty, this property is ignored.
    /// If AttachmentIdsToKeep is empty but RemoveAttachmentIds is provided, only those IDs are deleted.
    /// </summary>
    public List<int> RemoveAttachmentIds { get; set; } = new();
}
