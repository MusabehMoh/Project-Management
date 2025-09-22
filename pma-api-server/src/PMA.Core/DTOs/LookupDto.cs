namespace PMA.Core.DTOs;

public class LookupDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public int Value { get; set; }
    public bool IsActive { get; set; }
}