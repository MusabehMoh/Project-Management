using PMA.Core.Enums;

namespace PMA.Core.DTOs;

public class ProjectRequirementDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public RequirementPriority Priority { get; set; }
    public RequirementType Type { get; set; }
    public DateTime? ExpectedCompletionDate { get; set; }
    public RequirementStatusEnum Status { get; set; }
    public int CreatedBy { get; set; }
    public int? AssignedAnalyst { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public List<ProjectRequirementAttachmentDto> Attachments { get; set; } = new List<ProjectRequirementAttachmentDto>();
    public ProjectBasicInfoDto? Project { get; set; }
    public RequirementTaskDto? RequirementTask { get; set; }
    public TimelineBasicInfoDto? Timeline { get; set; }
}