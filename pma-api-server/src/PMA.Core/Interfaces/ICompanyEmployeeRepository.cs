using PMA.Core.DTOs;
using PMA.Core.Entities;

namespace PMA.Core.Interfaces;

public interface ICompanyEmployeeRepository
{
    System.Threading.Tasks.Task<(IEnumerable<CompanyEmployee> Items, int TotalCount)> GetCompanyEmployeesAsync(
        int page, 
        int limit, 
        string? search = null);
    
    System.Threading.Tasks.Task<CompanyEmployee?> GetCompanyEmployeeByIdAsync(int id);
    System.Threading.Tasks.Task<CompanyEmployee> CreateCompanyEmployeeAsync(CompanyEmployee companyEmployee);
    System.Threading.Tasks.Task<CompanyEmployee> UpdateCompanyEmployeeAsync(CompanyEmployee companyEmployee);
    System.Threading.Tasks.Task DeleteCompanyEmployeeAsync(int id);
    System.Threading.Tasks.Task<bool> CompanyEmployeeExistsAsync(int id);
    System.Threading.Tasks.Task<bool> UserNameExistsAsync(string userName, int? excludeId = null);
}