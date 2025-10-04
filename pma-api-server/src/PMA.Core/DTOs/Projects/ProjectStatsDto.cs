namespace PMA.Core.DTOs;

public class ProjectStatsDto
{
    public int Total { get; set; }
    public int New { get; set; }
    public int Delayed { get; set; }
    public int UnderReview { get; set; }
    public int UnderDevelopment { get; set; }
    public int Production { get; set; }
}