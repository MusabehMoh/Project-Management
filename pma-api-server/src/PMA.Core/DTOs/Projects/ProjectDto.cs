using PMA.Core.Entities;
using PMA.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace PMA.Core.DTOs;

public class ProjectDto
{
    public int Id { get; set; }
    public string ApplicationName { get; set; } = string.Empty;
    public string ProjectOwner { get; set; } = string.Empty;
    public string? AlternativeOwner { get; set; }
    public string OwningUnit { get; set; } = string.Empty;
    public int ProjectOwnerId { get; set; }
    public int? AlternativeOwnerId { get; set; }
    public int OwningUnitId { get; set; }
    public string? CreatebBy { get; set; }
    public List<int> AnalystIds { get; set; } = new List<int>();
    public DateTime StartDate { get; set; }
    public DateTime ExpectedCompletionDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Priority Priority { get; set; } 
    public int Progress { get; set; }
}