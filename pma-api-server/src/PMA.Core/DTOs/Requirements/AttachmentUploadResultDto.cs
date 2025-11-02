using System.Collections.Generic;
using PMA.Core.Entities;

namespace PMA.Core.DTOs;

/// <summary>
/// Standard response payload for attachment upload operations.
/// Provides the full attachment list after processing along with the subset created in the current request.
/// </summary>
public class AttachmentUploadResultDto
{
    public List<ProjectRequirementAttachment> Attachments { get; set; } = new();

    public List<ProjectRequirementAttachment> NewlyUploaded { get; set; } = new();
}
