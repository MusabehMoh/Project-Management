using PMA.Core.Entities;
using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class ProjectDto
{
    public int Id { get; set; }
    public string ApplicationName { get; set; } = string.Empty;
    public string ProjectOwner { get; set; } = string.Empty;
    public string? AlternativeOwner { get; set; }
    public string OwningUnit { get; set; } = string.Empty;
    public int ProjectOwnerId { get; set; }
    public int? AlternativeOwnerId { get; set; }
    public int OwningUnitId { get; set; }
    public string? Analysts { get; set; }
    public List<int> AnalystIds { get; set; } = new List<int>();
    public DateTime StartDate { get; set; }
    public DateTime ExpectedCompletionDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Priority Priority { get; set; }
    public decimal Budget { get; set; }
    public int Progress { get; set; }
}

public class CreateProjectDto
{
    [Required(ErrorMessage = "Application name is required")]
    [MaxLength(200, ErrorMessage = "Application name cannot exceed 200 characters")]
    public string ApplicationName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Project owner is required")]
    public int ProjectOwner { get; set; }

    public int? AlternativeOwner { get; set; }

    [Required(ErrorMessage = "Owning unit is required")]
    public int OwningUnit { get; set; }

    public int[]? Analysts { get; set; }

    [Required(ErrorMessage = "Start date is required")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "Expected completion date is required")]
    public DateTime ExpectedCompletionDate { get; set; }

    [Required(ErrorMessage = "Description is required")]
    public string Description { get; set; } = string.Empty;

 
    public string Remarks { get; set; } = string.Empty;

    [Required(ErrorMessage = "Priority is required")]
    public Priority Priority { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Budget must be a positive value")]
    public decimal Budget { get; set; }

    [Range(0, 100, ErrorMessage = "Progress must be between 0 and 100")]
    public int Progress { get; set; } = 0;

    public ProjectStatus Status { get; set; } = ProjectStatus.New;
}

public class UpdateProjectDto
{
    [MaxLength(200, ErrorMessage = "Application name cannot exceed 200 characters")]
    public string? ApplicationName { get; set; }

    public int? ProjectOwner { get; set; }
    public int? AlternativeOwner { get; set; }
    public int? OwningUnit { get; set; }

    public int[]? Analysts { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? ExpectedCompletionDate { get; set; }

    public string? Description { get; set; }
    public string? Remarks { get; set; }
    
    public Priority? Priority { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Budget must be a positive value")]
    public decimal? Budget { get; set; }

    [Range(0, 100, ErrorMessage = "Progress must be between 0 and 100")]
    public int? Progress { get; set; }

    public ProjectStatus? Status { get; set; }
}

public class ProjectStatsDto
{
    public int Total { get; set; }
    public int New { get; set; }
    public int Delayed { get; set; }
    public int UnderReview { get; set; }
    public int UnderDevelopment { get; set; }
    public int Production { get; set; }
}

public class PaginatedResponse<T>
{
    public bool Success { get; set; }
    public IEnumerable<T> Data { get; set; } = new List<T>();
    public PaginationInfo? Pagination { get; set; }
}

public class PaginationInfo
{
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public int TotalPages { get; set; }

    public PaginationInfo() { }

    public PaginationInfo(int pageNumber, int pageSize, int totalRecords, int totalPagesCount)
    {
        Page = pageNumber;
        Limit = pageSize;
        Total = totalRecords;
        TotalPages = totalPagesCount;
    }
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public string? Error { get; set; }
    public PaginationInfo? Pagination { get; set; }
}
 
public class CreateActionDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class UpdateActionDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Resource { get; set; }
    public string? Action { get; set; }
    public bool? IsActive { get; set; }
}

// User DTOs
public class EmployeeDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string MilitaryNumber { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int StatusId { get; set; }
}
 
public class CurrentUserDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int? PrsId { get; set; }
    public bool IsVisible { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string MilitaryNumber { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public EmployeeDto? Employee { get; set; }
    public List<RoleDto>? Roles { get; set; }
    public List<ActionDto>? Actions { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int? PrsId { get; set; }
    public bool IsVisible { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string MilitaryNumber { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public EmployeeDto? Employee { get; set; }
    public List<RoleDto>? Roles { get; set; }
    public List<ActionDto>? Actions { get; set; }
}



public class CreateUserRequestDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int PrsId { get; set; }
    public bool IsVisible { get; set; }
    // FullName, MilitaryNumber, GradeName will be populated from Employee
    public string Department { get; set; } = string.Empty;
    public string? Email { get; set; } // Optional override
    public string? Phone { get; set; } // Optional override
    public List<int> RoleIds { get; set; } = new List<int>();
    public List<int> ActionIds { get; set; } = new List<int>();
}

public class UpdateUserRequestDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int PrsId { get; set; }
    public bool IsVisible { get; set; }
    // FullName, MilitaryNumber, GradeName will be populated from Employee
    public string Department { get; set; } = string.Empty;
    public string? Email { get; set; } // Optional override
    public string? Phone { get; set; } // Optional override
    public List<int> RoleIds { get; set; } = new List<int>();
    public List<int> ActionIds { get; set; } = new List<int>();
}

public class AssignedProjectDto
{
    public int Id { get; set; }
    public string ApplicationName { get; set; } = string.Empty;
    public string ProjectOwner { get; set; } = string.Empty;
    public string OwningUnit { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; }
    public int RequirementsCount { get; set; }
    public int CompletedRequirements { get; set; }
    public string LastActivity { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? Analysts { get; set; } // Display names for analysts (comma-separated)
}

public class ProjectRequirementStatsDto
{
    public int Total { get; set; }
    public int Draft { get; set; }
    public int ManagerReview { get; set; }
    public int Approved { get; set; }
    public int InDevelopment { get; set; }
    public int UnderTesting { get; set; }
    public int Completed { get; set; }
    public ByStatusDto ByStatus { get; set; } = new();
    public ByPriorityDto ByPriority { get; set; } = new();
}

public class ByStatusDto
{
    public int Draft { get; set; }
    public int ManagerReview { get; set; }
    public int Approved { get; set; }
    public int Rejected { get; set; }
    public int InDevelopment { get; set; }
    public int UnderTesting { get; set; }
    public int Completed { get; set; }
}

public class ByPriorityDto
{
    public int Low { get; set; }
    public int Medium { get; set; }
    public int High { get; set; }
    public int Critical { get; set; }
}

 
public class CreateUpdateProjectRequirementDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public RequirementPriority Priority { get; set; } = RequirementPriority.Medium;
    public RequirementType Type { get; set; } = RequirementType.New;
    public DateTime? ExpectedCompletionDate { get; set; }
    public RequirementStatusEnum Status { get; set; } = RequirementStatusEnum.New;
    public List<string> Attachments { get; set; } = new();
}

public class ProjectRequirementDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public RequirementPriority Priority { get; set; }
    public RequirementType Type { get; set; }
    public DateTime? ExpectedCompletionDate { get; set; }
    public RequirementStatusEnum Status { get; set; }
    public int CreatedBy { get; set; }
    public int? AssignedAnalyst { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateRequirementStatusDto
{
    [Required]
    public RequirementStatusEnum Status { get; set; }
}
 
