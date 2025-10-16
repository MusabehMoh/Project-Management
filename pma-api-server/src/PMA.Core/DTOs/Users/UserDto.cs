namespace PMA.Core.DTOs;

public class UserDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int? PrsId { get; set; }
    public bool IsActive { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string MilitaryNumber { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public int? DepartmentId{ get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public EmployeeDto? Employee { get; set; }
    public List<RoleDto>? Roles { get; set; }
    public List<ActionDto>? Actions { get; set; }
}