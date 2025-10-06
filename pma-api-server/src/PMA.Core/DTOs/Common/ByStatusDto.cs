namespace PMA.Core.DTOs;

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