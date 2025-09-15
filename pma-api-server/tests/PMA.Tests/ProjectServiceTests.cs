using PMA.Core.Entities;
using PMA.Core.Services;
using PMA.Core.Interfaces;
using Moq;
using Xunit;
using FluentAssertions;
using TaskEntity = PMA.Core.Entities.Task;
using System.Threading.Tasks;

namespace PMA.Tests;

public class ProjectServiceTests
{
    private readonly Mock<IProjectRepository> _projectRepositoryMock;
    private readonly ProjectService _projectService;

    public ProjectServiceTests()
    {
        _projectRepositoryMock = new Mock<IProjectRepository>();
        _projectService = new ProjectService(_projectRepositoryMock.Object);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetProjectByIdAsync_ShouldReturnProject_WhenProjectExists()
    {
        // Arrange
        var projectId = 1;
        var expectedProject = new Project
        {
            Id = projectId,
            ApplicationName = "Test Project",
            ProjectOwner = "Test Owner",
            AlternativeOwner = "Test Alt Owner",
            OwningUnit = "Test Unit",
            Description = "Test Description",
            Remarks = "Test Remarks",
            Status = ProjectStatus.New,
            Priority = Priority.High,
            Budget = 100000,
            Progress = 0
        };

        _projectRepositoryMock
            .Setup(repo => repo.GetProjectWithDetailsAsync(projectId))
            .ReturnsAsync(expectedProject);

        // Act
        var result = await _projectService.GetProjectByIdAsync(projectId);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEquivalentTo(expectedProject);
        _projectRepositoryMock.Verify(repo => repo.GetProjectWithDetailsAsync(projectId), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetProjectByIdAsync_ShouldReturnNull_WhenProjectDoesNotExist()
    {
        // Arrange
        var projectId = 999;
        _projectRepositoryMock
            .Setup(repo => repo.GetProjectWithDetailsAsync(projectId))
            .ReturnsAsync((Project?)null);

        // Act
        var result = await _projectService.GetProjectByIdAsync(projectId);

        // Assert
        result.Should().BeNull();
        _projectRepositoryMock.Verify(repo => repo.GetProjectWithDetailsAsync(projectId), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateProjectAsync_ShouldReturnCreatedProject()
    {
        // Arrange
        var newProject = new Project
        {
            ApplicationName = "New Project",
            ProjectOwner = "New Owner",
            AlternativeOwner = "New Alt Owner",
            OwningUnit = "New Unit",
            Description = "New Description",
            Remarks = "New Remarks",
            Status = ProjectStatus.New,
            Priority = Priority.Medium,
            Budget = 50000,
            Progress = 0
        };

        var createdProject = new Project
        {
            Id = 1,
            ApplicationName = "New Project",
            ProjectOwner = "New Owner",
            AlternativeOwner = "New Alt Owner",
            OwningUnit = "New Unit",
            Description = "New Description",
            Remarks = "New Remarks",
            Status = ProjectStatus.New,
            Priority = Priority.Medium,
            Budget = 50000,
            Progress = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _projectRepositoryMock
            .Setup(repo => repo.AddAsync(It.IsAny<Project>()))
            .ReturnsAsync(createdProject);

        // Act
        var result = await _projectService.CreateProjectAsync(newProject);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(1);
        result.CreatedAt.Should().NotBe(default);
        result.UpdatedAt.Should().NotBe(default);
        _projectRepositoryMock.Verify(repo => repo.AddAsync(It.IsAny<Project>()), Times.Once);
    }
}


