using PMA.Core.Entities;
using PMA.Core.Interfaces;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class EmployeeService : IEmployeeService
{
    private readonly IEmployeeRepository _employeeRepository;

    public EmployeeService(IEmployeeRepository employeeRepository)
    {
        _employeeRepository = employeeRepository;
    }

    public async System.Threading.Tasks.Task<(IEnumerable<Employee> Employees, int TotalCount)> GetEmployeesAsync(int page, int limit, int? statusId = null)
    {
        return await _employeeRepository.GetEmployeesAsync(page, limit, statusId);
    }

    public async System.Threading.Tasks.Task<Employee?> GetEmployeeByIdAsync(int id)
    {
        return await _employeeRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<Employee> CreateEmployeeAsync(Employee employee)
    {
        return await _employeeRepository.AddAsync(employee);
    }

    public async System.Threading.Tasks.Task<Employee> UpdateEmployeeAsync(Employee employee)
    {
        await _employeeRepository.UpdateAsync(employee);
        return employee;
    }

    public async System.Threading.Tasks.Task<bool> DeleteEmployeeAsync(int id)
    {
        var employee = await _employeeRepository.GetByIdAsync(id);
        if (employee != null)
        {
            await _employeeRepository.DeleteAsync(employee);
            return true;
        }
        return false;
    }
}