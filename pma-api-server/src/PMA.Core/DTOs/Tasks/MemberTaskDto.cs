using PMA.Core.DTOs;

namespace PMA.Core.DTOs.Tasks;

public class MemberTaskDto : TaskDto
{
    public List<MemberSearchResultDto> AssignedMembers { get; set; } = new List<MemberSearchResultDto>();
    public MemberSearchResultDto? PrimaryAssignee { get; set; }
}