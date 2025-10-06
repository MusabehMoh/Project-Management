namespace PMA.Core.DTOs;

public class AddMemberRequest
{
    public int UserId { get; set; }
    public string? Role { get; set; }
}