namespace PMA.Core.DTOs;

public class UpdateActionDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Resource { get; set; }
    public string? Action { get; set; }
    public bool? IsActive { get; set; }
}