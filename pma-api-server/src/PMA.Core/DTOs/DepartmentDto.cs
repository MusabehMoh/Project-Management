namespace PMA.Core.DTOs;

public class DepartmentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int MemberCount { get; set; }
}

public class TeamDto
{
    public int Id { get; set; }
    public int PrsId { get; set; }
    public int DepartmentId { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime JoinDate { get; set; }
    public bool IsActive { get; set; }
    public EmployeeDto? Employee { get; set; }
}

public class TeamMemberDto
{
    public int Id { get; set; }
    public int DepartmentId { get; set; }
    public int UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime JoinDate { get; set; }
    public bool IsActive { get; set; }
    public EmployeeDto? User { get; set; }
}

public class AddMemberRequest
{
    public int UserId { get; set; }
    public string? Role { get; set; }
}

public class UpdateMemberRequest
{
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}
