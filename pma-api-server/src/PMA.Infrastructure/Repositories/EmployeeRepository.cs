using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace PMA.Infrastructure.Repositories;

public class EmployeeRepository : Repository<Employee>, IEmployeeRepository
{
    public EmployeeRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async System.Threading.Tasks.Task<(IEnumerable<Employee> Employees, int TotalCount)> GetEmployeesAsync(int page, int limit, int? statusId = null)
    {
        var query = _context.Employees.AsQueryable();

        if (statusId.HasValue)
        {
            query = query.Where(e => e.StatusId == statusId.Value);
        }

        var totalCount = await query.CountAsync();
        var employees = await query
            .OrderBy(e => e.Id)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (employees, totalCount);
    }

    public async System.Threading.Tasks.Task<(IEnumerable<Employee> Employees, int TotalCount)> SearchEmployeesAsync(string query, int page = 1, int limit = 20)
    {
        var searchQuery = _context.Employees.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var searchTerm = query.ToLower();
            searchQuery = searchQuery.Where(e =>
                e.UserName.ToLower().Contains(searchTerm) ||
                e.FullName.ToLower().Contains(searchTerm) ||
                e.MilitaryNumber.ToLower().Contains(searchTerm) ||
                e.GradeName.ToLower().Contains(searchTerm));
        }

        var totalCount = await searchQuery.CountAsync();
        var employees = await searchQuery
            .OrderBy(e => e.Id)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (employees, totalCount);
    }
}