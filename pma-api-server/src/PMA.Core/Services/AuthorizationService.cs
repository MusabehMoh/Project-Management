using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Core.Services
{
    public class AuthorizationService : IAuthorizationService
    {
        private readonly ICurrentUserProvider _currentUserProvider;
        private readonly IUserService _userService;

        public AuthorizationService(
            ICurrentUserProvider currentUserProvider,
            IUserService userService)
        {
            _currentUserProvider = currentUserProvider;
            _userService = userService;
        }

        public async Task<bool> HasRoleAsync(string roleName)
        {
            if (!_currentUserProvider.IsAuthenticated)
                return false;

            var currentUser = await _userService.GetCurrentUserAsync();
            if (currentUser?.Roles == null)
                return false;

            return currentUser.Roles.Any(r => r.Code == roleName && r.IsActive);
        }

        public async Task<bool> HasPermissionAsync(string resource, string action)
        {
            if (!_currentUserProvider.IsAuthenticated)
                return false;

            var currentUser = await _userService.GetCurrentUserAsync();
            if (currentUser == null)
                return false;

            var permissionName = $"{resource}";

            // Check direct user permissions
            if (currentUser.Actions?.Any(a => a.Name == permissionName && a.IsActive) == true)
            {
                return true;
            }

            // Check role-based permissions
            if (currentUser.Roles?.Any(r =>
                r.Actions?.Any(a => a.Name == permissionName && a.IsActive) == true) == true)
            {
                return true;
            }

            return false;
        }

        public async Task<bool> HasAnyRoleAsync(params string[] roleNames)
        {
            foreach (var roleName in roleNames)
            {
                if (await HasRoleAsync(roleName))
                    return true;
            }
            return false;
        }

        public async Task<bool> HasAnyPermissionAsync(IEnumerable<(string resource, string action)> permissions)
        {
            foreach (var (resource, action) in permissions)
            {
                if (await HasPermissionAsync(resource, action))
                    return true;
            }
            return false;
        }

        public async Task<IEnumerable<string>> GetUserRolesAsync()
        {
            if (!_currentUserProvider.IsAuthenticated)
                return Enumerable.Empty<string>();

            var currentUser = await _userService.GetCurrentUserAsync();
            if (currentUser?.Roles == null)
                return Enumerable.Empty<string>();

            return currentUser.Roles.Where(r => r.IsActive).Select(r => r.Name);
        }

        public async Task<IEnumerable<Permission>> GetUserPermissionsAsync()
        {
            if (!_currentUserProvider.IsAuthenticated)
                return Enumerable.Empty<Permission>();

            var currentUser = await _userService.GetCurrentUserAsync();
            if (currentUser == null)
                return Enumerable.Empty<Permission>();

            var permissions = new HashSet<Permission>();

            // Add direct user permissions
            if (currentUser.Actions != null)
            {
                foreach (var action in currentUser.Actions.Where(a => a.IsActive))
                {
                    // Convert ActionDto back to Permission entity
                    permissions.Add(new Permission
                    {
                        Id = action.Id,
                        Name = action.Name,
                        Description = action.Description,
                        Category = action.Category,
                        IsActive = action.IsActive
                    });
                }
            }

            // Add role-based permissions
            if (currentUser.Roles != null)
            {
                foreach (var role in currentUser.Roles.Where(r => r.IsActive))
                {
                    if (role.Actions != null)
                    {
                        foreach (var action in role.Actions.Where(a => a.IsActive))
                        {
                            permissions.Add(new Permission
                            {
                                Id = action.Id,
                                Name = action.Name,
                                Description = action.Description,
                                Category = action.Category,
                                IsActive = action.IsActive
                            });
                        }
                    }
                }
            }

            return permissions;
        }

        public async Task<bool> IsAdministratorAsync()
        {
            return await HasRoleAsync("Administrator") || await HasRoleAsync("Admin");
        }

        public async Task<bool> CanAccessResourceAsync(string resource, string requiredAction = "read")
        {
            return await HasPermissionAsync(resource, requiredAction);
        }
    }
}