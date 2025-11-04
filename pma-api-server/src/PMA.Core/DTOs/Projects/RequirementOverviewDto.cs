namespace PMA.Core.DTOs;

public class RequirementOverviewDto
{
    public NewRequirementsDto NewRequirements { get; set; } = new();
    public OngoingRequirementsDto OngoingRequirements { get; set; } = new();
    public int ActiveRequirements { get; set; }
    public int PendingApprovals { get; set; }
}

public class NewRequirementsDto
{
    public int Count { get; set; }
}

public class OngoingRequirementsDto
{
    public int Count { get; set; }
}
