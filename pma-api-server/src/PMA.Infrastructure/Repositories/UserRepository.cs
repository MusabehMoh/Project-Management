using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace PMA.Infrastructure.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<User> Users, int TotalCount)> GetUsersAsync(int page, int limit, bool? isVisible = null, int? departmentId = null)
    {
        var query = _context.Users
           .Include(u => u.Employee).AsQueryable();

        // Handle nullable collections by including them conditionally
        query = query.Include(u => u.UserRoles!)
           .ThenInclude(ur => ur.Role!)
           .Include(u => u.UserActions!)
           .ThenInclude(ua => ua.Permission!);

        if (isVisible.HasValue)
        {
            query = query.Where(u => u.IsVisible == isVisible.Value);
        }

        if (departmentId.HasValue)
        {
            query = query.Where(u => u.DepartmentId == departmentId);
        }

        var totalCount = await query.CountAsync();
        var users = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (users, totalCount);
    }

    public async Task<User?> GetByUserNameAsync(string userName)
    {
        try
        {
            return await _context.Users
           .Include("UserRoles.Role.Department")
           .Include("UserActions.Permission")
           .Include(u => u.Employee)
           .FirstOrDefaultAsync(u => u.UserName == userName.ToLower());
        }
        catch (Exception ex)
        {
            return new User();
        }
    }

    public async Task<User?> GetUserWithRolesAndActionsAsync(int id)
    {
        return await _context.Users
            .Include("UserRoles.Role")
            .Include("UserActions.Permission")
            .Include(u => u.Employee)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public new async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users
            .Include(u => u.UserRoles)
            .Include(u => u.UserActions)
            .Include(u => u.Employee)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<IEnumerable<User>> GetUsersByDepartmentAsync(int departmentId)
    {
        return await _context.Users
            .Where(u => u.DepartmentId == departmentId)
            .ToListAsync();
    }
}


