namespace PMA.Core.DTOs;

public class FileValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public List<string> Errors { get; set; } = new();
}