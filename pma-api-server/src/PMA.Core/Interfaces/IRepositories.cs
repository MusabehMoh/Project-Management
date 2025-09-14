using PMA.Core.Entities;
using TaskEntity = PMA.Core.Entities.Task;
using System.Threading.Tasks;

namespace PMA.Core.Interfaces;

public interface IRepository<T> where T : class
{
    System.Threading.Tasks.Task<T?> GetByIdAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<T>> GetAllAsync();
    System.Threading.Tasks.Task<T> AddAsync(T entity);
    System.Threading.Tasks.Task UpdateAsync(T entity);
    System.Threading.Tasks.Task DeleteAsync(T entity);
    System.Threading.Tasks.Task<bool> ExistsAsync(int id);
}

public interface IProjectRepository : IRepository<Project>
{
    System.Threading.Tasks.Task<IEnumerable<Project>> GetProjectsWithPaginationAsync(int page, int limit, string? search = null, int? status = null, string? priority = null);
    System.Threading.Tasks.Task<int> GetTotalProjectsCountAsync(string? search = null, int? status = null, string? priority = null);
    System.Threading.Tasks.Task<Project?> GetProjectWithDetailsAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<Project>> SearchProjectsAsync(string query, int? status = null, string? priority = null, int page = 1, int limit = 20);
}

public interface IUserRepository : IRepository<User>
{
    System.Threading.Tasks.Task<(IEnumerable<User> Users, int TotalCount)> GetUsersAsync(int page, int limit, bool? isVisible = null, int? departmentId = null);
    System.Threading.Tasks.Task<User?> GetByUserNameAsync(string userName);
    System.Threading.Tasks.Task<User?> GetUserWithRolesAndActionsAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<User>> GetUsersByDepartmentAsync(int departmentId);
}

public interface ITaskRepository : IRepository<TaskEntity>
{
    System.Threading.Tasks.Task<(IEnumerable<TaskEntity> Tasks, int TotalCount)> GetTasksAsync(int page, int limit, int? sprintId = null, int? projectId = null, int? assigneeId = null, int? statusId = null);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksBySprintAsync(int sprintId);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksByAssigneeAsync(int assigneeId);
    System.Threading.Tasks.Task<IEnumerable<TaskEntity>> GetTasksByProjectAsync(int projectId);
    System.Threading.Tasks.Task<TaskEntity?> GetTaskWithSubTasksAsync(int id);
}

public interface ISprintRepository : IRepository<Sprint>
{
    System.Threading.Tasks.Task<(IEnumerable<Sprint> Sprints, int TotalCount)> GetSprintsAsync(int page, int limit, int? projectId = null, int? status = null);
    System.Threading.Tasks.Task<IEnumerable<Sprint>> GetSprintsByProjectAsync(int projectId);
    System.Threading.Tasks.Task<Sprint?> GetActiveSprintByProjectAsync(int projectId);
}

public interface IRequirementRepository : IRepository<Requirement>
{
    System.Threading.Tasks.Task<(IEnumerable<Requirement> Requirements, int TotalCount)> GetRequirementsAsync(int page, int limit, int? projectId = null, string? status = null, string? priority = null);
    System.Threading.Tasks.Task<IEnumerable<Requirement>> GetRequirementsByProjectAsync(int projectId);
    System.Threading.Tasks.Task<IEnumerable<Requirement>> GetRequirementsByAssigneeAsync(int assigneeId);
    System.Threading.Tasks.Task<Requirement?> GetRequirementWithCommentsAsync(int id);
}

public interface IDepartmentRepository : IRepository<Department>
{
    System.Threading.Tasks.Task<(IEnumerable<Department> Departments, int TotalCount)> GetDepartmentsAsync(int page, int limit, bool? isActive = null);
    System.Threading.Tasks.Task<IEnumerable<Department>> GetActiveDepartmentsAsync();
}

public interface IUnitRepository : IRepository<Unit>
{
    System.Threading.Tasks.Task<(IEnumerable<Unit> Units, int TotalCount)> GetUnitsAsync(int page, int limit, bool? isActive = null);
    System.Threading.Tasks.Task<IEnumerable<Unit>> GetActiveUnitsAsync();
}

public interface IRoleRepository : IRepository<Role>
{
    System.Threading.Tasks.Task<(IEnumerable<Role> Roles, int TotalCount)> GetRolesAsync(int page, int limit, bool? isActive = null);
    System.Threading.Tasks.Task<IEnumerable<Role>> GetActiveRolesAsync();
    System.Threading.Tasks.Task<Role?> GetRoleWithActionsAsync(int id);
}

public interface IActionRepository : IRepository<Permission>
{
    System.Threading.Tasks.Task<IEnumerable<Permission>> GetActionsAsync(int page, int limit, string? category = null, bool? isActive = null);
    System.Threading.Tasks.Task<IEnumerable<Permission>> GetActiveActionsAsync();
    System.Threading.Tasks.Task<IEnumerable<Permission>> GetActionsByCategoryAsync(string category);
}

public interface INotificationRepository : IRepository<Notification>
{
    System.Threading.Tasks.Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetNotificationsAsync(int page, int limit, int? userId = null, bool? isRead = null);
    System.Threading.Tasks.Task<IEnumerable<Notification>> GetNotificationsByUserAsync(int userId);
    System.Threading.Tasks.Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(int userId);
    System.Threading.Tasks.Task MarkAsReadAsync(int notificationId);
    System.Threading.Tasks.Task MarkAllAsReadAsync(int userId);
}

public interface IEmployeeRepository : IRepository<Employee>
{
    System.Threading.Tasks.Task<(IEnumerable<Employee> Employees, int TotalCount)> GetEmployeesAsync(int page, int limit, int? statusId = null);
}


