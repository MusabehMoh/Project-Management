namespace PMA.Core.DTOs;

public class CreateActionDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}