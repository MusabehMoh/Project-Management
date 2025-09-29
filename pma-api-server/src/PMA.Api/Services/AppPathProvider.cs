using Microsoft.AspNetCore.Hosting;
using PMA.Core.Interfaces;

namespace PMA.Api.Services;

/// <summary>
/// Provides application paths (content root & web root) to core services without
/// introducing a direct dependency on ASP.NET types inside the Core project.
/// </summary>
public class AppPathProvider : IAppPathProvider
{
    public AppPathProvider(IWebHostEnvironment env)
    {
        ContentRootPath = env.ContentRootPath;
        WebRootPath = env.WebRootPath;
    }

    public string ContentRootPath { get; }
    public string WebRootPath { get; }
}
