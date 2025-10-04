using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

/// <summary>
/// Data transfer object for creating a new Role
/// </summary>
public class RoleCreateDto
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public int RoleOrder { get; set; } = 999; // Default to lowest priority
}