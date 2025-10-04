namespace PMA.Core.DTOs;

/// <summary>
/// Data transfer object for returning action/permission information
/// </summary>
public class ActionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}