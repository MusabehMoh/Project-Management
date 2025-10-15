namespace PMA.Core.DTOs;

public class TeamMemberDto
{
    public int Id { get; set; }
    public int DepartmentId { get; set; }
    public int? PrsId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;
    public DateTime JoinDate { get; set; }
    public bool IsActive { get; set; }
    public EmployeeDto? User { get; set; }
}