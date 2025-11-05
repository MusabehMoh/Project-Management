namespace PMA.Core.DTOs;

public class CompanyEmployeeDto
{
    public int Id { get; set; }
    public string? UserName { get; set; }
    public int? MilitaryNumber { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? GradeName { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateCompanyEmployeeDto
{
    public string? UserName { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? GradeName { get; set; }
}

public class UpdateCompanyEmployeeDto
{
    public string? UserName { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? GradeName { get; set; }
}