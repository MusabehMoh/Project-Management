using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;

namespace PMA.Infrastructure.Repositories;

public class CompanyEmployeeRepository : ICompanyEmployeeRepository
{
    private readonly ApplicationDbContext _context;

    public CompanyEmployeeRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<(IEnumerable<CompanyEmployee> Items, int TotalCount)> GetCompanyEmployeesAsync(
        int page, int limit, string? search = null)
    {
        var query = _context.CompanyEmployees.AsQueryable();

        // Search filter - search across multiple fields
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(e => 
                (e.FullName != null && e.FullName.ToLower().Contains(searchLower)) ||
                (e.UserName != null && e.UserName.ToLower().Contains(searchLower)) ||
                (e.GradeName != null && e.GradeName.ToLower().Contains(searchLower)) ||
                (e.MilitaryNumber.HasValue && e.MilitaryNumber.ToString()!.Contains(searchLower))
            );
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(e => e.Id)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (items, totalCount);
    }

    public async System.Threading.Tasks.Task<CompanyEmployee?> GetCompanyEmployeeByIdAsync(int id)
    {
        return await _context.CompanyEmployees.FindAsync(id);
    }

    public async System.Threading.Tasks.Task<CompanyEmployee> CreateCompanyEmployeeAsync(CompanyEmployee companyEmployee)
    {
        // Auto-generate negative ID
        companyEmployee.Id = await GetNextNegativeIdAsync();
        companyEmployee.CreatedAt = DateTime.UtcNow;
        _context.CompanyEmployees.Add(companyEmployee);
        await _context.SaveChangesAsync();
        return companyEmployee;
    }

    private async System.Threading.Tasks.Task<int> GetNextNegativeIdAsync()
    {
        // Get the smallest (most negative) ID and subtract 1
        var minId = await _context.CompanyEmployees
            .Where(e => e.Id < 0)
            .MinAsync(e => (int?)e.Id);
        
        return minId.HasValue ? minId.Value - 1 : -1;
    }

    public async System.Threading.Tasks.Task<CompanyEmployee> UpdateCompanyEmployeeAsync(CompanyEmployee companyEmployee)
    {
        companyEmployee.UpdatedAt = DateTime.UtcNow;
        _context.CompanyEmployees.Update(companyEmployee);
        await _context.SaveChangesAsync();
        return companyEmployee;
    }

    public async System.Threading.Tasks.Task DeleteCompanyEmployeeAsync(int id)
    {
        var companyEmployee = await GetCompanyEmployeeByIdAsync(id);
        if (companyEmployee != null)
        {
            _context.CompanyEmployees.Remove(companyEmployee);
            await _context.SaveChangesAsync();
        }
    }

    public async System.Threading.Tasks.Task<bool> CompanyEmployeeExistsAsync(int id)
    {
        return await _context.CompanyEmployees.AnyAsync(e => e.Id == id);
    }

    public async System.Threading.Tasks.Task<bool> UserNameExistsAsync(string userName, int? excludeId = null)
    {
        if (string.IsNullOrWhiteSpace(userName))
            return false;

        var query = _context.CompanyEmployees.Where(e => e.UserName == userName);
        
        if (excludeId.HasValue)
        {
            query = query.Where(e => e.Id != excludeId.Value);
        }

        return await query.AnyAsync();
    }
}