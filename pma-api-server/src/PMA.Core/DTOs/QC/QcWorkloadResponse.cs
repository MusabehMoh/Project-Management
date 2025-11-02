namespace PMA.Core.DTOs.QC;

/// <summary>
/// Paginated response for QC workload data
/// </summary>
public class QcWorkloadResponse
{
    public List<QcWorkloadDto> QcMembers { get; set; } = new();
    public PaginationInfo Pagination { get; set; } = new();
}

public class PaginationInfo
{
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}