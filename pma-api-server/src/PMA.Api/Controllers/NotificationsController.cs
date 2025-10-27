using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ApiBaseController
{
    private readonly INotificationService _notificationService;
    private readonly IHubContext<PMA.Api.Hubs.NotificationHub> _hubContext;

    public NotificationsController(
        INotificationService notificationService,
        IHubContext<PMA.Api.Hubs.NotificationHub> hubContext)
    {
        _notificationService = notificationService;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Get all notifications with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? userId = null,
        [FromQuery] bool? isRead = null)
    {
        try
        {
            var (notifications, totalCount) = await _notificationService.GetNotificationsAsync(page, limit, userId, isRead);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(notifications, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Notification>>("An error occurred while retrieving notifications", ex.Message);
        }
    }

    /// <summary>
    /// Get notification by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetNotificationById(int id)
    {
        try
        {
            var notification = await _notificationService.GetNotificationByIdAsync(id);
            if (notification == null)
            {
                var notFoundResponse = new ApiResponse<Notification>
                {
                    Success = false,
                    Message = "Notification not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<Notification>
            {
                Success = true,
                Data = notification
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<Notification>
            {
                Success = false,
                Message = "An error occurred while retrieving the notification",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get notifications for a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetNotificationsByUser(int userId)
    {
        try
        {
            var notifications = await _notificationService.GetNotificationsByUserAsync(userId);
            var response = new ApiResponse<IEnumerable<Notification>>
            {
                Success = true,
                Data = notifications
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<Notification>>
            {
                Success = false,
                Message = "An error occurred while retrieving user notifications",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Create a new notification
    /// </summary>
    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateNotification([FromBody] Notification notification)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<Notification>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            var createdNotification = await _notificationService.CreateNotificationAsync(notification);
            var response = new ApiResponse<Notification>
            {
                Success = true,
                Data = createdNotification,
                Message = "Notification created successfully"
            };
            
            return CreatedAtAction(nameof(GetNotificationById), new { id = createdNotification.Id }, response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<Notification>
            {
                Success = false,
                Message = "An error occurred while creating the notification",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Update an existing notification
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateNotification(int id, [FromBody] Notification notification)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var validationResponse = new ApiResponse<Notification>
                {
                    Success = false,
                    Message = "Validation failed",
                    Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                };
                return BadRequest(validationResponse);
            }

            if (id != notification.Id)
            {
                var mismatchResponse = new ApiResponse<Notification>
                {
                    Success = false,
                    Message = "ID mismatch"
                };
                return BadRequest(mismatchResponse);
            }

            var updatedNotification = await _notificationService.UpdateNotificationAsync(notification);
            if (updatedNotification == null)
            {
                var notFoundResponse = new ApiResponse<Notification>
                {
                    Success = false,
                    Message = "Notification not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<Notification>
            {
                Success = true,
                Data = updatedNotification,
                Message = "Notification updated successfully"
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<Notification>
            {
                Success = false,
                Message = "An error occurred while updating the notification",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    [HttpPut("{id}/read")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        try
        {
            var result = await _notificationService.MarkAsReadAsync(id);
            if (!result)
            {
                var notFoundResponse = new ApiResponse<object>
                {
                    Success = false,
                    Message = "Notification not found"
                };
                return NotFound(notFoundResponse);
            }
            
            var response = new ApiResponse<object>
            {
                Success = true,
                Message = "Notification marked as read"
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while marking notification as read",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        try
        {
            var result = await _notificationService.DeleteNotificationAsync(id);
            if (!result)
            {
                var notFoundResponse = new ApiResponse<object>
                {
                    Success = false,
                    Message = "Notification not found"
                };
                return NotFound(notFoundResponse);
            }
            
            return NoContent();
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting the notification",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Get urgent/high-priority notifications for UrgentNotifications component
    /// Returns notifications marked as urgent, critical, overdue, or high priority
    /// </summary>
    [HttpGet("urgent")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetUrgentNotifications(
        [FromQuery] int? userId = null,
        [FromQuery] int limit = 5)
    {
        try
        {
            // Get recent notifications (last 30 days) filtered by urgent types
            var (allNotifications, _) = await _notificationService.GetNotificationsAsync(
                page: 1, 
                limit: 100, // Get more to filter
                userId: userId, 
                isRead: null
            );

            // Define urgent notification types/patterns
            var urgentKeywords = new[] { 
                "URGENT", "CRITICAL", "OVERDUE", "HIGH_PRIORITY", 
                "DEADLINE", "EMERGENCY", "IMMEDIATE" 
            };

            // Filter for urgent notifications
            var urgentNotifications = allNotifications
                .Where(n => urgentKeywords.Any(keyword => 
                    //n.Type.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                    n.Message.Contains(keyword, StringComparison.OrdinalIgnoreCase)))
                .OrderByDescending(n => n.CreatedAt)
                .Take(limit)
                .ToList();

            var response = new ApiResponse<IEnumerable<Notification>>
            {
                Success = true,
                Data = urgentNotifications,
                Message = "Urgent notifications retrieved successfully"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<IEnumerable<Notification>>
            {
                Success = false,
                Message = "An error occurred while retrieving urgent notifications",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Send a test push notification via SignalR
    /// </summary>
    [HttpPost("test-push")]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    public async Task<IActionResult> SendTestPushNotification()
    {
        try
        {
            // Send notification to a specific username
            //await _hubContext.Clients.Group($"user_hamdb").SendAsync("Notification",
            //    new
            //    {
            //        type = "NOTIFICATION_TYPE",
            //        message = "Your message here",
            //        timestamp = DateTime.Now,
            //        projectId = 123
            //    });
            var testNotification = new
            {
                type = "TEST_NOTIFICATION",
                message = "This is a test push notification sent on page load!",
                timestamp = DateTime.Now,
                projectId = (int?)null,
                targetUsernames = (string[]?)null,
                targetUserIds = (int[]?)null
            };

            // Send to all connected clients
            await _hubContext.Clients.All.SendAsync("Notification", testNotification);

            var response = new ApiResponse<object>
            {
                Success = true,
                Message = "Test push notification sent successfully",
                Data = new { sentAt = DateTime.Now }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            var errorResponse = new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while sending test notification",
                Error = ex.Message
            };
            return StatusCode(500, errorResponse);
        }
    }
}