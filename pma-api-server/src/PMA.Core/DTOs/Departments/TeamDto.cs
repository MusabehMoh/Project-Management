namespace PMA.Core.DTOs;

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