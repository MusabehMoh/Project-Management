namespace PMA.Core.DTOs;

public class EmployeeDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string MilitaryNumber { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int StatusId { get; set; }
}