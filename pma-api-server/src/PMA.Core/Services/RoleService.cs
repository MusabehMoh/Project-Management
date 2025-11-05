using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using System.Linq;
using Task = System.Threading.Tasks.Task;

namespace PMA.Core.Services;

public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;
    private readonly IMappingService _mappingService;

    public RoleService(IRoleRepository roleRepository, IMappingService mappingService)
    {
        _roleRepository = roleRepository;
        _mappingService = mappingService;
    }

    public async System.Threading.Tasks.Task<RoleDto?> GetRoleByIdAsync(int id)
    {
        var role = await _roleRepository.GetByIdAsync(id);
        return role != null ? _mappingService.MapToRoleDto(role) : null;
    }

    public async System.Threading.Tasks.Task<RoleDto> CreateRoleAsync(RoleCreateDto roleDto)
    {
        // Map DTO to entity
        var role = _mappingService.MapToRole(roleDto);
        
        // Save to database
        var createdRole = await _roleRepository.AddAsync(role);
        
        // Map back to DTO for response
        var roleDto2 = _mappingService.MapToRoleDto(createdRole);
        return roleDto2 ?? throw new InvalidOperationException("Failed to create role");
    }

    public async Task<(IEnumerable<RoleDto> Roles, int TotalCount)> GetRolesAsync(int page, int limit, bool? isActive = null)
    {
        var (roles, totalCount) = await _roleRepository.GetRolesAsync(page, limit, isActive);
        var roleDtos = roles.Select(r => _mappingService.MapToRoleDto(r)).Where(dto => dto != null).Cast<RoleDto>();
        return (roleDtos, totalCount);
    }

    public async Task<RoleDto> UpdateRoleAsync(RoleUpdateDto roleDto)
    {
        // Get existing role
        var role = await _roleRepository.GetByIdAsync(roleDto.Id);
        if (role == null)
            return null!; // Using null-forgiving operator as we're checking for null in the controller
            
        // Update the entity with DTO values
        _mappingService.UpdateRoleFromDto(role, roleDto);
        
        // Save changes
        await _roleRepository.UpdateAsync(role);
        
        // Return updated DTO
        var updatedDto = _mappingService.MapToRoleDto(role);
        return updatedDto ?? throw new InvalidOperationException("Failed to update role");
    }

    public async Task<bool> DeleteRoleAsync(int id)
    {
        var role = await _roleRepository.GetByIdAsync(id);
        if (role != null)
        {
            await _roleRepository.DeleteAsync(role);
            return true;
        }
        return false;
    }

    public async System.Threading.Tasks.Task<IEnumerable<RoleDto>> GetActiveRolesAsync()
    {
        var roles = await _roleRepository.GetActiveRolesAsync();
        return roles.Select(r => _mappingService.MapToRoleDto(r)).Where(dto => dto != null).Cast<RoleDto>();
    }

    public async System.Threading.Tasks.Task<RoleDto?> GetRoleWithActionsAsync(int id)
    {
        var role = await _roleRepository.GetRoleWithActionsAsync(id);
        return role != null ? _mappingService.MapToRoleDto(role) : null;
    }

    public async System.Threading.Tasks.Task<IEnumerable<RoleDto>> GetRolesByDepartmentAsync(int departmentId)
    {
        var roles = await _roleRepository.GetRolesByDepartmentAsync(departmentId);
        return roles.Select(r => _mappingService.MapToRoleDto(r)).Where(dto => dto != null).Cast<RoleDto>();
    }
}



