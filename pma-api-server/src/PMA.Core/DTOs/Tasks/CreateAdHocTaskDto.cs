using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class CreateAdHocTaskDto
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "StartDate is required")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "EndDate is required")]
    public DateTime EndDate { get; set; }

    [Required(ErrorMessage = "Priority is required")]
    public int Priority { get; set; }

    [Required(ErrorMessage = "At least one member must be assigned")]
    public List<int> AssignedMembers { get; set; } = new List<int>();
}