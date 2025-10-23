using PMA.Core.Enums;

namespace PMA.Core.DTOs;

public class AssignedProjectDto
{
    public int Id { get; set; }
    public string ApplicationName { get; set; } = string.Empty;
    
    // Included entity references for frontend display
    public EmployeeDto? ProjectOwnerEmployee { get; set; }
    public EmployeeDto? AlternativeOwnerEmployee { get; set; }
    public EmployeeDto? ResponsibleUnitManagerEmployee { get; set; }
    public string OwningUnit { get; set; } = string.Empty;
    public int? OwningUnitId { get; set; }
    public List<EmployeeDto> AnalystEmployees { get; set; } = new List<EmployeeDto>();
    
    // Legacy string properties for backward compatibility
    public string ProjectOwner { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; }
    public int RequirementsCount { get; set; }
    public int CompletedRequirements { get; set; }
    public string LastActivity { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? Analysts { get; set; } // Display names for analysts (comma-separated)
    
    // IDs for reference
    public int ProjectOwnerId { get; set; }
    public int? AlternativeOwnerId { get; set; }
    public int? ResponsibleUnitManagerId { get; set; }
}