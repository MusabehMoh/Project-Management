using Microsoft.AspNetCore.Mvc;
using PMA.Core.DTOs;
using PMA.Infrastructure.Services;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditService _auditService;
    private readonly ILogger<AuditLogsController> _logger;

    public AuditLogsController(IAuditService auditService, ILogger<AuditLogsController> logger)
    {
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Get all changes for a specific entity
    /// </summary>
    /// <param name="entityType">The type of entity (e.g., 'Task', 'ProjectRequirement')</param>
    /// <param name="entityId">The ID of the entity</param>
    /// <returns>List of change groups for the entity</returns>
    [HttpGet("entity/{entityType}/{entityId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEntityChanges(string entityType, int entityId)
    {
        try
        {
            var changes = await _auditService.GetEntityChangesAsync(entityType, entityId);
            var dtos = changes.Select(MapToDto).ToList();
            
            return Ok(new { entityType, entityId, changes = dtos });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving changes for {EntityType} {EntityId}", entityType, entityId);
            return StatusCode(500, new { message = "An error occurred while retrieving changes" });
        }
    }

    /// <summary>
    /// Get changes for a specific entity within a date range
    /// </summary>
    [HttpGet("entity/{entityType}/{entityId:int}/range")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEntityChangesInRange(
        string entityType, 
        int entityId, 
        [FromQuery] DateTime startDate, 
        [FromQuery] DateTime endDate)
    {
        try
        {
            var changes = await _auditService.GetEntityChangesAsync(entityType, entityId, startDate, endDate);
            var dtos = changes.Select(MapToDto).ToList();
            
            return Ok(new { entityType, entityId, startDate, endDate, changes = dtos });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving changes for {EntityType} {EntityId} in range", entityType, entityId);
            return StatusCode(500, new { message = "An error occurred while retrieving changes" });
        }
    }

    /// <summary>
    /// Get recent changes across all entities
    /// </summary>
    /// <param name="limit">Maximum number of recent changes to retrieve (default: 100)</param>
    [HttpGet("recent")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecentChanges([FromQuery] int limit = 100)
    {
        try
        {
            if (limit < 1 || limit > 1000)
                limit = 100;

            var changes = await _auditService.GetRecentChangesAsync(limit);
            var dtos = changes.Select(MapToDto).ToList();
            
            return Ok(new { limit, total = dtos.Count, changes = dtos });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving recent changes");
            return StatusCode(500, new { message = "An error occurred while retrieving changes" });
        }
    }

    /// <summary>
    /// Get all changes made by a specific user
    /// </summary>
    /// <param name="username">The username of the user who made changes</param>
    [HttpGet("user/{username}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChangesByUser(string username)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest(new { message = "Username is required" });

            var changes = await _auditService.GetChangesByUserAsync(username);
            var dtos = changes.Select(MapToDto).ToList();
            
            return Ok(new { username, total = dtos.Count, changes = dtos });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving changes by user {Username}", username);
            return StatusCode(500, new { message = "An error occurred while retrieving changes" });
        }
    }

    /// <summary>
    /// Delete audit logs older than specified number of days
    /// </summary>
    /// <param name="olderThanDays">Number of days to keep (delete records older than this)</param>
    [HttpDelete("cleanup")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> CleanupOldLogs([FromQuery] int olderThanDays = 90)
    {
        try
        {
            if (olderThanDays < 1 || olderThanDays > 3650)
                olderThanDays = 90;

            var deletedCount = await _auditService.DeleteOldAuditLogsAsync(olderThanDays);
            
            return Ok(new { message = $"Deleted {deletedCount} audit log entries older than {olderThanDays} days" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up old audit logs");
            return StatusCode(500, new { message = "An error occurred while cleaning up audit logs" });
        }
    }

    /// <summary>
    /// Map ChangeGroup entity to DTO
    /// </summary>
    private ChangeGroupDto MapToDto(PMA.Core.Entities.ChangeGroup changeGroup)
    {
        return new ChangeGroupDto
        {
            Id = changeGroup.Id,
            EntityType = changeGroup.EntityType,
            EntityId = changeGroup.EntityId,
            ChangedBy = changeGroup.ChangedBy,
            ChangedAt = changeGroup.ChangedAt,
            Items = changeGroup.Items.Select(item => new ChangeItemDto
            {
                Id = item.Id,
                ChangeGroupId = item.ChangeGroupId,
                FieldName = item.FieldName,
                OldValue = item.OldValue,
                NewValue = item.NewValue
            }).ToList()
        };
    }
}
