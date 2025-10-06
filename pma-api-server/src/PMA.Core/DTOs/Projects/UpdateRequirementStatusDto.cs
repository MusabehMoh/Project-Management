using PMA.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class UpdateRequirementStatusDto
{
    [Required]
    public RequirementStatusEnum Status { get; set; }
}