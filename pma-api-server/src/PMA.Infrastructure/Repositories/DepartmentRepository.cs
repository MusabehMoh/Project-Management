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

    public async Task<List<string>> CheckMemberDependenciesAsync(int? prsId)
    {
        var dependencies = new List<string>();

        if (!prsId.HasValue)
            return dependencies;

        // Check ProjectAnalyst table
        var projectAnalystCount = await _context.ProjectAnalysts
            .CountAsync(pa => pa.AnalystId == prsId.Value);
        if (projectAnalystCount > 0)
        {
            dependencies.Add($"{projectAnalystCount} تعيين محلل مشروع");
        }

        // Check TaskAssignment table
        var taskAssignmentCount = await _context.TaskAssignments
            .CountAsync(ta => ta.PrsId == prsId.Value);
        if (taskAssignmentCount > 0)
        {
            dependencies.Add($"{taskAssignmentCount} تعيين مهمة");
        }

        return dependencies;
    }
}

public class TeamRepository : Repository<Team>, ITeamRepository
{
    public TeamRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<Team> Teams, int TotalCount)> GetTeamsByDepartmentAsync(int departmentId, int page = 1, int limit = 10, string? search = null)
    {
        var query = _context.Teams
            .Include(t => t.Employee)
            .Include(t => t.Department)
            .Where(t => t.DepartmentId == departmentId && t.IsActive);

        // Apply search filter if search term is provided
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(t => t.IsActive &&
               (t.Employee != null && (t.Employee.UserName.Contains(search) ||
                t.Employee.FullName.Contains(search))) ||
               (t.UserName != null && t.UserName.Contains(search)) ||
               (t.FullName != null && t.FullName.Contains(search)));
        }

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
        team.CreatedAt = DateTime.Now;
        team.UpdatedAt = DateTime.Now;
        await _context.Teams.AddAsync(team);
        await _context.SaveChangesAsync();
        return team;
    }

    public async Task UpdateTeamMemberAsync(Team team)
    {
        team.UpdatedAt = DateTime.Now;
        _context.Teams.Update(team);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> RemoveTeamMemberAsync(int id)
    {
        var team = await _context.Teams.FindAsync(id);
        if (team != null)
        {
            team.IsActive = false;
            team.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }
        return false;
    }

    public async Task<IEnumerable<Employee>> SearchEmployeesInTeamsAsync(string searchTerm)
    {
     

        // Get all team members who are active and match the search criteria
        var employees = await _context.Teams
            .Include(t => t.Employee)
            .Where(t => t.IsActive &&
                ((t.Employee != null && t.Employee.UserName.Contains(searchTerm)) ||
                 (t.Employee != null && t.Employee.FullName.Contains(searchTerm)) ||
                 (t.Employee != null && t.Employee.MilitaryNumber.Contains(searchTerm)) ||
                 (t.UserName != null && t.UserName.Contains(searchTerm)) ||
                 (t.FullName != null && t.FullName.Contains(searchTerm))))
            .Select(t => new Employee
            {
                Id = t.Employee != null ? t.Employee.Id : 0,
                UserName = !string.IsNullOrEmpty(t.UserName) ? t.UserName : (t.Employee != null ? t.Employee.UserName : ""),
                FullName = !string.IsNullOrEmpty(t.FullName) ? t.FullName : (t.Employee != null ? t.Employee.FullName : ""),
                MilitaryNumber = t.Employee != null ? t.Employee.MilitaryNumber : "",
                GradeName= t.Employee != null ? t.Employee.GradeName : "",  
            })
            .Distinct()
            .OrderBy(e => e.FullName)
            .ToListAsync();

        return employees;
    }

    public async Task<IEnumerable<Employee>> SearchEmployeesInDepartmentAsync(string searchTerm, int departmentId)
    {
        // Build base query for department members
        var query = _context.Teams
            .Include(t => t.Employee)
            .Where(t => t.IsActive && 
                   t.DepartmentId == departmentId &&
                   t.Employee != null);

        // Apply search filter only if searchTerm is provided
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(t => t.IsActive &&
               (t.Employee!.UserName.Contains(searchTerm) ||
                t.Employee.FullName.Contains(searchTerm) ||
               (t.UserName !=null && t.UserName.Contains(searchTerm))||
               (t.FullName !=null && t.FullName.Contains(searchTerm))||
                t.Employee.MilitaryNumber.Contains(searchTerm)));
        }

        // Execute query and return distinct employees
        var employees = await query
            .Select(t => t.Employee!)
            .Distinct()
            .OrderBy(e => e.FullName)
            .ToListAsync();

        return employees;
    }

    public async Task<IEnumerable<Team>> GetEmployeeOtherDepartmentsAsync(int prsId, int excludeDepartmentId)
    {
        return await _context.Teams
            .Include(t => t.Department)
            .Where(t => t.PrsId == prsId && 
                   t.IsActive && 
                   t.DepartmentId != excludeDepartmentId)
            .ToListAsync();
    }
}


