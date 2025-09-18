using PMA.Core.Entities;
using PMA.Core.DTOs;

namespace PMA.Core.Services;

/// <summary>
/// Service to handle mapping between entities and DTOs
/// </summary>
public class MappingService : IMappingService
{
    /// <summary>
    /// Maps a Role entity to a RoleDto
    /// </summary>
    public RoleDto MapToRoleDto(Role role)
    {
        if (role == null)
            return null;

        var roleDto = new RoleDto
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            IsActive = role.IsActive,
            RoleOrder = role.RoleOrder,
            CreatedAt = role.CreatedAt,
            UpdatedAt = role.UpdatedAt,
            Actions = role.RoleActions?.Select(ra => new ActionDto
            {
                Id = ra.Permission?.Id ?? 0,
                Name = ra.Permission?.Name ?? string.Empty,
                Description = ra.Permission?.Description,
                Category = ra.Permission?.Category ?? string.Empty,
                IsActive = ra.Permission?.IsActive ?? false
            }).ToList()
        };

        return roleDto;
    }

    /// <summary>
    /// Maps a RoleCreateDto to a Role entity
    /// </summary>
    public Role MapToRole(RoleCreateDto roleDto)
    {
        if (roleDto == null)
            return null;

        return new Role
        {
            Name = roleDto.Name,
            Description = roleDto.Description,
            IsActive = roleDto.IsActive,
            RoleOrder = roleDto.RoleOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Updates a Role entity from a RoleUpdateDto
    /// </summary>
    public void UpdateRoleFromDto(Role role, RoleUpdateDto roleDto)
    {
        if (role == null || roleDto == null)
            return;

        role.Name = roleDto.Name;
        role.Description = roleDto.Description;
        role.IsActive = roleDto.IsActive;
        role.RoleOrder = roleDto.RoleOrder;
        role.UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Maps a Permission entity to an ActionDto
    /// </summary>
    public ActionDto MapToActionDto(Permission permission)
    {
        if (permission == null)
            return null;

        return new ActionDto
        {
            Id = permission.Id,
            Name = permission.Name,
            Description = permission.Description,
            Category = permission.Category,
            IsActive = permission.IsActive
        };
    }
}