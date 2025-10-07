using Microsoft.EntityFrameworkCore;
using PMA.Core.Entities;
using TaskEntity = PMA.Core.Entities.Task;

namespace PMA.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSets for entities
    public DbSet<Project> Projects { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Employee> MawaredEmployees { get; set; }
    public DbSet<TaskEntity> Tasks { get; set; }
    public DbSet<SubTask> SubTasks { get; set; }
    public DbSet<Sprint> Sprints { get; set; }
    public DbSet<Requirement> Requirements { get; set; }
    public DbSet<RequirementComment> RequirementComments { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<Team> Teams { get; set; }
    public DbSet<Unit> Units { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<Permission> Actions { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<UserAction> UserActions { get; set; }
    public DbSet<RoleAction> RoleActions { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Lookup> Lookups { get; set; }
    //public DbSet<MemberTask> MemberTasks { get; set; }
    //public DbSet<MemberTaskAssignment> MemberTaskAssignments { get; set; }
    public DbSet<ProjectRequirement> ProjectRequirements { get; set; }
    public DbSet<ProjectRequirementAttachment> ProjectRequirementAttachments { get; set; }
    public DbSet<RequirementTask> RequirementTasks { get; set; }
    public DbSet<Timeline> Timelines { get; set; } 
    public DbSet<CalendarEvent> CalendarEvents { get; set; }
    public DbSet<CalendarEventAssignment> CalendarEventAssignments { get; set; }
    public DbSet<SubTaskAssignment> SubTaskAssignments { get; set; }
    public DbSet<ProjectAnalyst> ProjectAnalysts { get; set; }
    
    // New DbSets for task assignments and dependencies
    public DbSet<TaskAssignment> TaskAssignments { get; set; }
    public DbSet<TaskDependency> TaskDependencies { get; set; }
    public DbSet<TaskStatusHistory> TaskStatusHistory { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure TaskDependency to avoid cycles
        modelBuilder.Entity<TaskDependency>()
            .HasOne(td => td.Task)
            .WithMany(t => t.Dependencies_Relations)
            .HasForeignKey(td => td.TaskId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<TaskDependency>()
            .HasOne(td => td.DependsOnTask)
            .WithMany(t => t.DependentTasks)
            .HasForeignKey(td => td.DependsOnTaskId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}


