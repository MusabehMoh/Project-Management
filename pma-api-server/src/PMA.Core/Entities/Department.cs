using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace PMA.Core.Entities;

public class Department
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public bool IsActive { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<User>? Users { get; set; }
    public ICollection<Task>? Tasks { get; set; }
    public ICollection<Team>? Teams { get; set; }
}

public class Team
{
    [Key]
    public int Id { get; set; }

  
    public int? PrsId { get; set; } // Employee ID

    [Required]
    public int DepartmentId { get; set; }

    [Required]
    public DateTime JoinDate { get; set; }

    public string? UserName { get; set; } = string.Empty;
    public string? FullName { get; set; } = string.Empty;

    [Required]
    public bool IsActive { get; set; } 
    public int? CreatedBy { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("PrsId")]
    public Employee? Employee { get; set; }

    [ForeignKey("DepartmentId")]
    public Department? Department { get; set; }
     
}

public class Unit
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string? Name { get; set; } = string.Empty; 

    [Required]
    [MaxLength(20)]
    public string? Code { get; set; } = string.Empty;

    public string? Description { get; set; } = string.Empty;

    public int? ParentId { get; set; }

    public int Level { get; set; } = 0;

    [MaxLength(500)]
    public string? Path { get; set; } = string.Empty;

    [Required]
    public bool IsActive { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    [JsonIgnore]
    public Unit? Parent { get; set; }

    [JsonIgnore]
    public ICollection<Unit>? Children { get; set; }

    [JsonIgnore]
    public ICollection<Project>? Projects { get; set; }
}


