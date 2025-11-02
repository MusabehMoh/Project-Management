using Microsoft.AspNetCore.Http;
using PMA.Core.Interfaces;
using PMA.Core.Models;
using System.Security.Principal;

namespace PMA.Api.Services
{
    public class UserContextAccessor : IUserContextAccessor
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserRepository _userRepository;
        private readonly IImpersonationService _impersonationService;
        private UserContext? _cachedContext;

        public UserContextAccessor(
            IHttpContextAccessor httpContextAccessor,
            IUserRepository userRepository,
            IImpersonationService impersonationService)
        {
            _httpContextAccessor = httpContextAccessor;
            _userRepository = userRepository;
            _impersonationService = impersonationService;
        }

        public UserContext? Current => _cachedContext;

        public async Task<UserContext> GetUserContextAsync()
        {
            if (_cachedContext != null)
                return _cachedContext;

            var httpContext = _httpContextAccessor.HttpContext;
            
            // Get the Windows authenticated user
            var realUserName = GetRealUserName(httpContext);
            
            if (string.IsNullOrWhiteSpace(realUserName))
            {
                _cachedContext = UserContext.Anonymous;
                return _cachedContext;
            }

            // Check if this user is currently impersonating
            var impersonation = await _impersonationService.GetImpersonationAsync(realUserName);
            var effectiveUserName = impersonation?.ImpersonatedUserName ?? realUserName;

            // Get the effective user from database
            var user = await _userRepository.GetByUserNameAsync(effectiveUserName);
            
            _cachedContext = new UserContext
            {
                RealUserName = realUserName,
                UserName = effectiveUserName,
                PrsId = user?.PrsId.ToString() ?? string.Empty,
                IsAuthenticated = true,
                IsImpersonating = impersonation != null
            };

            return _cachedContext;
        }

        /// <summary>
        /// Get the real Windows authenticated username
        /// Supports both IIdentity.Name and WindowsIdentity
        /// </summary>
        private string? GetRealUserName(HttpContext? httpContext)
        {
            if (httpContext?.User?.Identity?.IsAuthenticated != true)
                return null;

            // Try to get from WindowsIdentity first (more reliable for Windows Auth)
            var windowsIdentity = httpContext.User.Identity as WindowsIdentity;
            if (windowsIdentity?.User != null)
            {
                var windowsName = ExtractUserName(windowsIdentity.Name);
                if (!string.IsNullOrWhiteSpace(windowsName))
                    return windowsName;
            }

            // Fallback to standard Identity.Name
            var userName = ExtractUserName(httpContext.User.Identity.Name);
            return userName;
        }

        /// <summary>
        /// Extract username from domain\username format
        /// </summary>
        private string? ExtractUserName(string? name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return null;
            
            var idx = name.LastIndexOf('\\');
            return idx >= 0 && idx < name.Length - 1 ? name.Substring(idx + 1) : name;
        }
    }
}
