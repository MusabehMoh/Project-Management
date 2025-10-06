namespace PMA.Core.DTOs;

public class TaskPriorityDto
{
    public int Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}