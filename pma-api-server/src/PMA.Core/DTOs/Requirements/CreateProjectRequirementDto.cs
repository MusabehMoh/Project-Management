namespace PMA.Core.DTOs;

public class CreateProjectRequirementDto
{
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; }
    public int Type { get; set; }
    public DateTime? ExpectedCompletionDate { get; set; }
    public int? Status { get; set; }
    public int? SentBy { get; set; }
}
