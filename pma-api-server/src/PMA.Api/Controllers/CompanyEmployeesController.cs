using Microsoft.AspNetCore.Mvc;
using PMA.Core.DTOs;
using PMA.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PMA.Api.Controllers;

[ApiController] 
[Route("api/company-employees")]
public class CompanyEmployeesController : ApiBaseController
{
    private readonly ICompanyEmployeeService _companyEmployeeService;
    private readonly ILogger<CompanyEmployeesController> _logger;

    public CompanyEmployeesController(
        ICompanyEmployeeService companyEmployeeService,
        ILogger<CompanyEmployeesController> logger)
    {
        _companyEmployeeService = companyEmployeeService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetCompanyEmployees(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null)
    {
        try
        {
            var (items, totalCount) = await _companyEmployeeService.GetCompanyEmployeesAsync(
                page, limit, search);
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            
            var pagination = new PaginationInfo(page, limit, totalCount, totalPages);
            return Success(items, pagination);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving company employees. Page: {Page}, Limit: {Limit}, Search: {Search}", 
                page, limit, search);
            return Error<IEnumerable<CompanyEmployeeDto>>("An error occurred while retrieving company employees", ex.Message);
        }
    }

    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetCompanyEmployee(int id)
    {
        try
        {
            var companyEmployee = await _companyEmployeeService.GetCompanyEmployeeByIdAsync(id);
            if (companyEmployee == null)
            {
                return NotFound($"Company Employee with ID {id} not found");
            }

            return Success(companyEmployee);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving company employee with ID: {Id}", id);
            return Error<CompanyEmployeeDto>("An error occurred while retrieving the company employee", ex.Message);
        }
    }

    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateCompanyEmployee([FromBody] CreateCompanyEmployeeDto createDto)
    {
        try
        {
            var createdBy = "system"; // TODO: Get from user context
            var companyEmployee = await _companyEmployeeService.CreateCompanyEmployeeAsync(createDto, createdBy);
            return Success(companyEmployee);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Validation error creating company employee: {Message}", ex.Message);
            return Error<CompanyEmployeeDto>(ex.Message, null, 400);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Business rule violation creating company employee: {Message}", ex.Message);
            return Error<CompanyEmployeeDto>(ex.Message, null, 400);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error creating company employee");
            
            // Handle constraint violations
            if (ex.InnerException?.Message.Contains("IX_CompanyEmployees_UserName") == true)
            {
                return Error<CompanyEmployeeDto>("User with this username already exists", null, 400);
            }
            if (ex.InnerException?.Message.Contains("PK_CompanyEmployees") == true)
            {
                return Error<CompanyEmployeeDto>("Company Employee with this ID already exists", null, 400);
            }
            
            return Error<CompanyEmployeeDto>("A database error occurred while creating the company employee", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating company employee");
            return Error<CompanyEmployeeDto>("An error occurred while creating the company employee", ex.Message);
        }
    }

    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateCompanyEmployee(int id, [FromBody] UpdateCompanyEmployeeDto updateDto)
    {
        try
        {
            var updatedBy = "system"; // TODO: Get from user context
            var companyEmployee = await _companyEmployeeService.UpdateCompanyEmployeeAsync(id, updateDto, updatedBy);
            return Success(companyEmployee);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Validation error updating company employee {Id}: {Message}", id, ex.Message);
            return Error<CompanyEmployeeDto>(ex.Message, null, 400);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Business rule violation updating company employee {Id}: {Message}", id, ex.Message);
            
            if (ex.Message.Contains("not found"))
            {
                return Error<CompanyEmployeeDto>(ex.Message, null, 404);
            }
            
            return Error<CompanyEmployeeDto>(ex.Message, null, 400);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating company employee {Id}", id);
            
            // Handle constraint violations
            if (ex.InnerException?.Message.Contains("IX_CompanyEmployees_UserName") == true)
            {
                return Error<CompanyEmployeeDto>("User with this username already exists", null, 400);
            }
            
            return Error<CompanyEmployeeDto>("A database error occurred while updating the company employee", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating company employee {Id}", id);
            return Error<CompanyEmployeeDto>("An error occurred while updating the company employee", ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteCompanyEmployee(int id)
    {
        try
        {
            await _companyEmployeeService.DeleteCompanyEmployeeAsync(id);
            return Success($"Company Employee with ID {id} deleted successfully");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Error deleting company employee {Id}: {Message}", id, ex.Message);
            return Error<string>(ex.Message, null, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting company employee {Id}", id);
            return Error<string>("An error occurred while deleting the company employee", ex.Message);
        }
    }
}