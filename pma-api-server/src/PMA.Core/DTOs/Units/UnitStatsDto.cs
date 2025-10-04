namespace PMA.Core.DTOs;

public class UnitStatsDto
{
    public int Total { get; set; }
    public int Active { get; set; }
    public int Inactive { get; set; }
    public int RootUnits { get; set; }
    public int MaxLevel { get; set; }
}