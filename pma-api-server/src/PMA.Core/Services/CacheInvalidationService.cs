using Microsoft.Extensions.Caching.Memory;
using PMA.Core.Interfaces;

namespace PMA.Core.Services;

/// <summary>
/// Service for managing cache invalidation across the application
/// </summary>
public class CacheInvalidationService : ICacheInvalidationService
{
    private readonly IMemoryCache _cache;

    public CacheInvalidationService(IMemoryCache cache)
    {
        _cache = cache;
    }

    /// <summary>
    /// Invalidates the current user cache for a specific username
    /// </summary>
    public void InvalidateCurrentUserCache(string username)
    {
        var cacheKey = GetCurrentUserCacheKey(username);
        _cache.Remove(cacheKey);
    }

    /// <summary>
    /// Invalidates the current user cache for a specific user ID
    /// </summary>
    public async Task InvalidateCurrentUserCacheByIdAsync(int userId, IUserRepository userRepository)
    {
        var user = await userRepository.GetByIdAsync(userId);
        if (user != null)
        {
            InvalidateCurrentUserCache(user.UserName);
        }
    }

    /// <summary>
    /// Invalidates all user-related caches (use sparingly)
    /// </summary>
    public void InvalidateAllUserCaches()
    {
        // Note: IMemoryCache doesn't have a clear all method
        // In a distributed cache scenario, we could use key patterns
        // For now, this is a placeholder for future enhancement
    }

    /// <summary>
    /// Gets the cache key for current user data
    /// </summary>
    public static string GetCurrentUserCacheKey(string username)
    {
        return $"currentuser:{username.ToLowerInvariant()}";
    }
}