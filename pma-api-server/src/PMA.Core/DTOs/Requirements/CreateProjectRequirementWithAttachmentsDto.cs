using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

/// <summary>
/// DTO for creating a project requirement with attachments via multipart/form-data
/// </summary>
public class CreateProjectRequirementWithAttachmentsDto
{
    [Required(ErrorMessage = "Project ID is required")]
    public int ProjectId { get; set; }

    [Required(ErrorMessage = "Requirement name is required")]
    [StringLength(500, ErrorMessage = "Name cannot exceed 500 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Priority is required")]
    [Range(1, 3, ErrorMessage = "Priority must be between 1 (Low) and 3 (High)")]
    public int Priority { get; set; }

    [Required(ErrorMessage = "Type is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Type must be a valid requirement type")]
    public int Type { get; set; }

    public DateTime? ExpectedCompletionDate { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Status must be a valid requirement status")]
    public int? Status { get; set; }

    /// <summary>
    /// Optional file attachments (multipart/form-data)
    /// </summary>
    public List<IFormFile>? Files { get; set; }
}
