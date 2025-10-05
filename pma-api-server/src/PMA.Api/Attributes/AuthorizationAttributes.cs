using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PMA.Core.Interfaces;

namespace PMA.Api.Attributes
{
    /// <summary>
    /// Attribute to require specific roles
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public class RequireRoleAttribute : Attribute, IAsyncAuthorizationFilter
    {
        private readonly string[] _roles;

        public RequireRoleAttribute(params string[] roles)
        {
            _roles = roles;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var authorizationService = context.HttpContext.RequestServices.GetRequiredService<IAuthorizationService>();

            var hasRole = await authorizationService.HasAnyRoleAsync(_roles);
            if (!hasRole)
            {
                context.Result = new ForbidResult();
            }
        }
    }

    /// <summary>
    /// Attribute to require specific permissions
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public class RequirePermissionAttribute : Attribute, IAsyncAuthorizationFilter
    {
        private readonly string _resource;
        private readonly string _action;

        public RequirePermissionAttribute(string resource, string action = "read")
        {
            _resource = resource;
            _action = action;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var authorizationService = context.HttpContext.RequestServices.GetRequiredService<IAuthorizationService>();

            var hasPermission = await authorizationService.HasPermissionAsync(_resource, _action);
            if (!hasPermission)
            {
                context.Result = new ForbidResult();
            }
        }
    }

    /// <summary>
    /// Attribute to require administrator role
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class RequireAdminAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var authorizationService = context.HttpContext.RequestServices.GetRequiredService<IAuthorizationService>();

            var isAdmin = await authorizationService.IsAdministratorAsync();
            if (!isAdmin)
            {
                context.Result = new ForbidResult();
            }
        }
    }
}