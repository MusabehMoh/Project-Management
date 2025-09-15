using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

public class Role
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public bool IsActive { get; set; }

    [Required]
    public int RoleOrder { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<UserRole>? UserRoles { get; set; }
    public ICollection<RoleAction>? RoleActions { get; set; }
}

public class UserRole
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int RoleId { get; set; }

    [Required]
    public bool IsActive { get; set; }

    [Required]
    public DateTime AssignedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public User? User { get; set; }

    [ForeignKey("RoleId")]
    public Role? Role { get; set; }
}

public class UserAction
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int ActionId { get; set; }

    [Required]
    public bool IsActive { get; set; }

    [Required]
    public DateTime AssignedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public User? User { get; set; }

    [ForeignKey("ActionId")]
    public Permission? Permission { get; set; }
}

public class RoleAction
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int RoleId { get; set; }

    [Required]
    public int ActionId { get; set; }

    [Required]
    public DateTime AssignedAt { get; set; }

    // Navigation properties
    [ForeignKey("RoleId")]
    public Role? Role { get; set; }

    [ForeignKey("ActionId")]
    public Permission? Permission { get; set; }
}


