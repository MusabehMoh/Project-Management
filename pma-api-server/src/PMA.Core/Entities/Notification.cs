using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMA.Core.Entities;

public class Notification
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;

    [Required]
    public NotificationType Type { get; set; }

    [Required]
    public NotificationPriority Priority { get; set; }

    public int? UserId { get; set; }

    [Required]
    public bool IsRead { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    public DateTime? ReadAt { get; set; }

    // Navigation property
    [ForeignKey("UserId")]
    public User? User { get; set; }
}

public enum NotificationType
{
    Info = 1,
    Warning = 2,
    Error = 3,
    Success = 4
}

public enum NotificationPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}


