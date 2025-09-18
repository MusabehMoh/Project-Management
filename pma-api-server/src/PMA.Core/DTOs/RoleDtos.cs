using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

/// <summary>
/// Data transfer object for returning Role information
/// </summary>
public class RoleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int RoleOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ActionDto>? Actions { get; set; }
}

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