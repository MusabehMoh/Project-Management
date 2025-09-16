using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]

// Refactored for SOLID and clean code:
// - Extracted response and error helpers (Single Responsibility, DRY)
// - Use DTOs for input/output (Open/Closed, Clean Code)
// - Improved readability and method size
public class DepartmentsController : ApiBaseController
{
    private readonly IDepartmentService _departmentService;
    private readonly ILogger<DepartmentsController> _logger;

    public DepartmentsController(IDepartmentService departmentService, ILogger<DepartmentsController> logger)
    {
        _departmentService = departmentService;
        _logger = logger;
    }


    /// <summary>
    /// Get all departments with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetDepartments(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] bool? isActive = null)
    {
        try
        {
            var (departments, totalCount) = await _departmentService.GetDepartmentsAsync(page, limit, isActive);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            // Map to DTOs
            var dtos = departments.Select(d => new DepartmentDto { Id = d.Id, Name = d.Name, IsActive = d.IsActive });
            return Success(dtos, pagination);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving departments. Page: {Page}, Limit: {Limit}, IsActive: {IsActive}",
                page, limit, isActive);
            return Error<IEnumerable<DepartmentDto>>("An error occurred while retrieving departments", ex.Message);
        }
    }

    /// <summary>
    /// Get department by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetDepartmentById(int id)
    {
        try
        {
            var department = await _departmentService.GetDepartmentByIdAsync(id);
            if (department == null)
                return NotFound(Error<DepartmentDto>("Department not found", null, 404));
            var dto = new DepartmentDto { Id = department.Id, Name = department.Name, IsActive = department.IsActive };
            return Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving department by ID. DepartmentId: {DepartmentId}", id);
            return Error<DepartmentDto>("An error occurred while retrieving the department", ex.Message);
        }
    }

    /// <summary>
    /// Create a new department
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Department), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateDepartment([FromBody] DepartmentCreateDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            // Map DTO to entity
            var department = new Department { Name = dto.Name, IsActive = dto.IsActive };
            var createdDepartment = await _departmentService.CreateDepartmentAsync(department);
            var resultDto = new DepartmentDto { Id = createdDepartment.Id, Name = createdDepartment.Name, IsActive = createdDepartment.IsActive };
            return CreatedAtAction(nameof(GetDepartmentById), new { id = resultDto.Id }, resultDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating department. DepartmentName: {DepartmentName}",
                dto?.Name);
            return Error<DepartmentDto>("An error occurred while creating the department", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing department
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Department), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateDepartment(int id, [FromBody] DepartmentUpdateDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            if (id != dto.Id)
                return BadRequest(Error<DepartmentDto>("ID mismatch", null, 400));
            // Map DTO to entity
            var department = new Department { Id = dto.Id, Name = dto.Name, IsActive = dto.IsActive };
            var updatedDepartment = await _departmentService.UpdateDepartmentAsync(department);
            if (updatedDepartment == null)
                return NotFound(Error<DepartmentDto>("Department not found", null, 404));
            var resultDto = new DepartmentDto { Id = updatedDepartment.Id, Name = updatedDepartment.Name, IsActive = updatedDepartment.IsActive };
            return Success(resultDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating department. DepartmentId: {DepartmentId}, DepartmentName: {DepartmentName}",
                id, dto?.Name);
            return Error<DepartmentDto>("An error occurred while updating the department", ex.Message);
        }
    }

    /// <summary>
    /// Delete a department
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteDepartment(int id)
    {
        try
        {
            var result = await _departmentService.DeleteDepartmentAsync(id);
            if (!result)
                return NotFound(Error<DepartmentDto>("Department not found", null, 404));
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting department. DepartmentId: {DepartmentId}", id);
            return Error<DepartmentDto>("An error occurred while deleting the department", ex.Message);
        }
    }

    /// <summary>
    /// Get department members
    /// </summary>
    [HttpGet("{id}/members")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetDepartmentMembers(int id, [FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        try
        {
            // Check if department exists
            var department = await _departmentService.GetDepartmentByIdAsync(id);
            if (department == null)
                return NotFound(Error<TeamMemberDto>("Department not found", null, 404));

            var (members, totalCount) = await _departmentService.GetDepartmentMembersAsync(id, page, limit);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(members, pagination);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving department members. DepartmentId: {DepartmentId}", id);
            return Error<IEnumerable<TeamMemberDto>>("An error occurred while retrieving department members", ex.Message);
        }
    }

    /// <summary>
    /// Add member to department
    /// </summary>
    [HttpPost("{id}/members")]
    [ProducesResponseType(typeof(TeamMemberDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AddDepartmentMember(int id, [FromBody] AddMemberRequest request)
    {
        try
        {
            var member = await _departmentService.AddDepartmentMemberAsync(id, request.UserId, request.Role ?? "Member");
            return CreatedAtAction(nameof(GetDepartmentMembers), new { id }, member);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(Error<TeamMemberDto>(ex.Message, null, 404));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(Error<TeamMemberDto>(ex.Message, null, 400));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while adding department member. DepartmentId: {DepartmentId}, UserId: {UserId}",
                id, request?.UserId);
            return Error<TeamMemberDto>("An error occurred while adding the department member", ex.Message);
        }
    }

    /// <summary>
    /// Update department member
    /// </summary>
    [HttpPut("{id}/members/{memberId}")]
    [ProducesResponseType(typeof(TeamMemberDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateDepartmentMember(int id, int memberId, [FromBody] UpdateMemberRequest request)
    {
        try
        {
            var member = await _departmentService.UpdateDepartmentMemberAsync(id, memberId, request?.Role, request?.IsActive);
            return Success(member);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(Error<TeamMemberDto>(ex.Message, null, 404));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating department member. DepartmentId: {DepartmentId}, MemberId: {MemberId}",
                id, memberId);
            return Error<TeamMemberDto>("An error occurred while updating the department member", ex.Message);
        }
    }

    /// <summary>
    /// Remove member from department
    /// </summary>
    [HttpDelete("{id}/members/{memberId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RemoveDepartmentMember(int id, int memberId)
    {
        try
        {
            var result = await _departmentService.RemoveDepartmentMemberAsync(id, memberId);
            if (!result)
                return NotFound(Error<TeamMemberDto>("Member not found", null, 404));
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while removing department member. DepartmentId: {DepartmentId}, MemberId: {MemberId}",
                id, memberId);
            return Error<TeamMemberDto>("An error occurred while removing the department member", ex.Message);
        }
    }
}