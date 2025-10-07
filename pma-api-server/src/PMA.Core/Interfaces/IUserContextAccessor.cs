using PMA.Core.Models;

namespace PMA.Core.Interfaces
{
    public interface IUserContextAccessor
    {
        UserContext? Current { get; }
        Task<UserContext> GetUserContextAsync();
    }
}
