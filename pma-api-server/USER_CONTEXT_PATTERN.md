# User Context Pattern Migration Guide

## Overview

This project has transitioned from using `ICurrentUserProvider` to a new, cleaner `IUserContextAccessor` pattern for managing user authentication and identity information throughout the application.

## Architecture

### New Pattern Components

1. **`UserContext.cs`** (Core/Models) - The user identity model
2. **`IUserContextAccessor.cs`** (Core/Interfaces) - The interface for accessing user context
3. **`UserContextAccessor.cs`** (Api/Services) - The implementation that extracts user info from HTTP context

### Benefits of the New Pattern

- ✅ **Cleaner API**: Single method to get all user information
- ✅ **Better Caching**: User context is cached per request automatically
- ✅ **Type Safety**: Returns a strongly-typed `UserContext` object
- ✅ **Testability**: Easier to mock and test
- ✅ **Single Responsibility**: Focused solely on user context management

## Migration Guide

### Old Pattern (ICurrentUserProvider)

```csharp
public class MyService : IMyService
{
    private readonly ICurrentUserProvider _currentUserProvider;

    public MyService(ICurrentUserProvider currentUserProvider)
    {
        _currentUserProvider = currentUserProvider;
    }

    public async Task DoSomethingAsync()
    {
        if (!_currentUserProvider.IsAuthenticated)
            throw new UnauthorizedAccessException();

        var userName = _currentUserProvider.UserName;
        var prsId = await _currentUserProvider.GetCurrentUserPrsIdAsync();
        
        // Use userName and prsId...
    }
}
```

### New Pattern (IUserContextAccessor) - PREFERRED

```csharp
public class MyService : IMyService
{
    private readonly IUserContextAccessor _userContextAccessor;

    public MyService(IUserContextAccessor userContextAccessor)
    {
        _userContextAccessor = userContextAccessor;
    }

    public async Task DoSomethingAsync()
    {
        var userContext = await _userContextAccessor.GetUserContextAsync();
        
        if (!userContext.IsAuthenticated)
            throw new UnauthorizedAccessException();

        var userName = userContext.UserName;
        var prsId = userContext.PrsId;
        
        // Use userName and prsId...
    }
}
```

## Usage Examples

### Example 1: Creating a Project with User Context

```csharp
public class ProjectService : IProjectService
{
    private readonly IProjectRepository _projectRepository;
    private readonly IUserContextAccessor _userContextAccessor;

    public ProjectService(
        IProjectRepository projectRepository,
        IUserContextAccessor userContextAccessor)
    {
        _projectRepository = projectRepository;
        _userContextAccessor = userContextAccessor;
    }

    public async Task<Project> CreateProjectAsync(CreateProjectDto dto)
    {
        var userContext = await _userContextAccessor.GetUserContextAsync();
        
        if (!userContext.IsAuthenticated)
            throw new UnauthorizedAccessException();

        var project = new Project
        {
            Name = dto.Name,
            Description = dto.Description,
            CreatedBy = userContext.PrsId,
            CreatedByUserName = userContext.UserName,
            CreatedDate = DateTime.UtcNow
        };

        return await _projectRepository.AddAsync(project);
    }
}
```

### Example 2: Filtering Data by Current User

```csharp
public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IUserContextAccessor _userContextAccessor;

    public TaskService(
        ITaskRepository taskRepository,
        IUserContextAccessor userContextAccessor)
    {
        _taskRepository = taskRepository;
        _userContextAccessor = userContextAccessor;
    }

    public async Task<List<Task>> GetMyTasksAsync()
    {
        var userContext = await _userContextAccessor.GetUserContextAsync();
        
        if (!userContext.IsAuthenticated)
            return new List<Task>();

        return await _taskRepository.GetTasksByAssigneeAsync(userContext.PrsId);
    }
}
```

### Example 3: Using Current Context Property for Synchronous Access

```csharp
public class AuditService : IAuditService
{
    private readonly IUserContextAccessor _userContextAccessor;

    public AuditService(IUserContextAccessor userContextAccessor)
    {
        _userContextAccessor = userContextAccessor;
    }

    public void LogAction(string action)
    {
        // Access the cached context synchronously
        var currentUser = _userContextAccessor.Current;
        
        if (currentUser?.IsAuthenticated == true)
        {
            Console.WriteLine($"User {currentUser.UserName} performed: {action}");
        }
    }
}
```

