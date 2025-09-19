using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class EmployeeService : IEmployeeService
{
    private readonly IEmployeeRepository _employeeRepository;

    public EmployeeService(IEmployeeRepository employeeRepository)
    {
        _employeeRepository = employeeRepository;
    }

    public async System.Threading.Tasks.Task<(IEnumerable<EmployeeDto> Employees, int TotalCount)> GetEmployeesAsync(int page, int limit, int? statusId = null)
    {
        var (employees, totalCount) = await _employeeRepository.GetEmployeesAsync(page, limit, statusId);
        var employeeDtos = employees.Select(e => MapToDto(e));
        return (employeeDtos, totalCount);
    }

    public async System.Threading.Tasks.Task<EmployeeDto?> GetEmployeeByIdAsync(int id)
    {
        var employee = await _employeeRepository.GetByIdAsync(id);
        return employee != null ? MapToDto(employee) : null;
    }

    public async System.Threading.Tasks.Task<EmployeeDto> CreateEmployeeAsync(Employee employee)
    {
        var createdEmployee = await _employeeRepository.AddAsync(employee);
        return MapToDto(createdEmployee);
    }

    public async System.Threading.Tasks.Task<EmployeeDto> UpdateEmployeeAsync(Employee employee)
    {
        await _employeeRepository.UpdateAsync(employee);
        return MapToDto(employee);
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

    public async System.Threading.Tasks.Task<(IEnumerable<EmployeeDto> Employees, int TotalCount)> SearchEmployeesAsync(string query, int page = 1, int limit = 20)
    {
        var (employees, totalCount) = await _employeeRepository.SearchEmployeesAsync(query, page, limit);
        var employeeDtos = employees.Select(e => MapToDto(e));
        return (employeeDtos, totalCount);
    }

    private EmployeeDto MapToDto(Employee employee)
    {
        return new EmployeeDto
        {
            Id = employee.Id,
            UserName = employee.UserName,
            FullName = employee.FullName,
            MilitaryNumber = employee.MilitaryNumber,
            GradeName = employee.GradeName,
            StatusId = employee.StatusId
        };
    }
}