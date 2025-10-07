using Microsoft.AspNetCore.Http;
using PMA.Core.Interfaces;
using PMA.Core.Models;

namespace PMA.Api.Services
{
    public class UserContextAccessor : IUserContextAccessor
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserRepository _userRepository;
        private UserContext? _cachedContext;

        public UserContextAccessor(IHttpContextAccessor httpContextAccessor, IUserRepository userRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _userRepository = userRepository;
        }

        public UserContext? Current => _cachedContext;

        public async Task<UserContext> GetUserContextAsync()
        {
            if (_cachedContext != null)
                return _cachedContext;

            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.User?.Identity?.IsAuthenticated != true)
            {
                _cachedContext = UserContext.Anonymous;
                return _cachedContext;
            }

            var userName = ExtractUserName(httpContext.User.Identity.Name);
            if (string.IsNullOrWhiteSpace(userName))
            {
                _cachedContext = UserContext.Anonymous;
                return _cachedContext;
            }

            var user = await _userRepository.GetByUserNameAsync(userName);
            _cachedContext = new UserContext
            {
                PrsId = user?.PrsId.ToString() ?? string.Empty,
                UserName = userName,
                IsAuthenticated = true
            };

            return _cachedContext;
        }

        private string? ExtractUserName(string? name)
        {
            if (string.IsNullOrWhiteSpace(name)) return null;
            var idx = name.LastIndexOf('\\');
            return idx >= 0 && idx < name.Length - 1 ? name.Substring(idx + 1) : name;
        }
    }
}
