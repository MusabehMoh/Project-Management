namespace PMA.Core.Interfaces;

/// <summary>
/// Abstraction for resolving application content and web root paths.
/// Keeps Core layer decoupled from ASP.NET hosting types.
/// </summary>
public interface IAppPathProvider
{
    string ContentRootPath { get; }
    string WebRootPath { get; }
}
