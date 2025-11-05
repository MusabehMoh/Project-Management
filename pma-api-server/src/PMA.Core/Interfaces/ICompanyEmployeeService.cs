using PMA.Core.DTOs;

namespace PMA.Core.Interfaces;

public interface ICompanyEmployeeService
{
    System.Threading.Tasks.Task<(IEnumerable<CompanyEmployeeDto> Items, int TotalCount)> GetCompanyEmployeesAsync(
        int page, 
        int limit, 
        string? search = null);
    
    System.Threading.Tasks.Task<CompanyEmployeeDto?> GetCompanyEmployeeByIdAsync(int id);
    System.Threading.Tasks.Task<CompanyEmployeeDto> CreateCompanyEmployeeAsync(CreateCompanyEmployeeDto createDto, string createdBy);
    System.Threading.Tasks.Task<CompanyEmployeeDto> UpdateCompanyEmployeeAsync(int id, UpdateCompanyEmployeeDto updateDto, string updatedBy);
    System.Threading.Tasks.Task DeleteCompanyEmployeeAsync(int id);
}