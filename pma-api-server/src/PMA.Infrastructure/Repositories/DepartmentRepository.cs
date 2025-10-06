using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace PMA.Infrastructure.Repositories;

public class DepartmentRepository : Repository<Department>, IDepartmentRepository
{
    public DepartmentRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<(Department Department, int MemberCount)> Departments, int TotalCount)> GetDepartmentsAsync(int page, int limit, bool? isActive = null)
    {
        var query = _context.Departments.AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(d => d.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();
        var departmentsWithCounts = await query
            .OrderBy(d => d.Name)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(d => new
            {
                Department = d,
                MemberCount = _context.Teams.Count(t => t.DepartmentId == d.Id && t.IsActive)
            })
            .ToListAsync();

        return (departmentsWithCounts.Select(x => (x.Department, x.MemberCount)), totalCount);
    }

    public async Task<Department?> GetDepartmentByNameAsync(string name)
    {
        return await _context.Departments
            .FirstOrDefaultAsync(d => d.Name.ToLower() == name.ToLower() && d.IsActive);
    }
}

public class TeamRepository : Repository<Team>, ITeamRepository
{
    public TeamRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<Team> Teams, int TotalCount)> GetTeamsByDepartmentAsync(int departmentId, int page = 1, int limit = 10)
    {
        var query = _context.Teams
            .Include(t => t.Employee)
            .Include(t => t.Department)
            .Where(t => t.DepartmentId == departmentId && t.IsActive);

        var totalCount = await query.CountAsync();
        var teams = await query
            .OrderBy(t => t.JoinDate)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (teams, totalCount);
    }

    public async Task<Team?> GetTeamByIdAsync(int id)
    {
        return await _context.Teams
            .Include(t => t.Employee)
            .Include(t => t.Department)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<Team> AddTeamMemberAsync(Team team)
    {
        team.CreatedAt = DateTime.UtcNow;
        team.UpdatedAt = DateTime.UtcNow;
        await _context.Teams.AddAsync(team);
        await _context.SaveChangesAsync();
        return team;
    }

    public async Task UpdateTeamMemberAsync(Team team)
    {
        team.UpdatedAt = DateTime.UtcNow;
        _context.Teams.Update(team);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> RemoveTeamMemberAsync(int id)
    {
        var team = await _context.Teams.FindAsync(id);
        if (team != null)
        {
            team.IsActive = false;
            team.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
        return false;
    }

    public async Task<IEnumerable<Employee>> SearchUsersInTeamsAsync(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return Enumerable.Empty<Employee>();

        // Get all employees who are active team members and match the search criteria
        var employees = await _context.Teams
            .Include(t => t.Employee)
            .Where(t => t.IsActive && t.Employee != null &&
                (t.Employee.UserName.Contains(searchTerm) ||
                 t.Employee.FullName.Contains(searchTerm) ||
                 t.Employee.MilitaryNumber.Contains(searchTerm)))
            .Select(t => t.Employee!)
            .Distinct()
            .OrderBy(e => e.FullName)
            .ToListAsync();

        return employees;
    }
}


