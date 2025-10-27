namespace PMA.Api.Utils;

/// <summary>
/// Helper class for validating file uploads across the application.
/// Provides centralized validation logic for file size and extension constraints.
/// </summary>
public static class FileValidationHelper
{
    /// <summary>
    /// Validates an uploaded attachment file for size and extension constraints.
    /// </summary>
    /// <param name="file">The file to validate</param>
    /// <param name="maxFileSize">Maximum allowed file size in bytes</param>
    /// <param name="allowedExtensions">Array of allowed file extensions (e.g., ".pdf", ".doc")</param>
    /// <returns>A tuple containing validation result and error message if invalid</returns>
    public static (bool IsValid, string? Error) ValidateAttachment(
        IFormFile file,
        long maxFileSize,
        string[] allowedExtensions)
    {
        if (file == null || file.Length == 0)
            return (false, "No file uploaded");

        if (file.Length > maxFileSize)
            return (false, $"File size exceeds {maxFileSize / (1024 * 1024)}MB limit");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
            return (false, "File type not allowed");

        return (true, null);
    }
}
