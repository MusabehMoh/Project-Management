using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IEmployeeService _employeeService;

    public DepartmentService(IDepartmentRepository departmentRepository, ITeamRepository teamRepository, IEmployeeService employeeService)
    {
        _departmentRepository = departmentRepository;
        _teamRepository = teamRepository;
        _employeeService = employeeService;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Department>> GetAllDepartmentsAsync()
    {
        return await _departmentRepository.GetAllAsync();
    }

    public async System.Threading.Tasks.Task<Department?> GetDepartmentByIdAsync(int id)
    {
        return await _departmentRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<Department> CreateDepartmentAsync(Department department)
    {
        department.CreatedAt = DateTime.UtcNow;
        department.UpdatedAt = DateTime.UtcNow;
        return await _departmentRepository.AddAsync(department);
    }

    public async Task<(IEnumerable<Department> Departments, int TotalCount)> GetDepartmentsAsync(int page, int limit, bool? isActive = null)
    {
        return await _departmentRepository.GetDepartmentsAsync(page, limit, isActive);
    }

    public async Task<Department> UpdateDepartmentAsync(Department department)
    {
        department.UpdatedAt = DateTime.UtcNow;
        await _departmentRepository.UpdateAsync(department);
        return department;
    }

    public async Task<bool> DeleteDepartmentAsync(int id)
    {
        var department = await _departmentRepository.GetByIdAsync(id);
        if (department != null)
        {
            await _departmentRepository.DeleteAsync(department);
            return true;
        }
        return false;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Department>> GetActiveDepartmentsAsync()
    {
        return await _departmentRepository.GetActiveDepartmentsAsync();
    }

    public async Task<(IEnumerable<TeamMemberDto> Members, int TotalCount)> GetDepartmentMembersAsync(int departmentId, int page = 1, int limit = 10)
    {
        var (teams, totalCount) = await _teamRepository.GetTeamsByDepartmentAsync(departmentId, page, limit);
        var memberDtos = new List<TeamMemberDto>();

        foreach (var team in teams)
        {
            var employee = await _employeeService.GetEmployeeByIdAsync(team.PrsId);
            var memberDto = new TeamMemberDto
            {
                Id = team.Id,
                DepartmentId = team.DepartmentId,
                UserId = team.PrsId,
                Role = "Member", // Default role, could be extended
                JoinDate = team.JoinDate,
                IsActive = team.IsActive,
                User = employee
            };
            memberDtos.Add(memberDto);
        }

        return (memberDtos, totalCount);
    }

    public async Task<TeamMemberDto> AddDepartmentMemberAsync(int departmentId, int userId, string role)
    {
        // Check if employee exists
        var employee = await _employeeService.GetEmployeeByIdAsync(userId);
        if (employee == null)
        {
            throw new KeyNotFoundException("Employee not found");
        }

        // Check if department exists
        var department = await _departmentRepository.GetByIdAsync(departmentId);
        if (department == null)
        {
            throw new KeyNotFoundException("Department not found");
        }

        // Check if already a member
        var existingTeams = await _teamRepository.GetTeamsByDepartmentAsync(departmentId);
        if (existingTeams.Teams.Any(t => t.PrsId == userId && t.IsActive))
        {
            throw new InvalidOperationException("Employee is already a member of this department");
        }

        var team = new Team
        {
            PrsId = userId,
            DepartmentId = departmentId,
            JoinDate = DateTime.UtcNow,
            IsActive = true,
            CreatedBy = 1 // Default admin user, could be from current user context
        };

        var addedTeam = await _teamRepository.AddTeamMemberAsync(team);

        return new TeamMemberDto
        {
            Id = addedTeam.Id,
            DepartmentId = addedTeam.DepartmentId,
            UserId = addedTeam.PrsId,
            Role = role,
            JoinDate = addedTeam.JoinDate,
            IsActive = addedTeam.IsActive,
            User = employee
        };
    }

    public async Task<TeamMemberDto> UpdateDepartmentMemberAsync(int departmentId, int memberId, string? role, bool? isActive)
    {
        var team = await _teamRepository.GetTeamByIdAsync(memberId);
        if (team == null || team.DepartmentId != departmentId)
        {
            throw new KeyNotFoundException("Team member not found");
        }

        if (isActive.HasValue)
        {
            team.IsActive = isActive.Value;
        }

        await _teamRepository.UpdateTeamMemberAsync(team);

        var employee = await _employeeService.GetEmployeeByIdAsync(team.PrsId);

        return new TeamMemberDto
        {
            Id = team.Id,
            DepartmentId = team.DepartmentId,
            UserId = team.PrsId,
            Role = role ?? "Member",
            JoinDate = team.JoinDate,
            IsActive = team.IsActive,
            User = employee
        };
    }

    public async Task<bool> RemoveDepartmentMemberAsync(int departmentId, int memberId)
    {
        var team = await _teamRepository.GetTeamByIdAsync(memberId);
        if (team == null || team.DepartmentId != departmentId)
        {
            return false;
        }

        return await _teamRepository.RemoveTeamMemberAsync(memberId);
    }
}


