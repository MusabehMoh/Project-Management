namespace PMA.Core.DTOs;

public class TimelineWithSprintsDto : TimelineDto
{
    public List<SprintDto> Sprints { get; set; } = new List<SprintDto>();
}