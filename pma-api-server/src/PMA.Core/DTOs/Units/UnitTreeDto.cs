namespace PMA.Core.DTOs;

public class UnitTreeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentId { get; set; }
    public int Level { get; set; }
    public string Path { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<UnitTreeDto> Children { get; set; } = new();
    public bool HasChildren { get; set; }
    public bool? IsExpanded { get; set; }
    public bool? IsLoading { get; set; }
}