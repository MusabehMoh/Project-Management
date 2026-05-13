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

    /// <summary>
    /// Require Admin or ProjectManager role
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class RequireAdminOrPMAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var authorizationService = context.HttpContext.RequestServices.GetRequiredService<IAuthorizationService>();

            var isAdmin = await authorizationService.IsAdministratorAsync();
            var isPM = await authorizationService.HasRoleAsync("ProjectManager");
            if (!isAdmin && !isPM)
            {
                context.Result = new ForbidResult();
            }
        }
    }

    /// <summary>
    /// Require Admin or PM assigned to a specific project (projectId from route)
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class RequireProjectManageAccessAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var authorizationService = context.HttpContext.RequestServices.GetRequiredService<IAuthorizationService>();

            var isAdmin = await authorizationService.IsAdministratorAsync();
            if (isAdmin) return;

            var isPM = await authorizationService.HasRoleAsync("ProjectManager");
            if (!isPM)
            {
                context.Result = new ForbidResult();
                return;
            }

            // Check project assignment for PM
            if (context.RouteData.Values.TryGetValue("id", out var projectIdValue)
                && int.TryParse(projectIdValue?.ToString(), out int projectId))
            {
                var db = context.HttpContext.RequestServices
                    .GetRequiredService<PMA.Infrastructure.Data.ApplicationDbContext>();
                var userCtx = context.HttpContext.RequestServices
                    .GetRequiredService<PMA.Core.Interfaces.IUserContextAccessor>();
                var ctx = await userCtx.GetUserContextAsync();

                var assigned = db.ProjectManagerAssignments
                    .Any(a => a.ProjectId == projectId && a.UserId == ctx.PrsId);

                if (!assigned)
                {
                    context.Result = new ForbidResult();
                }
            }
        }
    }
}