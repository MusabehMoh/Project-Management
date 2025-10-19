using PMA.Infrastructure.Data;
using System.Security.Claims;

namespace PMA.Api.Middleware;

/// <summary>
/// Middleware to set the current user in the DbContext for audit logging
/// </summary>
public class AuditUserMiddleware
{
    private readonly RequestDelegate _next;

    public AuditUserMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
    {
        // Get the current user from claims principal
        var userClaim = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? context.User?.FindFirst(ClaimTypes.Name)?.Value 
            ?? context.User?.FindFirst("sub")?.Value 
            ?? "anonymous";

        // Extract just the username part if it contains domain (e.g., "HAMDY\hamdb" -> "hamdb")
        if (!string.IsNullOrEmpty(userClaim) && userClaim.Contains("\\"))
        {
            userClaim = userClaim.Split("\\")[^1]; // Get the last part after backslash
        }

        // Set the current user in the DbContext
        dbContext.CurrentUser = userClaim;

        await _next(context);
    }
}

/// <summary>
/// Extension methods for registering audit middleware
/// </summary>
public static class AuditMiddlewareExtensions
{
    /// <summary>
    /// Add audit user middleware to the pipeline
    /// </summary>
    public static IApplicationBuilder UseAuditUser(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<AuditUserMiddleware>();
    }
}
