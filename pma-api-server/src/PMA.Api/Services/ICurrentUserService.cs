using System.Security.Claims;

namespace PMA.Api.Services
{
    /// <summary>
    /// Legacy interface - use IUserContextAccessor instead for new code
    /// </summary>
    public interface ICurrentUserService
    {
        string? UserName { get; }
        ClaimsPrincipal? Principal { get; }
        bool IsAuthenticated { get; }
        Task<string?> GetCurrentUserPrsIdAsync();
    }
}