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
    public DbSet<DesignRequest> DesignRequests { get; set; }

    // Audit logging DbSets
    public DbSet<ChangeGroup> ChangeGroups { get; set; }
    public DbSet<ChangeItem> ChangeItems { get; set; }

    /// <summary>
    /// The current user making changes (injected via IHttpContextAccessor or UserContext)
    /// </summary>
    public string? CurrentUser { get; set; }

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

        // Configure ChangeGroup to ChangeItem relationship
        modelBuilder.Entity<ChangeGroup>()
            .HasMany(cg => cg.Items)
            .WithOne(ci => ci.ChangeGroup)
            .HasForeignKey(ci => ci.ChangeGroupId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index for ChangeGroup lookups
        modelBuilder.Entity<ChangeGroup>()
            .HasIndex(cg => new { cg.EntityType, cg.EntityId })
            .HasDatabaseName("IX_ChangeGroup_EntityType_EntityId");

        modelBuilder.Entity<ChangeGroup>()
            .HasIndex(cg => cg.ChangedAt)
            .HasDatabaseName("IX_ChangeGroup_ChangedAt");
    }

    /// <summary>
    /// Override SaveChanges to automatically track changes
    /// </summary>
    public override int SaveChanges()
    {
        return SaveChangesInternal();
    }

    /// <summary>
    /// Override SaveChangesAsync to automatically track changes
    /// </summary>
    public override async System.Threading.Tasks.Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await System.Threading.Tasks.Task.FromResult(SaveChangesInternal());
    }

    /// <summary>
    /// Internal method to track changes and save to database
    /// </summary>
    private int SaveChangesInternal()
    {
        // Get all modified entities
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified && e.Entity is not (ChangeGroup or ChangeItem))
            .ToList();

        foreach (var entry in entries)
        {
            try
            {
                // Skip if entity doesn't have an Id property
                var idProperty = entry.Property("Id");
                if (idProperty == null)
                    continue;

                var entityType = entry.Entity.GetType().Name;
                var entityId = (int)idProperty.CurrentValue!;

                var group = new ChangeGroup
                {
                    EntityType = entityType,
                    EntityId = entityId,
                    ChangedBy = CurrentUser ?? "system",
                    ChangedAt = DateTime.UtcNow
                };

                // Track all modified properties
                foreach (var prop in entry.Properties)
                {
                    // Skip navigation properties, Id, and audit fields
                    if (prop.IsModified && prop.Metadata.Name != "Id" && prop.Metadata.Name != "UpdatedAt" && prop.Metadata.Name != "UpdatedBy")
                    {
                        var oldValue = prop.OriginalValue?.ToString();
                        var newValue = prop.CurrentValue?.ToString();

                        // Only add if values actually changed
                        if (oldValue != newValue)
                        {
                            group.Items.Add(new ChangeItem
                            {
                                FieldName = prop.Metadata.Name,
                                OldValue = oldValue,
                                NewValue = newValue
                            });
                        }
                    }
                }

                // Only add the change group if there are actual changes
                if (group.Items.Count > 0)
                {
                    ChangeGroups.Add(group);
                }
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the save
                System.Diagnostics.Debug.WriteLine($"Error tracking changes for {entry.Entity.GetType().Name}: {ex.Message}");
            }
        }

        return base.SaveChanges();
    }
}
