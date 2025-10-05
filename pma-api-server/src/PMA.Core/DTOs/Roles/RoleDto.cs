using PMA.Core.Entities;
using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

/// <summary>
/// Data transfer object for returning Role information
/// </summary>
public class RoleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int RoleOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DepartmentDto? Department { get; set; }
    public List<ActionDto>? Actions { get; set; }
}