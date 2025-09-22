using Microsoft.AspNetCore.Mvc;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ApiBaseController
{
    private readonly IEmployeeService _employeeService;
    private readonly IDepartmentService _departmentService;

    public EmployeesController(IEmployeeService employeeService, IDepartmentService departmentService)
    {
        _employeeService = employeeService;
        _departmentService = departmentService;
    }

    /// <summary>
    /// Get all employees with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? statusId = null)
    {
        try
        {
            var (employees, totalCount) = await _employeeService.GetEmployeesAsync(page, limit, statusId);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(employees, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<Employee>>("An error occurred while retrieving employees", ex.Message);
        }
    }

    /// <summary>
    /// Get employee by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(EmployeeDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetEmployeeById(int id)
    {
        try
        {
            var employee = await _employeeService.GetEmployeeByIdAsync(id);
            if (employee == null)
            {
                return NotFound(new { message = "Employee not found" });
            }
            return Ok(employee);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving the employee", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new employee
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(EmployeeDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateEmployee([FromBody] Employee employee)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdEmployee = await _employeeService.CreateEmployeeAsync(employee);
            return CreatedAtAction(nameof(GetEmployeeById), new { id = createdEmployee.Id }, createdEmployee);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the employee", error = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing employee
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(EmployeeDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateEmployee(int id, [FromBody] Employee employee)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != employee.Id)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            var updatedEmployee = await _employeeService.UpdateEmployeeAsync(employee);
            if (updatedEmployee == null)
            {
                return NotFound(new { message = "Employee not found" });
            }
            return Ok(updatedEmployee);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating the employee", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete an employee
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteEmployee(int id)
    {
        try
        {
            var result = await _employeeService.DeleteEmployeeAsync(id);
            if (!result)
            {
                return NotFound(new { message = "Employee not found" });
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting the employee", error = ex.Message });
        }
    }

    /// <summary>
    /// Search employees
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> SearchEmployees([FromQuery] string q, [FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest(new { message = "Search query is required" });
            }

            var (employees, totalCount) = await _employeeService.SearchEmployeesAsync(q, page, limit);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(employees, pagination);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<EmployeeDto>>("An error occurred while searching employees", ex.Message);
        }
    }

    /// <summary>
    /// Search users in teams
    /// </summary>
    [HttpGet("searchUsers")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> SearchUsers([FromQuery] string q)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest(Error<IEnumerable<EmployeeDto>>("Search query is required", null, 400));
            }

            var employees = await _departmentService.SearchUsersInTeamsAsync(q);
            return Success(employees);
        }
        catch (Exception ex)
        {
            return Error<IEnumerable<EmployeeDto>>("An error occurred while searching users in teams", ex.Message);
        }
    }
}