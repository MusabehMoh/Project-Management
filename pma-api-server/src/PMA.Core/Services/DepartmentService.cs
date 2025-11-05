using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;
using PMA.Core.Enums;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IEmployeeService _employeeService;
    private readonly IUserRepository _userRepository;
    private readonly IUserService _userService;
    private readonly IRoleService _roleService;

    public DepartmentService(
        IDepartmentRepository departmentRepository, 
        ITeamRepository teamRepository, 
        IEmployeeService employeeService,
        IUserRepository userRepository,
        IUserService userService,
        IRoleService roleService)
    {
        _departmentRepository = departmentRepository;
        _teamRepository = teamRepository;
        _employeeService = employeeService;
        _userRepository = userRepository;
        _userService = userService;
        _roleService = roleService;
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

    public async Task<(IEnumerable<TeamMemberDto> Members, int TotalCount)> GetDepartmentMembersAsync(int departmentId, int page = 1, int limit = 10, string? search = null)
    {
        var (teams, totalCount) = await _teamRepository.GetTeamsByDepartmentAsync(departmentId, page, limit,search);
        var memberDtos = new List<TeamMemberDto>();

        foreach (var team in teams)
        {
            var employee = team.PrsId != null ? await _employeeService.GetEmployeeByIdAsync((int)team.PrsId) : new EmployeeDto() { FullName = team.FullName ?? "", UserName = team.UserName ?? "" };
        ;
            var memberDto = new TeamMemberDto
            {
                Id = team.Id,
                DepartmentId = team.DepartmentId,
                PrsId = team.PrsId, 
                JoinDate = team.JoinDate,
                IsActive = team.IsActive,
                FullName = team.FullName ?? "",
                UserName = team.UserName ?? "",
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
        
        if (prsId!=null)
        {
            // Check if employee exists
            var employee = await _employeeService.GetEmployeeByIdAsync((int)prsId);
            if (employee == null)
            {
                throw new KeyNotFoundException("Employee not found");
            }
            
            // Check if already a member of THIS department
            var existingTeams = await _teamRepository.GetTeamsByDepartmentAsync(departmentId);
            if (existingTeams.Teams.Any(t => t.PrsId == (int)prsId && t.IsActive))
            {
                throw new InvalidOperationException("Employee is already a member of this department");
            }

            // Check if employee is already in ANY other department
            var otherDepartments = await _teamRepository.GetEmployeeOtherDepartmentsAsync((int)prsId, departmentId);
            if (otherDepartments.Any())
            {
                var otherDeptNames = string.Join(", ", otherDepartments.Select(t => t.Department?.Name).Distinct());
                throw new InvalidOperationException($"Employee '{employee.FullName}' is already a member of another department ({otherDeptNames}). Employees can only belong to one department");
            }

            // Check if user has managerial roles
            var userWithRoles = await _userRepository.GetUserWithRolesByPrsIdAsync((int)prsId);
            if (userWithRoles?.UserRoles != null && userWithRoles.UserRoles.Any())
            {
                var managerialRoleIds = new[] 
                { 
                    (int)RoleCodes.Administrator,
                    (int)RoleCodes.AnalystManager,
                    (int)RoleCodes.DevelopmentManager,
                    (int)RoleCodes.DesignerManager,
                    (int)RoleCodes.QCManager
                };

                var hasManagerialRole = userWithRoles.UserRoles.Any(ur => managerialRoleIds.Contains(ur.RoleId));
                if (hasManagerialRole)
                {
                    throw new InvalidOperationException($"Employee '{employee.FullName}' has managerial roles and cannot be added as a department member");
                }
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

        // Create user after team member is successfully added
        if (prsId != null)
        {
            await CreateUserForDepartmentMemberAsync((int)prsId, departmentId, userName, fullName);
        }

        return new TeamMemberDto
        {
            Id = addedTeam.Id,
            DepartmentId = addedTeam.DepartmentId,
            PrsId = addedTeam.PrsId,
            UserName= addedTeam.UserName ?? "",
            FullName= addedTeam.FullName ?? "",   
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

        // Remove team member first
        var memberRemoved = await _teamRepository.RemoveTeamMemberAsync(memberId);
        
        // If member removal was successful and has PrsId, delete related user
        if (memberRemoved && teamMember.PrsId != null)
        {
            await DeleteUserForDepartmentMemberAsync(teamMember.PrsId.Value);
        }

        return memberRemoved;
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

    /// <summary>
    /// Creates a user for a department member if one doesn't already exist.
    /// This function can be commented out to disable automatic user creation.
    /// </summary>
    /// <param name="prsId">Personnel ID</param>
    /// <param name="departmentId">Department ID</param>
    /// <param name="userName">Username</param>
    /// <param name="fullName">Full name</param>
    private async System.Threading.Tasks.Task CreateUserForDepartmentMemberAsync(int prsId, int departmentId, string userName, string fullName)
    {
        // Check if user already exists for this PrsId
        var existingUser = await _userService.GetUserByPrsIdAsync(prsId);
        
        // If user doesn't exist, create a new user
        if (existingUser == null)
        {
            // Get employee data
            var employee = await _employeeService.GetEmployeeByIdAsync(prsId);
            if (employee == null)
            {
                return; // Skip user creation if employee not found
            }

            // Get roles for this department
            var departmentRoles = await _roleService.GetRolesByDepartmentAsync(departmentId);
            
            // Exclude manager roles from department roles
            var managerialRoleIds = new[] 
            { 
                (int)RoleCodes.Administrator,
                (int)RoleCodes.AnalystManager,
                (int)RoleCodes.DevelopmentManager,
                (int)RoleCodes.DesignerManager,
                (int)RoleCodes.QCManager
            };
            
            // Filter out managerial roles - only assign non-managerial roles to department members
            var nonManagerialRoles = departmentRoles.Where(r => !managerialRoleIds.Contains(r.Id)).ToList();
            
            // Create new user
            var newUser = new User
            {
                UserName = string.IsNullOrEmpty(userName) ? employee.UserName ?? $"user_{prsId}" : userName,
                PrsId = prsId,
                IsActive = true,
                FullName = employee.FullName,
                MilitaryNumber = employee.MilitaryNumber,
                GradeName = employee.GradeName,
                DepartmentId = departmentId,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            // Create the user
            var createdUser = await _userService.CreateUserAsync(newUser);

            // Assign roles to the user (only non-managerial roles)
            if (nonManagerialRoles.Any())
            {
                var roleIds = nonManagerialRoles.Select(r => r.Id).ToList();
                await _userService.AssignRolesToUserAsync(createdUser.Id, roleIds);

                // Assign actions from roles to the user
                var allActionIds = new List<int>();
                foreach (var role in nonManagerialRoles)
                {
                    if (role.Actions != null)
                    {
                        allActionIds.AddRange(role.Actions.Select(a => a.Id));
                    }
                }

                if (allActionIds.Any())
                {
                    // Remove duplicates
                    var uniqueActionIds = allActionIds.Distinct().ToList();
                    await _userService.AssignActionsToUserAsync(createdUser.Id, uniqueActionIds);
                }
            }
        }
    }

    /// <summary>
    /// Deletes a user associated with a department member when the member is removed.
    /// This function can be commented out to disable automatic user deletion.
    /// </summary>
    /// <param name="prsId">Personnel ID</param>
    private async System.Threading.Tasks.Task DeleteUserForDepartmentMemberAsync(int prsId)
    {
        try
        {
            // Check if user exists for this PrsId
            var existingUser = await _userService.GetUserByPrsIdAsync(prsId);
            
            if (existingUser != null)
            {
                // Delete the user
                await _userService.DeleteUserAsync(existingUser.Id);
            }
        }
        catch (Exception)
        {
            // Log the error but don't throw - member removal should still succeed
            // You might want to add proper logging here
            // _logger.LogWarning(ex, "Failed to delete user for PrsId {PrsId} during member removal", prsId);
        }
    }
}


