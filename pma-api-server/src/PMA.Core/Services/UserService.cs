using PMA.Core.Entities;
using PMA.Core.DTOs;
using PMA.Core.Interfaces;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IActionRepository _actionRepository;

    public UserService(IUserRepository userRepository, IRoleRepository roleRepository, IActionRepository actionRepository)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _actionRepository = actionRepository;
    }

    public async System.Threading.Tasks.Task<IEnumerable<User>> GetAllUsersAsync()
    {
        return await _userRepository.GetAllAsync();
    }

    public async System.Threading.Tasks.Task<User?> GetUserByIdAsync(int id)
    {
        return await _userRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<User?> GetUserByUserNameAsync(string userName)
    {
        return await _userRepository.GetByUserNameAsync(userName);
    }

    public async System.Threading.Tasks.Task<User> CreateUserAsync(User user)
    {
        user.CreatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        return await _userRepository.AddAsync(user);
    }

    public async Task<(IEnumerable<UserDto> Users, int TotalCount)> GetUsersAsync(int page, int limit, bool? isVisible = null, int? departmentId = null)
    {
        var (users, totalCount) = await _userRepository.GetUsersAsync(page, limit, isVisible, departmentId);
        var userDtos = users.Select(MapToUserDto);
        return (userDtos, totalCount);
    }

    public async Task<User> UpdateUserAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);
        return user;
    }

    public async System.Threading.Tasks.Task<bool> DeleteUserAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user != null)
        {
            await _userRepository.DeleteAsync(user);
            return true;
        }
        return false;
    }

    public async System.Threading.Tasks.Task<User?> GetUserWithRolesAndActionsAsync(int id)
    {
        return await _userRepository.GetUserWithRolesAndActionsAsync(id);
    }

    public async System.Threading.Tasks.Task<CurrentUserDto?> GetCurrentUserAsync()
    {
        // For now, return the first user as current user (placeholder until authentication is implemented)
        var user = await _userRepository.GetByUserNameAsync("admin"); 
        
        if (user == null)
            return null; 

        // Map to CurrentUserDto
        return MapToCurrentUserDto(user);
    }

    private CurrentUserDto MapToCurrentUserDto(User user)
    {
        var currentUserDto = new CurrentUserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            PrsId = user.PrsId,
            IsVisible = user.IsVisible,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Employee = user.Employee != null ? new EmployeeDto
            {
                Id = user.Employee.Id,
                UserName = user.Employee.UserName,
                MilitaryNumber = user.Employee.MilitaryNumber,
                GradeName = user.Employee.GradeName,
                FullName = user.Employee.FullName,
                StatusId = user.Employee.StatusId
            } : null,
            Roles = user.UserRoles?.Select(ur => new RoleDto
            {
                Id = ur.Role?.Id ?? 0,
                Name = ur.Role?.Name ?? string.Empty,
                Active = ur.Role?.IsActive ?? false,
                RoleOrder = ur.Role?.RoleOrder ?? 0,
                Actions = ur.Role?.RoleActions?.Select(ra => new ActionDto
                {
                    Id = ra.Permission?.Id ?? 0,
                    Name = ra.Permission?.Name ?? string.Empty,
                    Description = ra.Permission?.Description,
                    Category = ra.Permission?.Category ?? string.Empty,
                    Resource = ra.Permission?.Resource ?? string.Empty,
                    Action = ra.Permission?.Action ?? string.Empty,
                    IsActive = ra.Permission?.IsActive ?? false,
                    CreatedAt = ra.Permission?.CreatedAt ?? DateTime.UtcNow,
                    UpdatedAt = ra.Permission?.UpdatedAt ?? DateTime.UtcNow
                }).ToList()
            }).ToList(),
            Actions = user.UserActions?.Select(ua => new ActionDto
            {
                Id = ua.Permission?.Id ?? 0,
                Name = ua.Permission?.Name ?? string.Empty,
                Description = ua.Permission?.Description,
                Category = ua.Permission?.Category ?? string.Empty,
                Resource = ua.Permission?.Resource ?? string.Empty,
                Action = ua.Permission?.Action ?? string.Empty,
                IsActive = ua.Permission?.IsActive ?? false,
                CreatedAt = ua.Permission?.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = ua.Permission?.UpdatedAt ?? DateTime.UtcNow
            }).ToList()
        };

        // Set flattened employee properties
        if (user.Employee != null)
        {
            currentUserDto.FullName = user.Employee.FullName;
            currentUserDto.MilitaryNumber = user.Employee.MilitaryNumber;
            currentUserDto.GradeName = user.Employee.GradeName;
            // Department, Email, Phone would need to be added to Employee entity if needed
        }

        return currentUserDto;
    }

    private UserDto MapToUserDto(User user)
    {
        var userDto = new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            PrsId = user.PrsId,
            IsVisible = user.IsVisible,
            Department = user.Department,
            Email = user.Email,
            Phone = user.Phone,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Employee = user.Employee != null ? new EmployeeDto
            {
                Id = user.Employee.Id,
                UserName = user.Employee.UserName,
                MilitaryNumber = user.Employee.MilitaryNumber,
                GradeName = user.Employee.GradeName,
                FullName = user.Employee.FullName,
                StatusId = user.Employee.StatusId
            } : null,
            Roles = user.UserRoles?.Select(ur => new RoleDto
            {
                Id = ur.Role?.Id ?? 0,
                Name = ur.Role?.Name ?? string.Empty,
                Active = ur.Role?.IsActive ?? false,
                RoleOrder = ur.Role?.RoleOrder ?? 0,
                Actions = ur.Role?.RoleActions?.Select(ra => new ActionDto
                {
                    Id = ra.Permission?.Id ?? 0,
                    Name = ra.Permission?.Name ?? string.Empty,
                    Description = ra.Permission?.Description,
                    Category = ra.Permission?.Category ?? string.Empty,
                    Resource = ra.Permission?.Resource ?? string.Empty,
                    Action = ra.Permission?.Action ?? string.Empty,
                    IsActive = ra.Permission?.IsActive ?? false,
                    CreatedAt = ra.Permission?.CreatedAt ?? DateTime.UtcNow,
                    UpdatedAt = ra.Permission?.UpdatedAt ?? DateTime.UtcNow
                }).ToList()
            }).ToList(),
            Actions = user.UserActions?.Select(ua => new ActionDto
            {
                Id = ua.Permission?.Id ?? 0,
                Name = ua.Permission?.Name ?? string.Empty,
                Description = ua.Permission?.Description,
                Category = ua.Permission?.Category ?? string.Empty,
                Resource = ua.Permission?.Resource ?? string.Empty,
                Action = ua.Permission?.Action ?? string.Empty,
                IsActive = ua.Permission?.IsActive ?? false,
                CreatedAt = ua.Permission?.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = ua.Permission?.UpdatedAt ?? DateTime.UtcNow
            }).ToList()
        };

        // Set flattened employee properties
        if (user.Employee != null)
        {
            userDto.FullName = user.Employee.FullName;
            userDto.MilitaryNumber = user.Employee.MilitaryNumber;
            userDto.GradeName = user.Employee.GradeName;
        }

        return userDto;
    }

    public async System.Threading.Tasks.Task AssignRolesToUserAsync(int userId, List<int> roleIds)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new ArgumentException($"User with ID {userId} not found");

        // Get existing user roles
        var existingUserRoles = user.UserRoles ?? new List<UserRole>();

        // Remove existing roles that are not in the new list
        var rolesToRemove = existingUserRoles.Where(ur => !roleIds.Contains(ur.RoleId)).ToList();
        foreach (var userRole in rolesToRemove)
        {
            user.UserRoles!.Remove(userRole);
        }

        // Add new roles that don't already exist
        foreach (var roleId in roleIds)
        {
            if (!existingUserRoles.Any(ur => ur.RoleId == roleId))
            {
                var role = await _roleRepository.GetByIdAsync(roleId);
                if (role != null)
                {
                    user.UserRoles!.Add(new UserRole
                    {
                        UserId = userId,
                        RoleId = roleId,
                        IsActive = true,
                        AssignedAt = DateTime.UtcNow
                    });
                }
            }
        }

        await _userRepository.UpdateAsync(user);
    }

    public async System.Threading.Tasks.Task AssignActionsToUserAsync(int userId, List<int> actionIds)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new ArgumentException($"User with ID {userId} not found");

        // Get existing user actions
        var existingUserActions = user.UserActions ?? new List<UserAction>();

        // Remove existing actions that are not in the new list
        var actionsToRemove = existingUserActions.Where(ua => !actionIds.Contains(ua.ActionId)).ToList();
        foreach (var userAction in actionsToRemove)
        {
            user.UserActions!.Remove(userAction);
        }

        // Add new actions that don't already exist
        foreach (var actionId in actionIds)
        {
            if (!existingUserActions.Any(ua => ua.ActionId == actionId))
            {
                var action = await _actionRepository.GetByIdAsync(actionId);
                if (action != null)
                {
                    user.UserActions!.Add(new UserAction
                    {
                        UserId = userId,
                        ActionId = actionId,
                        IsActive = true,
                        AssignedAt = DateTime.UtcNow
                    });
                }
            }
        }

        await _userRepository.UpdateAsync(user);
    }

    public async System.Threading.Tasks.Task RemoveUserRolesAsync(int userId, List<int> roleIds)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new ArgumentException($"User with ID {userId} not found");

        if (user.UserRoles == null)
            return;

        var rolesToRemove = user.UserRoles.Where(ur => roleIds.Contains(ur.RoleId)).ToList();
        foreach (var userRole in rolesToRemove)
        {
            user.UserRoles.Remove(userRole);
        }

        await _userRepository.UpdateAsync(user);
    }

    public async System.Threading.Tasks.Task RemoveUserActionsAsync(int userId, List<int> actionIds)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new ArgumentException($"User with ID {userId} not found");

        if (user.UserActions == null)
            return;

        var actionsToRemove = user.UserActions.Where(ua => actionIds.Contains(ua.ActionId)).ToList();
        foreach (var userAction in actionsToRemove)
        {
            user.UserActions.Remove(userAction);
        }

        await _userRepository.UpdateAsync(user);
    }
}



