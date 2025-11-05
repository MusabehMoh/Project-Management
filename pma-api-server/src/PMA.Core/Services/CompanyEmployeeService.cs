using PMA.Core.DTOs;
using PMA.Core.Entities;
using PMA.Core.Interfaces;

namespace PMA.Core.Services;

public class CompanyEmployeeService : ICompanyEmployeeService
{
    private readonly ICompanyEmployeeRepository _repository;

    public CompanyEmployeeService(ICompanyEmployeeRepository repository)
    {
        _repository = repository;
    }

    public async System.Threading.Tasks.Task<(IEnumerable<CompanyEmployeeDto> Items, int TotalCount)> GetCompanyEmployeesAsync(
        int page, int limit, string? search = null)
    {
        var (items, totalCount) = await _repository.GetCompanyEmployeesAsync(page, limit, search);
        var dtos = items.Select(MapToDto);
        return (dtos, totalCount);
    }

    public async System.Threading.Tasks.Task<CompanyEmployeeDto?> GetCompanyEmployeeByIdAsync(int id)
    {
        var companyEmployee = await _repository.GetCompanyEmployeeByIdAsync(id);
        return companyEmployee != null ? MapToDto(companyEmployee) : null;
    }

    public async System.Threading.Tasks.Task<CompanyEmployeeDto> CreateCompanyEmployeeAsync(CreateCompanyEmployeeDto createDto, string createdBy)
    {
        // Validation
        if (string.IsNullOrWhiteSpace(createDto.FullName))
        {
            throw new ArgumentException("Full Name is required");
        }

        if (string.IsNullOrWhiteSpace(createDto.UserName))
        {
            throw new ArgumentException("User Name is required");
        }

        // Check if UserName already exists
        if (await _repository.UserNameExistsAsync(createDto.UserName))
        {
            throw new InvalidOperationException($"User with username '{createDto.UserName}' already exists");
        }

        var companyEmployee = new CompanyEmployee
        {
            UserName = createDto.UserName,
            FullName = createDto.FullName,
            GradeName = createDto.GradeName,
            CreatedBy = createdBy
        };

        var created = await _repository.CreateCompanyEmployeeAsync(companyEmployee);
        return MapToDto(created);
    }

    public async System.Threading.Tasks.Task<CompanyEmployeeDto> UpdateCompanyEmployeeAsync(int id, UpdateCompanyEmployeeDto updateDto, string updatedBy)
    {
        // Validation
        if (string.IsNullOrWhiteSpace(updateDto.FullName))
        {
            throw new ArgumentException("Full Name is required");
        }

        if (string.IsNullOrWhiteSpace(updateDto.UserName))
        {
            throw new ArgumentException("User Name is required");
        }

        var existingEmployee = await _repository.GetCompanyEmployeeByIdAsync(id);
        if (existingEmployee == null)
        {
            throw new InvalidOperationException($"Company Employee with ID {id} not found");
        }

        // Check if UserName already exists (excluding current employee)
        if (await _repository.UserNameExistsAsync(updateDto.UserName, id))
        {
            throw new InvalidOperationException($"User with username '{updateDto.UserName}' already exists");
        }

        existingEmployee.UserName = updateDto.UserName;
        existingEmployee.FullName = updateDto.FullName;
        existingEmployee.GradeName = updateDto.GradeName;
        existingEmployee.UpdatedBy = updatedBy;

        var updated = await _repository.UpdateCompanyEmployeeAsync(existingEmployee);
        return MapToDto(updated);
    }

    public async System.Threading.Tasks.Task DeleteCompanyEmployeeAsync(int id)
    {
        var existingEmployee = await _repository.GetCompanyEmployeeByIdAsync(id);
        if (existingEmployee == null)
        {
            throw new InvalidOperationException($"Company Employee with ID {id} not found");
        }

        await _repository.DeleteCompanyEmployeeAsync(id);
    }

    private static CompanyEmployeeDto MapToDto(CompanyEmployee companyEmployee)
    {
        return new CompanyEmployeeDto
        {
            Id = companyEmployee.Id,
            UserName = companyEmployee.UserName,
            MilitaryNumber = companyEmployee.MilitaryNumber,
            FullName = companyEmployee.FullName,
            GradeName = companyEmployee.GradeName,
            CreatedBy = companyEmployee.CreatedBy,
            UpdatedBy = companyEmployee.UpdatedBy,
            CreatedAt = companyEmployee.CreatedAt,
            UpdatedAt = companyEmployee.UpdatedAt
        };
    }
}