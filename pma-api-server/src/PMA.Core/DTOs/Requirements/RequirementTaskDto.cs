namespace PMA.Core.DTOs;

public class RequirementTaskDto
{
    public int Id { get; set; }
    public int RequirementId { get; set; }
    public int? DeveloperId { get; set; }
    public string? DeveloperName { get; set; }
    public int? QcId { get; set; }
    public string? QcName { get; set; }
    public int? DesignerId { get; set; }
    public string? DesignerName { get; set; }
    public int? ControllerId { get; set; }
    public string? ControllerName { get; set; }
    public string? Description { get; set; }
    public DateTime? DeveloperStartDate { get; set; }
    public DateTime? DeveloperEndDate { get; set; }
    public DateTime? QcStartDate { get; set; }
    public DateTime? QcEndDate { get; set; }
    public DateTime? DesignerStartDate { get; set; }
    public DateTime? DesignerEndDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int CreatedBy { get; set; }
}