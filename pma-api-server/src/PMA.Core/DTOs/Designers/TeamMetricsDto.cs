namespace PMA.Core.DTOs.Designers;

/// <summary>
/// Team-wide metrics for designer performance
/// </summary>
public class TeamMetricsDto
{
    public int TotalDesigners { get; set; }
    public int ActiveDesigners { get; set; }
    public double AverageEfficiency { get; set; }
    public int TotalTasksCompleted { get; set; }
    public int TotalTasksInProgress { get; set; }
    public double AverageTaskCompletionTime { get; set; }
}
