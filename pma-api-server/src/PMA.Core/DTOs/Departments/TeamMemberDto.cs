namespace PMA.Core.DTOs;

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