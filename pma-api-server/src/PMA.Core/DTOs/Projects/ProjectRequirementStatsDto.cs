namespace PMA.Core.DTOs;

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