using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Api.Attributes;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")] 
//[RequireRole("Administrator", "AnalystManager", "DevelopmentManager", "QCManager", "DesignerManager")]
public class UsersController : ApiBaseController
{
    private readonly IUserService _userService;
    private readonly IEmployeeService _employeeService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, IEmployeeService employeeService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _employeeService = employeeService;
        _logger = logger;
    }

    /// <summary>
    /// Get all users with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    [RequirePermission("users.read")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int? departmentId = null,
        [FromQuery] int? roleId = null)
    {
        try
        {
            var (users, totalCount) = await _userService.GetUsersAsync(page, limit, search, isActive, departmentId, roleId);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(users, pagination);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving users. Page: {Page}, Limit: {Limit}, Search: {Search}, IsActive: {IsVisible}, DepartmentId: {DepartmentId}, RoleId: {RoleId}",
                page, limit, search, isActive, departmentId, roleId);

            return Error<IEnumerable<UserDto>>("An error occurred while retrieving users", ex.Message);
        }
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]

    public async Task<IActionResult> GetUserById(int id)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return Error<User>("User not found");
            }
            
            return Success(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving user by ID. UserId: {UserId}", id);

            return Error<User>("An error occurred while retrieving the user", ex.Message);
        }
    }

    /// <summary>
    /// Get user by username
    /// </summary>
    [HttpGet("by-username/{userName}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetUserByUserName(string userName)
    {
        try
        {
            var user = await _userService.GetUserByUserNameAsync(userName);
            if (user == null)
            {
                return Error<User>("User not found");
            }
            
            return Success(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving user by username. UserName: {UserName}", userName);

            return Error<User>("An error occurred while retrieving the user", ex.Message);
        }
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    [RequirePermission("users.create")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<User>("Invalid model state", ModelState.ToString());
            }

            // Fetch employee data using prsId
            var employee = await _employeeService.GetEmployeeByIdAsync(request.PrsId);
            if (employee == null)
            {
                return Error<User>($"Employee with PRS ID {request.PrsId} not found");
            }

            // Create User entity from request and employee data
            var user = new User
            {
                Id = request.Id,
                UserName = request.UserName,
                PrsId = request.PrsId,
                IsActive = request.IsActive,
                FullName = employee.FullName, // From employee
                MilitaryNumber = employee.MilitaryNumber, // From employee
                GradeName = employee.GradeName, // From employee
                //Department = request.Department,
                //Email = request.Email, // Can be overridden in request
                //Phone = request.Phone, // Can be overridden in request
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdUser = await _userService.CreateUserAsync(user);

            // Assign roles and actions if provided
            if (request.RoleIds != null && request.RoleIds.Any())
            {
                await _userService.AssignRolesToUserAsync(createdUser.Id, request.RoleIds);
                _logger.LogInformation("Assigned {RoleCount} roles to user {UserId}", request.RoleIds.Count, createdUser.Id);
            }

            if (request.ActionIds != null && request.ActionIds.Any())
            {
                await _userService.AssignActionsToUserAsync(createdUser.Id, request.ActionIds);
                _logger.LogInformation("Assigned {ActionCount} actions to user {UserId}", request.ActionIds.Count, createdUser.Id);
            }

            var response = new ApiResponse<User>
            {
                Success = true,
                Data = createdUser,
                Message = "User created successfully"
            };
            return CreatedAtAction(nameof(GetUserById), new { id = createdUser.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating user. UserName: {UserName}, PrsId: {PrsId}",
                request?.UserName, request?.PrsId);

            return Error<User>("An error occurred while creating the user", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing user
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [RequirePermission("users.update")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return Error<User>("Invalid model state", ModelState.ToString());
            }

            if (id != request.Id)
            {
                return Error<User>("ID mismatch");
            }

            // Fetch employee data using prsId
            var employee = await _employeeService.GetEmployeeByIdAsync(request.PrsId);
            if (employee == null)
            {
                return Error<User>($"Employee with PRS ID {request.PrsId} not found");
            }

            // Create User entity from request and employee data
            var user = new User
            {
                Id = request.Id,
                UserName = request.UserName,
                PrsId = request.PrsId,
                IsActive = request.IsActive,
                FullName = employee.FullName, // From employee
                MilitaryNumber = employee.MilitaryNumber, // From employee
                GradeName = employee.GradeName, // From employee
                DepartmentId = request.DepartmentId,
                //Email = request.Email, // Can be overridden in request
                //Phone = request.Phone, // Can be overridden in request
                UpdatedAt = DateTime.UtcNow
            };

            var updatedUser = await _userService.UpdateUserAsync(user);
            if (updatedUser == null)
            {
                return Error<User>("User not found");
            }

            // Update roles and actions if provided
            if (request.RoleIds != null)
            {
                await _userService.AssignRolesToUserAsync(updatedUser.Id, request.RoleIds);
                _logger.LogInformation("Updated roles for user {UserId} with {RoleCount} roles", updatedUser.Id, request.RoleIds.Count);
            }

            if (request.ActionIds != null)
            {
                await _userService.AssignActionsToUserAsync(updatedUser.Id, request.ActionIds);
                _logger.LogInformation("Updated actions for user {UserId} with {ActionCount} actions", updatedUser.Id, request.ActionIds.Count);
            }
            
            var response = new ApiResponse<User>
            {
                Success = true,
                Data = updatedUser,
                Message = "User updated successfully"
            };
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating user. UserId: {UserId}, UserName: {UserName}",
                id, request?.UserName);

            return Error<User>("An error occurred while updating the user", ex.Message);
        }
    }

    /// <summary>
    /// Delete a user
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    [RequirePermission("users.delete")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        try
        {
            var result = await _userService.DeleteUserAsync(id);
            if (!result)
            {
                return Error<object>("User not found");
            }
            
            var response = new ApiResponse<object>
            {
                Success = true,
                Message = "User deleted successfully"
            };
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting user. UserId: {UserId}", id);

            return Error<object>("An error occurred while deleting the user", ex.Message);
        }
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var user = await _userService.GetCurrentUserAsync();
            if (user == null)
            {
                return Error<CurrentUserDto>("Current user not found");
            }
            
            return Success(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving current user profile");

            return Error<CurrentUserDto>("An error occurred while retrieving the current user", ex.Message);
        }
    }
}