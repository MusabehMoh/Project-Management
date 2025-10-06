using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

/// <summary>
/// Data transfer object for updating an existing Role
/// </summary>
public class RoleUpdateDto
{
    [Required]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public bool IsActive { get; set; }
    
    public int RoleOrder { get; set; }
}