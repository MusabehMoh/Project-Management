namespace PMA.Core.DTOs;

public class AddMemberRequest
{
    public int? PrsId { get; set; }
    public int DepartmentId { get; set; }
    public string? UserName { get; set; }
    public string? FullName { get; set; }

    public string? Role { get; set; }

}