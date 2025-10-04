namespace PMA.Core.DTOs;

public class FileDownloadResult
{
    public Stream FileStream { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    // Absolute physical path (optional; helps switching to PhysicalFileResult later)
    public string? FilePath { get; set; }
}