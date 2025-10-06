using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class UpdateTimelineDto
{
    [MaxLength(50, ErrorMessage = "TreeId cannot exceed 50 characters")]
    public string? TreeId { get; set; }

    public int? ProjectId { get; set; }
    public int? ProjectRequirementId { get; set; }

    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string? Name { get; set; }

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}