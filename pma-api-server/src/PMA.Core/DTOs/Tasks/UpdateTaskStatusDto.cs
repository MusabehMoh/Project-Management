using PMA.Core.Enums;
using System.ComponentModel.DataAnnotations;
using TaskStatusEnum = PMA.Core.Enums.TaskStatus;

namespace PMA.Core.DTOs;

public class UpdateTaskStatusDto
{
    [Required(ErrorMessage = "StatusId is required")]
    public TaskStatusEnum StatusId { get; set; }

    public string? Comment { get; set; }
}