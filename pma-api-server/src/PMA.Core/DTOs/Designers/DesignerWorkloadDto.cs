namespace PMA.Core.DTOs.Designers;

/// <summary>
/// Designer workload information
/// </summary>
public class DesignerWorkloadDto
{
    public int PrsId { get; set; }
    public string DesignerName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public int CurrentTasksCount { get; set; }
    public int CompletedTasksCount { get; set; }
    public double AverageTaskCompletionTime { get; set; }
    public double Efficiency { get; set; }
    public double WorkloadPercentage { get; set; }
    public double AvailableHours { get; set; }
    public string Status { get; set; } = string.Empty;
}
