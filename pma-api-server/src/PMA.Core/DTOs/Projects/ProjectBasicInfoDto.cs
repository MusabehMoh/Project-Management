namespace PMA.Core.DTOs;

public class ProjectBasicInfoDto
{
    public int Id { get; set; }
    public string ApplicationName { get; set; } = string.Empty;
    public string ProjectOwner { get; set; } = string.Empty;
    public string OwningUnit { get; set; } = string.Empty;
    public string? Analysts { get; set; }
    public List<int> AnalystIds { get; set; } = new List<int>();
}