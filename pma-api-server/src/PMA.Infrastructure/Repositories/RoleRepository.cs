using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace PMA.Infrastructure.Repositories;

public class RoleRepository : Repository<Role>, IRoleRepository
{
    public RoleRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<Role> Roles, int TotalCount)> GetRolesAsync(int page, int limit, bool? isActive = null)
    {
        var query = _context.Roles.AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(r => r.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();
        var roles = await query
            .OrderBy(r => r.RoleOrder)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (roles, totalCount);
    }

    public async Task<IEnumerable<Role>> GetActiveRolesAsync()
    {
        return await _context.Roles
            .Where(r => r.IsActive)
            .OrderBy(r => r.RoleOrder)
            .ToListAsync();
    }

    public async Task<Role?> GetRoleWithActionsAsync(int id)
    {
        return await _context.Roles
            .Include(r => r.RoleActions)
                .ThenInclude(ra => ra.Permission)
            .FirstOrDefaultAsync(r => r.Id == id);
    }
}


