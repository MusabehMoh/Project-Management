using PMA.Core.Entities;
using PMA.Core.Interfaces;
using Task = System.Threading.Tasks.Task;

namespace PMA.Core.Services;

public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;

    public RoleService(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Role>> GetAllRolesAsync()
    {
        return await _roleRepository.GetAllAsync();
    }

    public async System.Threading.Tasks.Task<Role?> GetRoleByIdAsync(int id)
    {
        return await _roleRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<Role> CreateRoleAsync(Role role)
    {
        role.CreatedAt = DateTime.UtcNow;
        role.UpdatedAt = DateTime.UtcNow;
        return await _roleRepository.AddAsync(role);
    }

    public async Task<(IEnumerable<Role> Roles, int TotalCount)> GetRolesAsync(int page, int limit, bool? isActive = null)
    {
        return await _roleRepository.GetRolesAsync(page, limit, isActive);
    }

    public async Task<Role> UpdateRoleAsync(Role role)
    {
        role.UpdatedAt = DateTime.UtcNow;
        await _roleRepository.UpdateAsync(role);
        return role;
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

    public async System.Threading.Tasks.Task<IEnumerable<Role>> GetActiveRolesAsync()
    {
        return await _roleRepository.GetActiveRolesAsync();
    }

    public async System.Threading.Tasks.Task<Role?> GetRoleWithActionsAsync(int id)
    {
        return await _roleRepository.GetRoleWithActionsAsync(id);
    }
}



