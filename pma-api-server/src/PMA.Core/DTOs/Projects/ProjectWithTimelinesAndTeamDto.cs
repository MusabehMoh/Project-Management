namespace PMA.Core.DTOs;

public class ProjectWithTimelinesAndTeamDto
{
    public int Id { get; set; }
    public string ApplicationName { get; set; } = string.Empty;
    public int Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? ExpectedCompletionDate { get; set; }
    public decimal? Budget { get; set; }
    public int Progress { get; set; }
    public bool HasTimeline { get; set; }
    public int TimelineCount { get; set; }
    public int TaskCount { get; set; }
    public List<ProjectTeamMemberDto> TeamMembers { get; set; } = new List<ProjectTeamMemberDto>();
}

public class ProjectTeamMemberDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public string MilitaryNumber { get; set; } = string.Empty;
    public string? Avatar { get; set; }
}
