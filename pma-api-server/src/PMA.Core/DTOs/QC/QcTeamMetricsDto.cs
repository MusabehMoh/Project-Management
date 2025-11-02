namespace PMA.Core.DTOs.QC;

/// <summary>
/// QC team performance metrics
/// </summary>
public class QcTeamMetricsDto
{
    public int TotalQcMembers { get; set; }
    public int ActiveQcMembers { get; set; }
    public double AverageEfficiency { get; set; }
    public int TotalTasksCompleted { get; set; }
    public int TotalTasksInProgress { get; set; }
    public double AverageTaskCompletionTime { get; set; }
}