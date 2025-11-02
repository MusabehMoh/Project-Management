using PMA.Core.Interfaces;
using PMA.Core.Models;

namespace PMA.Api.Services
{
    /// <summary>
    /// Service for managing user impersonation sessions
    /// Stores impersonation state in session/memory
    /// </summary>
    public interface IImpersonationService
    {
        /// <summary>
        /// Start impersonating a user
        /// </summary>
        Task StartImpersonationAsync(string realUserName, string impersonatedUserName);

        /// <summary>
        /// Stop impersonating a user
        /// </summary>
        Task StopImpersonationAsync(string realUserName);

        /// <summary>
        /// Get impersonation info for a real user
        /// </summary>
        Task<ImpersonationInfo?> GetImpersonationAsync(string realUserName);

        /// <summary>
        /// Check if a user is currently impersonating
        /// </summary>
        Task<bool> IsImpersonatingAsync(string realUserName);
    }

    public class ImpersonationInfo
    {
        public string RealUserName { get; set; } = string.Empty;
        public string ImpersonatedUserName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
    }

    /// <summary>
    /// In-memory implementation of impersonation service
    /// Note: In production, consider using distributed cache (Redis) for multi-server scenarios
    /// </summary>
    public class ImpersonationService : IImpersonationService
    {
        // Key: RealUserName, Value: ImpersonationInfo
        private static readonly Dictionary<string, ImpersonationInfo> _impersonations = new();
        private static readonly object _lock = new();

        public Task StartImpersonationAsync(string realUserName, string impersonatedUserName)
        {
            lock (_lock)
            {
                _impersonations[realUserName] = new ImpersonationInfo
                {
                    RealUserName = realUserName,
                    ImpersonatedUserName = impersonatedUserName,
                    StartTime = DateTime.UtcNow
                };
            }
            return Task.CompletedTask;
        }

        public Task StopImpersonationAsync(string realUserName)
        {
            lock (_lock)
            {
                _impersonations.Remove(realUserName);
            }
            return Task.CompletedTask;
        }

        public Task<ImpersonationInfo?> GetImpersonationAsync(string realUserName)
        {
            lock (_lock)
            {
                _impersonations.TryGetValue(realUserName, out var impersonation);
                return Task.FromResult(impersonation);
            }
        }

        public async Task<bool> IsImpersonatingAsync(string realUserName)
        {
            var impersonation = await GetImpersonationAsync(realUserName);
            return impersonation != null;
        }
    }
}
