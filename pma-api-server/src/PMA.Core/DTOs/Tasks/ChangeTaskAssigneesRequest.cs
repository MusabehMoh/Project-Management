using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs.Tasks;

public class ChangeTaskAssigneesRequest
{
    [Required(ErrorMessage = "Assignee IDs are required")]
    [MinLength(1, ErrorMessage = "At least one assignee must be specified")]
    public List<string> AssigneeIds { get; set; } = new List<string>();

    [MaxLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
    public string? Notes { get; set; }
}