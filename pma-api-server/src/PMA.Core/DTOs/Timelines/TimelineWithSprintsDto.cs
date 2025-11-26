namespace PMA.Core.DTOs;

public class TimelineWithSprintsDto : TimelineDto
{
    // Changed from Sprints to Tasks - now Timeline contains Tasks directly
    public List<TaskDto> Tasks { get; set; } = new List<TaskDto>();
}