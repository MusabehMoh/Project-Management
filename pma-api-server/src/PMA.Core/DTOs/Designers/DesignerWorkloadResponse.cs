namespace PMA.Core.DTOs.Designers;

/// <summary>
/// Paginated response for designer workload data
/// </summary>
public class DesignerWorkloadResponse
{
    public List<DesignerWorkloadDto> Designers { get; set; } = new();
    public PaginationInfo Pagination { get; set; } = new();
}

public class PaginationInfo
{
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}
