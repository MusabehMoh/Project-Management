namespace PMA.Core.DTOs;

public class PaginatedResponse<T>
{
    public bool Success { get; set; }
    public IEnumerable<T> Data { get; set; } = new List<T>();
    public PaginationInfo? Pagination { get; set; }
}