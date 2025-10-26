using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using System.Security.Cryptography;
using System.Text;

namespace PMA.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<FileStorageService> _logger;
    private readonly string _uploadPath;
    private readonly long _maxFileSize;
    private readonly HashSet<string> _allowedExtensions;
    private readonly HashSet<string> _allowedMimeTypes;

    public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        // Get configuration values
        _uploadPath = _configuration.GetValue<string>("FileStorage:UploadPath") ?? "uploads";
        _maxFileSize = _configuration.GetValue<long?>("FileStorage:MaxFileSize") ?? 10L * 1024 * 1024; // 10MB default
        
        // Configure allowed file types for security
        _allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
            ".txt", ".rtf", ".csv", ".zip", ".rar", ".7z",
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff",
            ".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm"
        };

        _allowedMimeTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain", "text/rtf", "text/csv",
            "application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
            "image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff",
            "video/mp4", "video/avi", "video/quicktime", "video/x-ms-wmv", "video/webm"
        };

        // Ensure upload directory exists
        EnsureUploadDirectoryExists();
    }

    public async Task<FileStorageResult> SaveFileAsync(IFormFile file, string? subFolder = null)
    {
        // Validate file first
        var validationResult = ValidateFile(file);
        if (!validationResult.IsValid)
        {
            throw new InvalidOperationException($"File validation failed: {validationResult.ErrorMessage}");
        }

        try
        {
            // Generate unique filename to prevent conflicts and security issues
            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = GenerateUniqueFileName(file.FileName, fileExtension);
            
            // Build file path
            var relativePath = BuildFilePath(uniqueFileName, subFolder);
            var absolutePath = Path.Combine(_uploadPath, relativePath);
            
            // Ensure directory exists
            var directory = Path.GetDirectoryName(absolutePath);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // Save file
            using (var fileStream = new FileStream(absolutePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            _logger.LogInformation("File uploaded successfully: {FileName} -> {FilePath}", file.FileName, relativePath);

            return new FileStorageResult
            {
                FileName = uniqueFileName,
                FilePath = relativePath,
                FileSize = file.Length,
                ContentType = file.ContentType
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving file: {FileName}", file.FileName);
            throw;
        }
    }

    public Task<(Stream FileStream, string FileName, string ContentType)?> GetFileAsync(string filePath)
    {
        try
        {
            var absolutePath = Path.Combine(_uploadPath, filePath);
            
            if (!File.Exists(absolutePath))
            {
                _logger.LogWarning("File not found: {FilePath}", filePath);
                return Task.FromResult<(Stream, string, string)?>(null);
            }

            // Security check: Ensure file is within upload directory
            var fullUploadPath = Path.GetFullPath(_uploadPath);
            var fullFilePath = Path.GetFullPath(absolutePath);
            
            if (!fullFilePath.StartsWith(fullUploadPath))
            {
                _logger.LogWarning("Security violation: Attempt to access file outside upload directory: {FilePath}", filePath);
                return Task.FromResult<(Stream, string, string)?>(null);
            }

            var fileStream = new FileStream(absolutePath, FileMode.Open, FileAccess.Read);
            
            // Get content type from file extension
            var contentType = GetContentTypeFromExtension(Path.GetExtension(absolutePath));

            return Task.FromResult<(Stream, string, string)?>(((Stream)fileStream, Path.GetFileName(filePath), contentType));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving file: {FilePath}", filePath);
            return Task.FromResult<(Stream, string, string)?>(null);
        }
    }

    public Task<bool> DeleteFileAsync(string filePath)
    {
        try
        {
            var absolutePath = Path.Combine(_uploadPath, filePath);
            
            if (!File.Exists(absolutePath))
            {
                _logger.LogWarning("File not found for deletion: {FilePath}", filePath);
                return Task.FromResult(false);
            }

            // Security check: Ensure file is within upload directory
            var fullUploadPath = Path.GetFullPath(_uploadPath);
            var fullFilePath = Path.GetFullPath(absolutePath);
            
            if (!fullFilePath.StartsWith(fullUploadPath))
            {
                _logger.LogWarning("Security violation: Attempt to delete file outside upload directory: {FilePath}", filePath);
                return Task.FromResult(false);
            }

            File.Delete(absolutePath);
            _logger.LogInformation("File deleted successfully: {FilePath}", filePath);
            
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file: {FilePath}", filePath);
            return Task.FromResult(false);
        }
    }

    public FileValidationResult ValidateFile(IFormFile file)
    {
        var result = new FileValidationResult { IsValid = true };

        if (file == null || file.Length == 0)
        {
            result.IsValid = false;
            result.ErrorMessage = "No file provided or file is empty.";
            result.Errors.Add("FILE_EMPTY");
            return result;
        }

        // Check file size
        if (file.Length > _maxFileSize)
        {
            result.IsValid = false;
            result.ErrorMessage = $"File size ({file.Length / (1024 * 1024)}MB) exceeds maximum allowed size ({_maxFileSize / (1024 * 1024)}MB).";
            result.Errors.Add("FILE_TOO_LARGE");
        }

        // Check file extension
        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(extension) || !_allowedExtensions.Contains(extension))
        {
            result.IsValid = false;
            result.ErrorMessage = $"File extension '{extension}' is not allowed.";
            result.Errors.Add("INVALID_EXTENSION");
        }

        // Check MIME type
        if (!string.IsNullOrEmpty(file.ContentType) && !_allowedMimeTypes.Contains(file.ContentType))
        {
            result.IsValid = false;
            result.ErrorMessage = $"File type '{file.ContentType}' is not allowed.";
            result.Errors.Add("INVALID_MIME_TYPE");
        }

        // Check filename for security
        if (ContainsDangerousCharacters(file.FileName))
        {
            result.IsValid = false;
            result.ErrorMessage = "Filename contains invalid characters.";
            result.Errors.Add("INVALID_FILENAME");
        }

        return result;
    }

    private void EnsureUploadDirectoryExists()
    {
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
            _logger.LogInformation("Created upload directory: {UploadPath}", _uploadPath);
        }
    }

    private string GenerateUniqueFileName(string originalFileName, string extension)
    {
        // Create a unique filename using timestamp and GUID
        var timestamp = DateTimeOffset.Now.ToString("yyyyMMdd_HHmmss");
        var guid = Guid.NewGuid().ToString("N")[..8]; // First 8 chars of GUID
        var cleanOriginalName = Path.GetFileNameWithoutExtension(originalFileName)
            .Replace(" ", "_")
            .Replace("-", "_");
        
        // Sanitize filename
        var sanitized = new string(cleanOriginalName.Where(c => char.IsLetterOrDigit(c) || c == '_').ToArray());
        if (sanitized.Length > 50) sanitized = sanitized[..50]; // Limit length
        
        return $"{timestamp}_{guid}_{sanitized}{extension}";
    }

    private string BuildFilePath(string fileName, string? subFolder)
    {
        var datePath = DateTime.Now.ToString("yyyy/MM");
        
        if (!string.IsNullOrEmpty(subFolder))
        {
            return Path.Combine(subFolder, datePath, fileName).Replace('\\', '/');
        }
        
        return Path.Combine(datePath, fileName).Replace('\\', '/');
    }

    private bool ContainsDangerousCharacters(string fileName)
    {
        var dangerousChars = new[] { '<', '>', ':', '"', '|', '?', '*', '\0' };
        return fileName.IndexOfAny(dangerousChars) >= 0 || fileName.Contains("..");
    }

    private string GetContentTypeFromExtension(string extension)
    {
        return extension.ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".ppt" => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".txt" => "text/plain",
            ".csv" => "text/csv",
            ".zip" => "application/zip",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".bmp" => "image/bmp",
            ".tiff" => "image/tiff",
            ".mp4" => "video/mp4",
            ".avi" => "video/x-msvideo",
            ".mov" => "video/quicktime",
            _ => "application/octet-stream"
        };
    }

    public string GetPhysicalPath(string relativePath)
    {
        return Path.Combine(_uploadPath, relativePath);
    }
}