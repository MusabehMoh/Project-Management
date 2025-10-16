using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace PMA.Core.Entities;

public class User
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    public int PrsId { get; set; }

    [Required]
    public bool IsActive { get; set; }

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string MilitaryNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string GradeName { get; set; } = string.Empty;
     
   
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

 
    [MaxLength(50)]
    public string Phone { get; set; } = string.Empty;

 
   
    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("PrsId")]
    public Employee? Employee { get; set; }
    public int? DepartmentId { get; set; }

    [ForeignKey("DepartmentId")]
    public Department? Department { get; set; }
    public ICollection<UserRole>? UserRoles { get; set; }
    public ICollection<UserAction>? UserActions { get; set; } 
}

public class Employee
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string MilitaryNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string GradeName { get; set; } = string.Empty;

    [Required]
    public int StatusId { get; set; }
     
    // Navigation property
    public User? User { get; set; }
}


