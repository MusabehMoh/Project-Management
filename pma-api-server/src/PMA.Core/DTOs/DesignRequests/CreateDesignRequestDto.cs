using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class CreateDesignRequestDto
{
    [Required]
    public int TaskId { get; set; }

    public string? Notes { get; set; }

    public int? AssignedToPrsId { get; set; }

    public int? Status { get; set; }

    public DateTime? DueDate { get; set; }
}