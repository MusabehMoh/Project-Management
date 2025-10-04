using PMA.Core.Enums;

namespace PMA.Core.DTOs;

public class CreateUpdateProjectRequirementDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public RequirementPriority Priority { get; set; } = RequirementPriority.Medium;
    public RequirementType Type { get; set; } = RequirementType.New;
    public DateTime? ExpectedCompletionDate { get; set; }
    public RequirementStatusEnum Status { get; set; } = RequirementStatusEnum.New;
    public List<string> Attachments { get; set; } = new();
}