# PMA API Server

A .NET Core 8 Web API application that provides project management functionality with MSSQL database integration. This application mirrors the APIs from the existing mock-api-server but uses a real database and follows SOLID principles.

## Architecture

The application follows Clean Architecture principles with the following layers:

- **PMA.Api**: Web API layer with controllers and middleware
- **PMA.Core**: Domain layer containing entities, interfaces, services, and DTOs
- **PMA.Infrastructure**: Data access layer with EF Core and repositories
- **PMA.Tests**: Unit and integration tests

## Features

- Project management with CRUD operations
- User management with roles and permissions
- Task and sprint management
- Requirements tracking
- Department and unit management
- Notification system
- Pagination and search functionality

## Prerequisites

- .NET 8.0 SDK
- Docker and Docker Compose
- SQL Server (via Docker)

## Getting Started

### Using Docker Compose (Recommended)

1. Clone the repository
2. Navigate to the project directory
3. Run the following command:

```bash
docker-compose up --build
```

This will start both the API and SQL Server in containers.

### Manual Setup

1. **Database Setup:**
   ```bash
   # Start SQL Server
   docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong!Passw0rd" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
   ```

2. **Update Connection String:**
   Update the connection string in `src/PMA.Api/appsettings.json` if needed.

3. **Run Migrations:**
   ```bash
   cd src/PMA.Api
   dotnet ef database update
   ```

4. **Run the Application:**
   ```bash
   dotnet run
   ```

The API will be available at `https://localhost:8081` and Swagger UI at `https://localhost:8081/swagger`.

## API Endpoints

### Projects
- `GET /api/projects` - Get all projects with pagination
- `GET /api/projects/{id}` - Get project by ID
- `GET /api/projects/stats` - Get project statistics
- `GET /api/projects/search` - Search projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

## Database Schema

The application uses Entity Framework Core with SQL Server. Key entities include:

- Projects
- Users
- Tasks
- Sprints
- Requirements
- Departments
- Units
- Roles
- Actions
- Notifications

## Testing

Run tests with:
```bash
dotnet test
```

## Development

### Adding New Entities

1. Create entity in `PMA.Core/Entities`
2. Add DbSet to `ApplicationDbContext`
3. Create repository interface in `PMA.Core/Interfaces`
4. Implement repository in `PMA.Infrastructure/Repositories`
5. Create service in `PMA.Core/Services`
6. Register dependencies in `Program.cs`
7. Create controller in `PMA.Api/Controllers`

### Code Style

- Follow C# coding conventions
- Use async/await for I/O operations
- Implement proper error handling
- Add XML documentation comments
- Write unit tests for new functionality

## Deployment

### Docker Deployment

```bash
docker build -t pma-api src/PMA.Api
docker run -p 8080:8080 pma-api
```

### IIS Deployment

1. Publish the application:
   ```bash
   dotnet publish src/PMA.Api -c Release -o ./publish
   ```

2. Deploy to IIS with the published files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following the established patterns
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.