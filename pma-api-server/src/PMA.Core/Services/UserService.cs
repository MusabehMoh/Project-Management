using PMA.Core.Entities;
using PMA.Core.DTOs;
using PMA.Core.Interfaces;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;

namespace PMA.Core.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IActionRepository _actionRepository;
    private readonly IUserContextAccessor _userContextAccessor;
    private readonly IMemoryCache _cache;
    private readonly ICacheInvalidationService _cacheInvalidationService;

    public UserService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IActionRepository actionRepository,
        IUserContextAccessor userContextAccessor,
        IMemoryCache cache,
        ICacheInvalidationService cacheInvalidationService)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _actionRepository = actionRepository;
        _userContextAccessor = userContextAccessor;
        _cache = cache;
        _cacheInvalidationService = cacheInvalidationService;
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

    public async System.Threading.Tasks.Task<User?> GetUserByPrsIdAsync(int prsId)
    {
        return await _userRepository.GetByPrsIdAsync(prsId);
    }
   
    public async System.Threading.Tasks.Task<User> CreateUserAsync(User user)
    {
        // Check if user already exists by UserName
        var existingUserByUsername = await _userRepository.GetByUserNameAsync(user.UserName);
        if (existingUserByUsername != null)
        {
            throw new InvalidOperationException($"User with username '{user.UserName}' already exists.");
        }

        // Check if user already exists by PrsId
        var existingUserByPrsId = await _userRepository.GetByPrsIdAsync(user.PrsId);
        if (existingUserByPrsId != null)
        {
            throw new InvalidOperationException($"User with PRS ID '{user.PrsId}' already exists.");
        }

        user.CreatedAt = DateTime.Now;
        user.UpdatedAt = DateTime.Now;
        return await _userRepository.AddAsync(user);
    }

    public async Task<(IEnumerable<UserDto> Users, int TotalCount)> GetUsersAsync(int page, int limit, string? search = null, bool? isActive = null, int? departmentId = null, int? roleId = null)
    {
        var (users, totalCount) = await _userRepository.GetUsersAsync(page, limit, search, isActive, departmentId, roleId);
        var userDtos = users.Select(MapToUserDto);
        return (userDtos, totalCount);
    }

    public async Task<User?> UpdateUserAsync(User user)
    {
        // Load existing tracked entity to avoid double-tracking issues
        var existing = await _userRepository.GetByIdAsync(user.Id);
        if (existing == null)
        {
            return null;
        }

        // Copy fields from incoming DTO/entity onto the tracked instance
        existing.UserName = user.UserName;
        existing.PrsId = user.PrsId;
        existing.IsActive = user.IsActive;
        existing.FullName = user.FullName;
        existing.MilitaryNumber = user.MilitaryNumber;
        existing.GradeName = user.GradeName;
        existing.DepartmentId = user.DepartmentId;
        existing.Email = user.Email;
        existing.Phone = user.Phone;
        existing.UpdatedAt = DateTime.Now;

        await _userRepository.UpdateAsync(existing);

        // Invalidate cache for this user
        await _cacheInvalidationService.InvalidateCurrentUserCacheByIdAsync(existing.Id, _userRepository);

        return existing;
    }

    public async System.Threading.Tasks.Task<bool> DeleteUserAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return false;
        }

        // Check for dependencies before deletion
        var dependencies = await _userRepository.CheckUserDependenciesAsync(id);
        if (dependencies.Any())
        {
            var errorMessage = $"Cannot delete user. User is referenced in: {string.Join(", ", dependencies)}";
            throw new InvalidOperationException(errorMessage);
        }

        await _userRepository.DeleteAsync(user);
        return true;
    }

    public async System.Threading.Tasks.Task<User?> GetUserWithRolesAndActionsAsync(int id)
    {
        return await _userRepository.GetUserWithRolesAndActionsAsync(id);
    }

    public async System.Threading.Tasks.Task<CurrentUserDto?> GetCurrentUserAsync()
    {
        
        // Use the new UserContext pattern
        var userContext = await _userContextAccessor.GetUserContextAsync();

        if (!userContext.IsAuthenticated || string.IsNullOrWhiteSpace(userContext.UserName))
            return null;

        var cacheKey = CacheInvalidationService.GetCurrentUserCacheKey(userContext.UserName);

        // Try to get from cache first
        if (_cache.TryGetValue(cacheKey, out CurrentUserDto? cachedUser))
        {
            if (cachedUser?.PrsId > 0)
                return cachedUser;
            else
                _cache.Remove(cacheKey); // Remove invalid cache entry
        }

        // Get user from repository using the username from UserContext
        var user = await _userRepository.GetByUserNameAsync(userContext.UserName);

        if (user == null)
            return null;

        var currentUserDto = MapToCurrentUserDto(user);

        // Cache the result for 15 minutes
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(15))
            .SetSize(1); // Set a size value for the cache entry

        _cache.Set(cacheKey, currentUserDto, cacheOptions);

        return currentUserDto;
    }

    private CurrentUserDto MapToCurrentUserDto(User user)
    {
        var currentUserDto = new CurrentUserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            PrsId = user.PrsId,
            IsActive = user.IsActive,
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
                Code = ur.Role?.Code ?? string.Empty,
                IsActive = ur.Role?.IsActive ?? false,
                RoleOrder = ur.Role?.RoleOrder ?? 0,
                Department=ur.Role?.Department != null ? new DepartmentDto
                {
                    Id = ur.Role.Department.Id,
                    Name = ur.Role.Department.Name,
                    IsActive = ur.Role.Department.IsActive
                } : null,
                Actions = ur.Role?.RoleActions?.Select(ra => new ActionDto
                {
                    Id = ra.Permission?.Id ?? 0,
                    Name = ra.Permission?.Name ?? string.Empty,
                    Description = ra.Permission?.Description,
                    Category = ra.Permission?.Category ?? string.Empty, 
                    IsActive = ra.Permission?.IsActive ?? false
                }).ToList()
            }).ToList(),
            Actions = user.UserActions?.Select(ua => new ActionDto
            {
                Id = ua.Permission?.Id ?? 0,
                Name = ua.Permission?.Name ?? string.Empty,
                Description = ua.Permission?.Description,
                Category = ua.Permission?.Category ?? string.Empty, 
                IsActive = ua.Permission?.IsActive ?? false, 
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
            IsActive = user.IsActive,
            DepartmentId = user.DepartmentId,
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
                IsActive = ur.Role?.IsActive ?? false,
                RoleOrder = ur.Role?.RoleOrder ?? 0,
                Actions = ur.Role?.RoleActions?.Select(ra => new ActionDto
                {
                    Id = ra.Permission?.Id ?? 0,
                    Name = ra.Permission?.Name ?? string.Empty,
                    Description = ra.Permission?.Description,
                    Category = ra.Permission?.Category ?? string.Empty, 
                    IsActive = ra.Permission?.IsActive ?? false, 
                }).ToList()
            }).ToList(),
            Actions = user.UserActions?.Select(ua => new ActionDto
            {
                Id = ua.Permission?.Id ?? 0,
                Name = ua.Permission?.Name ?? string.Empty,
                Description = ua.Permission?.Description,
                Category = ua.Permission?.Category ?? string.Empty, 
                IsActive = ua.Permission?.IsActive ?? false
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
                        AssignedAt = DateTime.Now
                    });
                }
            }
        }

        await _userRepository.UpdateAsync(user);

        // Invalidate cache for this user
        await _cacheInvalidationService.InvalidateCurrentUserCacheByIdAsync(userId, _userRepository);
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
                        AssignedAt = DateTime.Now
                    });
                }
            }
        }

        await _userRepository.UpdateAsync(user);

        // Invalidate cache for this user
        await _cacheInvalidationService.InvalidateCurrentUserCacheByIdAsync(userId, _userRepository);
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



