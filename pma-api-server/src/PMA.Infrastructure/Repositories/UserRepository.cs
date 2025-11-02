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

    public async Task<(IEnumerable<User> Users, int TotalCount)> GetUsersAsync(int page, int limit, string? search = null, bool? isActive = null, int? departmentId = null, int? roleId = null)
    {
        var query = _context.Users
           .Include(u => u.Employee).AsQueryable();

        // Handle nullable collections by including them conditionally
        query = query.Include(u => u.UserRoles!)
           .ThenInclude(ur => ur.Role!)
           .Include(u => u.UserActions!)
           .ThenInclude(ua => ua.Permission!);

        // Search filter - search across userName, fullName, militaryNumber
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u => 
                u.UserName.ToLower().Contains(searchLower) ||
                (u.FullName != null && u.FullName.ToLower().Contains(searchLower)) ||
                (u.MilitaryNumber != null && u.MilitaryNumber.ToLower().Contains(searchLower)) ||
                (u.Employee != null && u.Employee.FullName != null && u.Employee.FullName.ToLower().Contains(searchLower))
            );
        }

        // Role filter
        if (roleId.HasValue)
        {
            query = query.Where(u => u.UserRoles!.Any(ur => ur.RoleId == roleId.Value));
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
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
           .AsNoTracking()
           .Include("UserRoles.Role.Department")
           .Include("UserActions.Permission")
           .Include(u => u.Employee)
           .FirstOrDefaultAsync(u => u.UserName == userName.ToLower());
        }
        catch (Exception ex)
        {
            return null;
        }
    }

    public async Task<User?> GetByPrsIdAsync(int prsId)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.PrsId == prsId);
    }

    public async Task<User?> GetUserWithRolesAndActionsAsync(int id)
    {
        return await _context.Users
            .Include("UserRoles.Role")
            .Include("UserActions.Permission")
            .Include(u => u.Employee)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetUserWithRolesByPrsIdAsync(int prsId)
    {
        return await _context.Users
            .Include("UserRoles.Role")
            .FirstOrDefaultAsync(u => u.PrsId == prsId);
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

    public async Task<List<string>> CheckUserDependenciesAsync(int userId)
    {
        var dependencies = new List<string>();

        // Check TaskAssignments (PrsId references Users.Id)
        var taskAssignmentsCount = await _context.TaskAssignments
            .CountAsync(ta => ta.PrsId == userId);
        if (taskAssignmentsCount > 0)
        {
            dependencies.Add($"{taskAssignmentsCount} Task Assignment(s)");
        }

        // Check ProjectRequirements (CreatedBy)
        var createdRequirementsCount = await _context.ProjectRequirements
            .CountAsync(pr => pr.CreatedBy == userId);
        if (createdRequirementsCount > 0)
        {
            dependencies.Add($"{createdRequirementsCount} Project Requirement(s) as Creator");
        }

        // Check ProjectRequirements (AssignedAnalyst)
        var analystRequirementsCount = await _context.ProjectRequirements
            .CountAsync(pr => pr.AssignedAnalyst == userId);
        if (analystRequirementsCount > 0)
        {
            dependencies.Add($"{analystRequirementsCount} Project Requirement(s) as Analyst");
        }

        // Check DesignRequests (AssignedToPrsId)
        var designRequestsCount = await _context.DesignRequests
            .CountAsync(dr => dr.AssignedToPrsId == userId);
        if (designRequestsCount > 0)
        {
            dependencies.Add($"{designRequestsCount} Design Request(s)");
        }

        // Check SubTasks (AssigneeId)
        var subTasksCount = await _context.SubTasks
            .CountAsync(st => st.AssigneeId == userId);
        if (subTasksCount > 0)
        {
            dependencies.Add($"{subTasksCount} Sub Task(s)");
        }

        // Check CalendarEvents (CreatedBy)
        var calendarEventsCount = await _context.CalendarEvents
            .CountAsync(ce => ce.CreatedBy == userId);
        if (calendarEventsCount > 0)
        {
            dependencies.Add($"{calendarEventsCount} Calendar Event(s)");
        }

        // Check CalendarEventAssignments (UserId)
        var calendarAssignmentsCount = await _context.CalendarEventAssignments
            .CountAsync(cea => cea.UserId == userId);
        if (calendarAssignmentsCount > 0)
        {
            dependencies.Add($"{calendarAssignmentsCount} Calendar Event Assignment(s)");
        }

        // Check Notifications (UserId)
        var notificationsCount = await _context.Notifications
            .CountAsync(n => n.UserId == userId);
        if (notificationsCount > 0)
        {
            dependencies.Add($"{notificationsCount} Notification(s)");
        }

        // Check Teams (CreatedBy)
        var teamsCount = await _context.Teams
            .CountAsync(t => t.CreatedBy == userId);
        if (teamsCount > 0)
        {
            dependencies.Add($"{teamsCount} Team(s) Created");
        }

        // UserActions and UserRoles will be deleted automatically with cascade delete

        return dependencies;
    }
}




