using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class MoveTaskDto
{
    [Required(ErrorMessage = "MoveDays is required")]
    public int MoveDays { get; set; }
}