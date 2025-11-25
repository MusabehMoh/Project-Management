using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class ReturnRequirementDto
{
    [Required]
    [StringLength(500, ErrorMessage = "Return reason cannot exceed 500 characters")]
    public string Reason { get; set; } = string.Empty;
}