### Example 4: Handling Anonymous Users

```csharp
public class PublicDataService : IPublicDataService
{
    private readonly IUserContextAccessor _userContextAccessor;

    public PublicDataService(IUserContextAccessor userContextAccessor)
    {
        _userContextAccessor = userContextAccessor;
    }

    public async Task<List<PublicProject>> GetPublicProjectsAsync()
    {
        var userContext = await _userContextAccessor.GetUserContextAsync();
        
        // Check if user is anonymous
        if (!userContext.IsAuthenticated)
        {
            // Return only public data
            return await GetPublicProjectsOnlyAsync();
        }
        
        // Return enhanced data for authenticated users
        return await GetProjectsWithUserAccessAsync(userContext.PrsId);
    }
}
```

## Service Registration

The services are registered in `Program.cs`:

```csharp
// Register IHttpContextAccessor for accessing HttpContext in services
builder.Services.AddHttpContextAccessor();

// Register the new UserContext pattern (preferred approach)
builder.Services.AddScoped<IUserContextAccessor, UserContextAccessor>();

// Register legacy current-user service for backward compatibility
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ICurrentUserProvider>(sp => sp.GetRequiredService<ICurrentUserService>());
```

## UserContext Model

```csharp
public class UserContext
{
    public string PrsId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public bool IsAuthenticated { get; set; }

    public static UserContext Anonymous => new() { IsAuthenticated = false };
}
```

### Properties:
- **PrsId**: The user's unique identifier (from the database)
- **UserName**: The extracted username (without domain)
- **IsAuthenticated**: Whether the user is authenticated
- **Anonymous**: Static property for anonymous/unauthenticated contexts

## Best Practices

### ✅ DO:
- Use `IUserContextAccessor` for all new code
- Always check `IsAuthenticated` before accessing user properties
- Call `GetUserContextAsync()` once per operation and reuse the result
- Use `UserContext.Anonymous` for default anonymous contexts
- Inject `IUserContextAccessor` into services that need user context

### ❌ DON'T:
- Don't use `ICurrentUserProvider` for new code (legacy support only)
- Don't call `GetUserContextAsync()` multiple times in the same method
- Don't assume the user is authenticated without checking
- Don't access `Current` property before calling `GetUserContextAsync()`

## Backward Compatibility

The old `ICurrentUserProvider` interface is still supported for backward compatibility but is deprecated:

```csharp
/// <summary>
/// Legacy service - use IUserContextAccessor instead for new code
/// </summary>
public class CurrentUserService : ICurrentUserService, ICurrentUserProvider
{
    // Implementation wraps IUserContextAccessor
}
```

**Note**: New code should use `IUserContextAccessor`. The old pattern will be removed in a future version.

## Testing

### Mocking IUserContextAccessor

```csharp
[TestMethod]
public async Task CreateProject_WithAuthenticatedUser_Success()
{
    // Arrange
    var mockUserContextAccessor = new Mock<IUserContextAccessor>();
    mockUserContextAccessor
        .Setup(x => x.GetUserContextAsync())
        .ReturnsAsync(new UserContext
        {
            PrsId = "12345",
            UserName = "testuser",
            IsAuthenticated = true
        });

    var service = new ProjectService(mockRepo.Object, mockUserContextAccessor.Object);

    // Act
    var result = await service.CreateProjectAsync(new CreateProjectDto { Name = "Test" });

    // Assert
    Assert.IsNotNull(result);
    Assert.AreEqual("12345", result.CreatedBy);
}
```

## Migration Checklist

When migrating a service from old to new pattern:

- [ ] Replace `ICurrentUserProvider` injection with `IUserContextAccessor`
- [ ] Update constructor to accept `IUserContextAccessor`
- [ ] Replace individual property access with `GetUserContextAsync()` call
- [ ] Update authentication checks to use `userContext.IsAuthenticated`
- [ ] Replace `GetCurrentUserPrsIdAsync()` with `userContext.PrsId`
- [ ] Replace `UserName` property access with `userContext.UserName`
- [ ] Update unit tests to mock `IUserContextAccessor`
- [ ] Remove `ICurrentUserProvider` using statement

## Support

For questions or issues with the new pattern, please contact the development team or refer to:
- `UserContextAccessor.cs` for implementation details
- `ProjectService.cs` for usage examples
- This README for migration guidance
