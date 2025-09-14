using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace PMA.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();

        // Log the incoming request
        _logger.LogInformation("Incoming request: {Method} {Path} from {IP} User: {User}",
            context.Request.Method,
            context.Request.Path,
            context.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
            context.User?.Identity?.Name ?? "Anonymous");

        // Log request body for POST/PUT/PATCH requests (be careful with large payloads)
        if (context.Request.Method == "POST" || context.Request.Method == "PUT" || context.Request.Method == "PATCH")
        {
            context.Request.EnableBuffering();
            var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
            context.Request.Body.Position = 0;

            if (!string.IsNullOrEmpty(body) && body.Length < 1000) // Only log small request bodies
            {
                _logger.LogDebug("Request body: {Body}", body);
            }
            else if (!string.IsNullOrEmpty(body))
            {
                _logger.LogDebug("Request body size: {Size} characters", body.Length);
            }
        }

        // Capture the original response body stream
        var originalResponseBodyStream = context.Response.Body;
        using var responseBodyStream = new MemoryStream();
        context.Response.Body = responseBodyStream;

        try
        {
            await _next(context);

            stopwatch.Stop();

            // Log the response
            _logger.LogInformation("Request completed: {Method} {Path} - Status: {StatusCode} - Duration: {Duration}ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                stopwatch.ElapsedMilliseconds);

            // Log response body for error responses
            if (context.Response.StatusCode >= 400)
            {
                responseBodyStream.Position = 0;
                var responseBody = await new StreamReader(responseBodyStream).ReadToEndAsync();
                _logger.LogWarning("Error response body: {Body}", responseBody);
            }

            // Always copy the response body back to the original stream
            responseBodyStream.Position = 0;
            await responseBodyStream.CopyToAsync(originalResponseBodyStream);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(ex, "Request failed: {Method} {Path} - Duration: {Duration}ms",
                context.Request.Method,
                context.Request.Path,
                stopwatch.ElapsedMilliseconds);

            throw; // Re-throw to let exception handling middleware deal with it
        }
        finally
        {
            // Restore the original response body stream
            context.Response.Body = originalResponseBodyStream;
        }
    }
}

public static class RequestLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestLoggingMiddleware>();
    }
}