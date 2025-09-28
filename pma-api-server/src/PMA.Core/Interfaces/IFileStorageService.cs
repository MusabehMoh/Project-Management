using Microsoft.AspNetCore.Http;
using PMA.Core.DTOs;

namespace PMA.Core.Interfaces;

public interface IFileStorageService
{
    /// <summary>
    /// Save a file to storage and return the file information
    /// </summary>
    /// <param name="file">The uploaded file</param>
    /// <param name="subFolder">Optional subfolder (e.g., "requirements")</param>
    /// <returns>File storage information</returns>
    Task<FileStorageResult> SaveFileAsync(IFormFile file, string? subFolder = null);

    /// <summary>
    /// Get file as stream for download
    /// </summary>
    /// <param name="filePath">The file path</param>
    /// <returns>File stream with metadata</returns>
    Task<(Stream FileStream, string FileName, string ContentType)?> GetFileAsync(string filePath);

    /// <summary>
    /// Delete a file from storage
    /// </summary>
    /// <param name="filePath">The file path</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteFileAsync(string filePath);

    /// <summary>
    /// Validate a file before saving
    /// </summary>
    /// <param name="file">The file to validate</param>
    /// <returns>Validation result</returns>
    FileValidationResult ValidateFile(IFormFile file);

    /// <summary>
    /// Get the full physical path for a file
    /// </summary>
    /// <param name="relativePath">Relative file path</param>
    /// <returns>Full physical path</returns>
    string GetPhysicalPath(string relativePath);
}