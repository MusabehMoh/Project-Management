using PMA.Core.Entities;
using PMA.Core.DTOs;

namespace PMA.Core.Services;

/// <summary>
/// Interface for mapping between entities and DTOs
/// </summary>
public interface IMappingService
{
    RoleDto MapToRoleDto(Role role);
    Role MapToRole(RoleCreateDto roleDto);
    void UpdateRoleFromDto(Role role, RoleUpdateDto roleDto);
    ActionDto MapToActionDto(Permission permission);
}