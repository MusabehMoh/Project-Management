namespace PMA.Core.DTOs;

public class ProjectWithTimelinesDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int TimelineCount { get; set; }
    public List<TimelineWithSprintsDto> Timelines { get; set; } = new List<TimelineWithSprintsDto>();
}