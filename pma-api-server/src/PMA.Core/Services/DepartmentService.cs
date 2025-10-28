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

    public DepartmentService(
        IDepartmentRepository departmentRepository, 
        ITeamRepository teamRepository, 
        IEmployeeService employeeService)
    {
        _departmentRepository = departmentRepository;
        _teamRepository = teamRepository;
        _employeeService = employeeService;
    }

    public async System.Threading.Tasks.Task<Department?> GetDepartmentByIdAsync(int id)
    {
        return await _departmentRepository.GetByIdAsync(id);
    }

    public async System.Threading.Tasks.Task<Department?> GetDepartmentByNameAsync(string name)
    {
        return await _departmentRepository.GetDepartmentByNameAsync(name);
    }

    public async System.Threading.Tasks.Task<Department> CreateDepartmentAsync(Department department)
    {
        department.CreatedAt = DateTime.Now;
        department.UpdatedAt = DateTime.Now;
        return await _departmentRepository.AddAsync(department);
    }

    public async Task<(IEnumerable<(Department Department, int MemberCount)> Departments, int TotalCount)> GetDepartmentsAsync(int page, int limit, bool? isActive = null)
    {
        return await _departmentRepository.GetDepartmentsAsync(page, limit, isActive);
    }

    public async Task<Department> UpdateDepartmentAsync(Department department)
    {
        department.UpdatedAt = DateTime.Now;
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

    public async Task<(IEnumerable<TeamMemberDto> Members, int TotalCount)> GetDepartmentMembersAsync(int departmentId, int page = 1, int limit = 10)
    {
        var (teams, totalCount) = await _teamRepository.GetTeamsByDepartmentAsync(departmentId, page, limit);
        var memberDtos = new List<TeamMemberDto>();

        foreach (var team in teams)
        {
            var employee = team.PrsId != null ? await _employeeService.GetEmployeeByIdAsync((int)team.PrsId) : new EmployeeDto() { FullName = team.FullName, UserName = team.UserName };
        ;
            var memberDto = new TeamMemberDto
            {
                Id = team.Id,
                DepartmentId = team.DepartmentId,
                PrsId = team.PrsId, 
                JoinDate = team.JoinDate,
                IsActive = team.IsActive,
                FullName = team.FullName,
                UserName = team.UserName,
                User = employee 
            };
            memberDtos.Add(memberDto);
        }

        return (memberDtos, totalCount);
    }

    public async Task<TeamMemberDto> AddDepartmentMemberAsync(int departmentId, int? prsId, string userName, string fullName)
    {

        // Check if department exists
        var department = await _departmentRepository.GetByIdAsync(departmentId);
        if (department == null)
        {
            throw new KeyNotFoundException("Department not found");
        } 
        
        if (prsId!=null && prsId >= 0)
        {
            // Check if employee exists
            var employee = await _employeeService.GetEmployeeByIdAsync((int)prsId);
            if (employee == null)
            {
                throw new KeyNotFoundException("Employee not found");
            }
            // Check if already a member
            var existingTeams = await _teamRepository.GetTeamsByDepartmentAsync(departmentId);
            if (existingTeams.Teams.Any(t => t.PrsId == (int)prsId && t.IsActive))
            {
                throw new InvalidOperationException("Employee is already a member of this department");
            } 
        }





        var team = new Team
        {
            PrsId = prsId,
            DepartmentId = departmentId,
            JoinDate = DateTime.Now,
            UserName = userName,
            FullName = fullName, 
            IsActive = true,
            CreatedBy = 1 // Default admin user, could be from current user context
        };

        var addedTeam = await _teamRepository.AddTeamMemberAsync(team);

        return new TeamMemberDto
        {
            Id = addedTeam.Id,
            DepartmentId = addedTeam.DepartmentId,
            PrsId = addedTeam.PrsId,
            UserName= addedTeam.UserName,
            FullName= addedTeam.FullName,   
            JoinDate = addedTeam.JoinDate,
            IsActive = addedTeam.IsActive
        };
    }

    //public async Task<TeamMemberDto> UpdateDepartmentMemberAsync(int departmentId, int memberId, string? role, bool? isActive)
    //{
    //    var team = await _teamRepository.GetTeamByIdAsync(memberId);
    //    if (team == null || team.DepartmentId != departmentId)
    //    {
    //        throw new KeyNotFoundException("Team member not found");
    //    }

    //    if (isActive.HasValue)
    //    {
    //        team.IsActive = isActive.Value;
    //    }

    //    await _teamRepository.UpdateTeamMemberAsync(team);

    //    var employee = await _employeeService.GetEmployeeByIdAsync(team.PrsId);

    //    return new TeamMemberDto
    //    {
    //        Id = team.Id,
    //        DepartmentId = team.DepartmentId,
    //        UserId = team.PrsId,
    //        Role = role ?? "Member",
    //        JoinDate = team.JoinDate,
    //        IsActive = team.IsActive,
    //        User = employee
    //    };
    //}

    public async Task<bool> RemoveMemberByIdAsync(int memberId)
    {
        // Check if member exists before attempting removal
        var teamMember = await _teamRepository.GetByIdAsync(memberId);
        if (teamMember == null)
            return false;

        // Check for dependencies before removal
        var dependencies = await CheckMemberDependenciesAsync(teamMember.PrsId);
        if (dependencies.Any())
        {
            throw new InvalidOperationException($"لا يمكن إزالة العضو. العضو مرتبط بي: {string.Join("، ", dependencies)}");
        }

        // Direct call to repository - no duplicate department validation needed
        return await _teamRepository.RemoveTeamMemberAsync(memberId);
    }

    private async Task<List<string>> CheckMemberDependenciesAsync(int? prsId)
    {
        return await _departmentRepository.CheckMemberDependenciesAsync(prsId);
    }

    public async Task<IEnumerable<EmployeeDto>> SearchEmployeesInTeamsAsync(string searchTerm)
    {
       

        var employees = await _teamRepository.SearchEmployeesInTeamsAsync(searchTerm);

        return employees.Select(e => new EmployeeDto
        {
            Id = e.Id,
            UserName = e.UserName,
            FullName = e.FullName,
            MilitaryNumber = e.MilitaryNumber,
            GradeName = e.GradeName,
            StatusId = e.StatusId
        });
    }

    public async Task<IEnumerable<EmployeeDto>> SearchEmployeesInDepartmentAsync(string searchTerm, int departmentId)
    {
        // Allow empty search term to get all department members
        var employees = await _teamRepository.SearchEmployeesInDepartmentAsync(searchTerm ?? "", departmentId);

        return employees.Select(e => new EmployeeDto
        {
            Id = e.Id,
            UserName = e.UserName,
            FullName = e.FullName,
            MilitaryNumber = e.MilitaryNumber,
            GradeName = e.GradeName,
            StatusId = e.StatusId
        });
    }
}


