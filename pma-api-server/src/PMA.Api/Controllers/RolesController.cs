using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ApiBaseController
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    /// <summary>
    /// Get all roles with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetRoles(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] bool? isActive = null)
    {
        try
        {
            var (roles, totalCount) = await _roleService.GetRolesAsync(page, limit, isActive);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(roles, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Role>>("An error occurred while retrieving roles", ex.Message);
        }
    }

    /// <summary>
    /// Get role by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetRoleById(int id)
    {
        try
        {
            var role = await _roleService.GetRoleByIdAsync(id);
            if (role == null)
                return NotFound(Error<Role>("Role not found", null, 404));
            return Success(role);
        }
        catch (Exception ex)
        {
            return Error<Role>("An error occurred while retrieving the role", ex.Message);
        }
    }

    /// <summary>
    /// Create a new role
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Role), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateRole([FromBody] Role role)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var createdRole = await _roleService.CreateRoleAsync(role);
            return CreatedAtAction(nameof(GetRoleById), new { id = createdRole.Id }, createdRole);
        }
        catch (Exception ex)
        {
            return Error<Role>("An error occurred while creating the role", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing role
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Role), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] Role role)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            if (id != role.Id)
                return BadRequest(Error<Role>("ID mismatch", null, 400));
            var updatedRole = await _roleService.UpdateRoleAsync(role);
            if (updatedRole == null)
                return NotFound(Error<Role>("Role not found", null, 404));
            return Success(updatedRole);
        }
        catch (Exception ex)
        {
            return Error<Role>("An error occurred while updating the role", ex.Message);
        }
    }

    /// <summary>
    /// Delete a role
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteRole(int id)
    {
        try
        {
            var result = await _roleService.DeleteRoleAsync(id);
            if (!result)
                return NotFound(Error<Role>("Role not found", null, 404));
            return NoContent();
        }
        catch (Exception ex)
        {
            return Error<Role>("An error occurred while deleting the role", ex.Message);
        }
    }
}