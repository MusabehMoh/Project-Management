namespace PMA.Core.DTOs.QC;

/// <summary>
/// QC member workload information
/// </summary>
public class QcWorkloadDto
{
    public int PrsId { get; set; }
    public string QcName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public int CurrentTasksCount { get; set; }
    public int CompletedTasksCount { get; set; }
    public double AverageTaskCompletionTime { get; set; }
    public double Efficiency { get; set; }
    public double WorkloadPercentage { get; set; }
    public double AvailableHours { get; set; }
    public string Status { get; set; } = string.Empty;
}