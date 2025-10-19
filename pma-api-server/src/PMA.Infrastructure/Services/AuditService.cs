using PMA.Core.Entities;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace PMA.Infrastructure.Services;

/// <summary>
/// Service for managing audit log operations
/// </summary>
public interface IAuditService
{
    /// <summary>
    /// Gets all change groups for a specific entity
    /// </summary>
    System.Threading.Tasks.Task<IEnumerable<ChangeGroup>> GetEntityChangesAsync(string entityType, int entityId);

    /// <summary>
    /// Gets all change groups for an entity within a date range
    /// </summary>
    System.Threading.Tasks.Task<IEnumerable<ChangeGroup>> GetEntityChangesAsync(string entityType, int entityId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Gets recent changes across all entities
    /// </summary>
    System.Threading.Tasks.Task<IEnumerable<ChangeGroup>> GetRecentChangesAsync(int limit = 100);

    /// <summary>
    /// Gets all changes made by a specific user
    /// </summary>
    System.Threading.Tasks.Task<IEnumerable<ChangeGroup>> GetChangesByUserAsync(string username);

    /// <summary>
    /// Deletes old audit log entries (older than specified days)
    /// </summary>
    System.Threading.Tasks.Task<int> DeleteOldAuditLogsAsync(int olderThanDays);
}

/// <inheritdoc />
public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;

    public AuditService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task<IEnumerable<ChangeGroup>> GetEntityChangesAsync(string entityType, int entityId)
    {
        return await System.Threading.Tasks.Task.FromResult(
            _context.ChangeGroups
                .Where(cg => cg.EntityType == entityType && cg.EntityId == entityId)
                .Include(cg => cg.Items)
                .OrderByDescending(cg => cg.ChangedAt)
                .ToList()
        );
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task<IEnumerable<ChangeGroup>> GetEntityChangesAsync(string entityType, int entityId, DateTime startDate, DateTime endDate)
    {
        return await System.Threading.Tasks.Task.FromResult(
            _context.ChangeGroups
                .Where(cg => cg.EntityType == entityType 
                    && cg.EntityId == entityId 
                    && cg.ChangedAt >= startDate 
                    && cg.ChangedAt <= endDate)
                .Include(cg => cg.Items)
                .OrderByDescending(cg => cg.ChangedAt)
                .ToList()
        );
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task<IEnumerable<ChangeGroup>> GetRecentChangesAsync(int limit = 100)
    {
        return await System.Threading.Tasks.Task.FromResult(
            _context.ChangeGroups
                .Include(cg => cg.Items)
                .OrderByDescending(cg => cg.ChangedAt)
                .Take(limit)
                .ToList()
        );
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task<IEnumerable<ChangeGroup>> GetChangesByUserAsync(string username)
    {
        return await System.Threading.Tasks.Task.FromResult(
            _context.ChangeGroups
                .Where(cg => cg.ChangedBy == username)
                .Include(cg => cg.Items)
                .OrderByDescending(cg => cg.ChangedAt)
                .ToList()
        );
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task<int> DeleteOldAuditLogsAsync(int olderThanDays)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-olderThanDays);
        
        var itemsToDelete = _context.ChangeItems
            .Where(ci => ci.ChangeGroup.ChangedAt < cutoffDate)
            .ToList();

        _context.ChangeItems.RemoveRange(itemsToDelete);

        var groupsToDelete = _context.ChangeGroups
            .Where(cg => cg.ChangedAt < cutoffDate)
            .ToList();

        _context.ChangeGroups.RemoveRange(groupsToDelete);

        return await System.Threading.Tasks.Task.FromResult(await _context.SaveChangesAsync());
    }
}
