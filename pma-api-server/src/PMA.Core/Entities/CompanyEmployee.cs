using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

[Table("CompanyEmployees")]
public class CompanyEmployee
{
    [Key]
    public int Id { get; set; }

    [MaxLength(500)]
    public string? UserName { get; set; }

    public int? MilitaryNumber { get; set; }

    [Required]
    [MaxLength(500)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? GradeName { get; set; }

    [MaxLength(500)]
    public string? CreatedBy { get; set; }

    [MaxLength(500)]
    public string? UpdatedBy { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}