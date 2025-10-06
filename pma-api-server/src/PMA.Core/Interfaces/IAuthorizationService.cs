using PMA.Core.Entities;

namespace PMA.Core.Interfaces
{
    public interface IAuthorizationService
    {
        /// <summary>
        /// Check if the current user has a specific role
        /// </summary>
        Task<bool> HasRoleAsync(string roleName);

        /// <summary>
        /// Check if the current user has a specific permission
        /// </summary>
        Task<bool> HasPermissionAsync(string resource, string action);

        /// <summary>
        /// Check if the current user has any of the specified roles
        /// </summary>
        Task<bool> HasAnyRoleAsync(params string[] roleNames);

        /// <summary>
        /// Check if the current user has any of the specified permissions
        /// </summary>
        Task<bool> HasAnyPermissionAsync(IEnumerable<(string resource, string action)> permissions);

        /// <summary>
        /// Get all roles for the current user
        /// </summary>
        Task<IEnumerable<string>> GetUserRolesAsync();

        /// <summary>
        /// Get all permissions for the current user
        /// </summary>
        Task<IEnumerable<Permission>> GetUserPermissionsAsync();

        /// <summary>
        /// Check if the current user is an administrator
        /// </summary>
        Task<bool> IsAdministratorAsync();

        /// <summary>
        /// Check if the current user can access a specific resource
        /// </summary>
        Task<bool> CanAccessResourceAsync(string resource, string requiredAction = "read");
    }
}