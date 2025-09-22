using System.Security.Claims;

namespace PMA.Core.Interfaces
{
    public interface ICurrentUserProvider
    {
        string? UserName { get; }
        ClaimsPrincipal? Principal { get; }
        bool IsAuthenticated { get; }
        Task<string?> GetCurrentUserPrsIdAsync();
    }
}
