using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class MoveTaskToSprintDto
{
    [Required(ErrorMessage = "TargetSprintId is required")]
    public int TargetSprintId { get; set; }
}