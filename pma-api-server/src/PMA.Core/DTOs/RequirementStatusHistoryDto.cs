namespace PMA.Core.DTOs;

public class RequirementStatusHistoryDto
{
    public int Id { get; set; }
    public int RequirementId { get; set; }
    public int FromStatus { get; set; }
    public int ToStatus { get; set; }
    public int CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Reason { get; set; }
}
