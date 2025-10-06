using PMA.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class UpdateSprintDto
{
    [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string? Name { get; set; }

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public SprintStatus? Status { get; set; }
}