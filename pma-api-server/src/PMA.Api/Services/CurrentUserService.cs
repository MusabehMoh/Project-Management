using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using PMA.Core.Interfaces;
using PMA.Core.Models;

namespace PMA.Api.Services
{
    /// <summary>
    /// Legacy service - use IUserContextAccessor instead for new code
    /// </summary>
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IUserContextAccessor _userContextAccessor;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IUserContextAccessor userContextAccessor, IHttpContextAccessor httpContextAccessor)
        {
            _userContextAccessor = userContextAccessor;
            _httpContextAccessor = httpContextAccessor;
        }

        public ClaimsPrincipal? Principal => _httpContextAccessor.HttpContext?.User;

        public string? UserName => _userContextAccessor.Current?.UserName;

        public bool IsAuthenticated => _userContextAccessor.Current?.IsAuthenticated ?? false;

        public async Task<string?> GetCurrentUserPrsIdAsync()
        {
            var context = await _userContextAccessor.GetUserContextAsync();
            return context.IsAuthenticated ? context.PrsId : null;
        }
    }
}