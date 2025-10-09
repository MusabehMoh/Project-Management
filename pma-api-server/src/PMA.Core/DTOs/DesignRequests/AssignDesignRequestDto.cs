using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs.DesignRequests;

public class AssignDesignRequestDto
{
    [Required]
    public int AssignedToPrsId { get; set; }
    
    public string? Comment { get; set; }
}