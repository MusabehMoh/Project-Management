using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using PMA.Core.Interfaces;

namespace PMA.Api.Services
{
    public class CurrentUserService : ICurrentUserService, PMA.Core.Interfaces.ICurrentUserProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserRepository _userRepository;
        private string? _cachedPrsId;
        private bool _prsIdFetched;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor, IUserRepository userRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _userRepository = userRepository;
        }

        public ClaimsPrincipal? Principal => _httpContextAccessor.HttpContext?.User;

        public string? UserName
        {
            get
            {
                // For Windows/Negotiate auth the name often comes in the form DOMAIN\\username
                var name = Principal?.Identity?.Name;
                if (string.IsNullOrWhiteSpace(name))
                    return null;

                // If name contains a backslash (DOMAIN\username), return only the username part
                var idx = name.LastIndexOf('\\');
                if (idx >= 0 && idx < name.Length - 1)
                    return name.Substring(idx + 1);

                // Otherwise return the full name
                return name;
            }
        }

        public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

        public async Task<string?> GetCurrentUserPrsIdAsync()
        {
            if (!IsAuthenticated)
                return null;

            // Use cached value if already fetched during this request
            if (_prsIdFetched)
                return _cachedPrsId;

            var currentUserName = UserName;
            if (string.IsNullOrWhiteSpace(currentUserName))
            {
                _prsIdFetched = true;
                return null;
            }

            var currentUser = await _userRepository.GetByUserNameAsync(currentUserName);
            _cachedPrsId = currentUser?.PrsId.ToString();
            _prsIdFetched = true;

            return _cachedPrsId;
        }
    }
}