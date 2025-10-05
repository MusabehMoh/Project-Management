namespace PMA.Core.DTOs;

public class CreateUserRequestDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int PrsId { get; set; }
    public bool IsVisible { get; set; }
    // FullName, MilitaryNumber, GradeName will be populated from Employee
    public int? DepartmentId { get; set; }
    public string? Email { get; set; } // Optional override
    public string? Phone { get; set; } // Optional override
    public List<int> RoleIds { get; set; } = new List<int>();
    public List<int> ActionIds { get; set; } = new List<int>();
}