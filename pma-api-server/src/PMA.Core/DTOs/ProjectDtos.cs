using PMA.Core.Entities;

namespace PMA.Core.DTOs;

public class ProjectDto
{
    public int Id { get; set; }
    public string ApplicationName { get; set; } = string.Empty;
    public string ProjectOwner { get; set; } = string.Empty;
    public string AlternativeOwner { get; set; } = string.Empty;
    public string OwningUnit { get; set; } = string.Empty;
    public int ProjectOwnerId { get; set; }
    public int AlternativeOwnerId { get; set; }
    public int OwningUnitId { get; set; }
    public string? Analysts { get; set; }
    public string AnalystIds { get; set; }
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
