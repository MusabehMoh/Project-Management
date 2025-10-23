using PMA.Api.Controllers;
using PMA.Api.Middleware;
using PMA.Core.Interfaces;
using PMA.Core.Services;
using PMA.Infrastructure.Data;
using PMA.Infrastructure.Repositories;
using PMA.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Serilog;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Mvc.Versioning;
using Microsoft.Extensions.Options;
using PMA.Api.Config;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// Configure file upload limits for large file uploads
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    // Increase max form data size (default is 128 MB)
    options.MultipartBodyLengthLimit = 500 * 1024 * 1024; // 500 MB
    options.ValueLengthLimit = 50 * 1024 * 1024; // 50 MB for individual values
    options.MultipartHeadersLengthLimit = 1024 * 1024; // 1 MB for headers
});

// Configure Kestrel server options for large requests
builder.Services.Configure<Microsoft.AspNetCore.Server.Kestrel.Core.KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 500 * 1024 * 1024; // 500 MB
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(5);
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(10);
});

// Note: For IIS deployments, configure maxAllowedContentLength in web.config:
// <system.webServer>
//   <security>
//     <requestFiltering>
//       <requestLimits maxAllowedContentLength="524288000" /> <!-- 500 MB -->
//     </requestFiltering>
//   </security>
// </system.webServer>

// Configure AttachmentSettings
builder.Services.Configure<AttachmentSettings>(builder.Configuration.GetSection("AttachmentSettings"));

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

// Add API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.DefaultApiVersion = new Microsoft.AspNetCore.Mvc.ApiVersion(1, 0);
    options.ReportApiVersions = true;
});

builder.Services.AddVersionedApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// Add Swagger
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "PMA API Server",
        Version = "v1",
        Description = "Project Management Application API Server built with .NET Core 8 and MSSQL",
        Contact = new OpenApiContact
        {
            Name = "PMA Development Team",
            Email = "support@pma.com",
            Url = new Uri("https://github.com/MusabehMoh/Project-Management")
        },
        License = new OpenApiLicense
        {
            Name = "MIT License",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });

    // Enable XML comments
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    options.IncludeXmlComments(xmlPath);

    // Group endpoints by controller
    options.TagActionsBy(api => new[] { api.GroupName ?? api.ActionDescriptor.RouteValues["controller"] });
    options.DocInclusionPredicate((name, api) => true);

    // Add security definition for JWT Bearer tokens (if needed in future)
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("PMA.Api")));

// Add Memory Cache
builder.Services.AddMemoryCache(options =>
{
    // Maximum number of entries (approximate, depends on Size property of each entry)
    options.SizeLimit = 1000; // total "size units" allowed in cache

    // Memory cleanup percentage when the cache reaches the limit
    options.CompactionPercentage = 0.25; // 25% items removed when trimming

    // How often the cache checks for expired entries
    options.ExpirationScanFrequency = TimeSpan.FromMinutes(5);
}); 

// Register repositories
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITaskStatusHistoryRepository, TaskStatusHistoryRepository>();
builder.Services.AddScoped<ISprintRepository, SprintRepository>();
builder.Services.AddScoped<IRequirementRepository, RequirementRepository>();
builder.Services.AddScoped<IProjectRequirementRepository, ProjectRequirementRepository>();
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<IUnitRepository, UnitRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IActionRepository, ActionRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<ILookupRepository, LookupRepository>();
builder.Services.AddScoped<ITimelineRepository, TimelineRepository>();
builder.Services.AddScoped<ICalendarEventRepository, CalendarEventRepository>();
builder.Services.AddScoped<IDesignRequestRepository, DesignRequestRepository>();
//builder.Services.AddScoped<IMemberTaskRepository, MemberTaskRepository>();

// Register services
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ISprintService, SprintService>();
builder.Services.AddScoped<IRequirementService, RequirementService>();
builder.Services.AddScoped<IProjectRequirementService, PMA.Core.Services.ProjectRequirementService>();
builder.Services.AddScoped<IRequirementTaskManagementService, RequirementTaskManagementService>();
builder.Services.AddScoped<ITimelineService, TimelineService>();
builder.Services.AddScoped<ICalendarEventService, CalendarEventService>();
builder.Services.AddScoped<IMemberTaskService, MemberTaskService>();
builder.Services.AddScoped<IDesignRequestService, DesignRequestService>();
builder.Services.AddScoped<IFileStorageService, PMA.Infrastructure.Services.FileStorageService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IUnitService, UnitService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IActionService, ActionService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ILookupService, LookupService>(); 
builder.Services.AddScoped<ICacheInvalidationService, CacheInvalidationService>();
builder.Services.AddScoped<PMA.Core.Interfaces.IAuthorizationService, PMA.Core.Services.AuthorizationService>();
builder.Services.AddScoped<PMA.Infrastructure.Services.IAuditService, PMA.Infrastructure.Services.AuditService>();
// Path provider abstraction
builder.Services.AddSingleton<PMA.Core.Interfaces.IAppPathProvider, PMA.Api.Services.AppPathProvider>();

// Register mapping services
builder.Services.AddMappingServices();

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:5170" };
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add Windows (Negotiate) Authentication
builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme)
    .AddNegotiate();

// Register IHttpContextAccessor for accessing HttpContext in services
builder.Services.AddHttpContextAccessor();

// Register the new UserContext pattern (preferred approach)
builder.Services.AddScoped<PMA.Core.Interfaces.IUserContextAccessor, PMA.Api.Services.UserContextAccessor>();

// Register legacy current-user service for backward compatibility (optional - if still needed by API layer)
builder.Services.AddScoped<PMA.Api.Services.ICurrentUserService, PMA.Api.Services.CurrentUserService>();
// Add SignalR
builder.Services.AddSignalR();
// Allow anonymous access to Swagger UI in development
builder.Services.AddAuthorization(options =>
{
    // Default policy requires authenticated users
    options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        // For now, just configure the basic Swagger UI
        // API versioning will be added when the correct provider type is available
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "PMA API v1");
        options.DocumentTitle = "PMA API Server - Swagger UI";
        options.RoutePrefix = string.Empty; // Serve Swagger UI at the root URL
    });
}

app.UseHttpsRedirection();

app.UseExceptionHandling();
app.UseRequestLogging();

app.UseCors("AllowSpecificOrigin");

app.UseAuthentication();
app.UseAuthorization();
app.UseAuditUser();

app.MapControllers();

// Map SignalR hubs
app.MapHub<PMA.Api.Hubs.NotificationHub>("/notificationHub");

// Health check endpoint
app.MapGet("/health", () => new
{
    status = "ok",
    timestamp = DateTime.UtcNow,
    version = "1.0.0",
    environment = app.Environment.EnvironmentName
});

app.Run();



