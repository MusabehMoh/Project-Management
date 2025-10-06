namespace PMA.Core.DTOs;

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