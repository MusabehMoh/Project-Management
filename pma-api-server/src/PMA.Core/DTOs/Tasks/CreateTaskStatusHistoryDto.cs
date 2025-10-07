using PMA.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs.Tasks;

public class CreateTaskStatusHistoryDto
{
    [Required(ErrorMessage = "TaskId is required")]
    public int TaskId { get; set; }

    [Required(ErrorMessage = "NewStatus is required")]
    public PMA.Core.Enums.TaskStatus NewStatus { get; set; }

    public string? Comment { get; set; }
}