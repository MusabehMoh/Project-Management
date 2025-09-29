namespace PMA.Api.Config;

public class AttachmentSettings
{
    public long MaxFileSize { get; set; }
    public string[] AllowedExtensions { get; set; } = Array.Empty<string>();
}