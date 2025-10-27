using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class PostponeRequirementDto
{
    [Required]
    [StringLength(500, ErrorMessage = "Postpone reason cannot exceed 500 characters")]
    public string Reason { get; set; } = string.Empty;
}