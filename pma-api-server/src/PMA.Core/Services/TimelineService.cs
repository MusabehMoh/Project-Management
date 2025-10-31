using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.Enums;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class TimelineService : ITimelineService
{
    private readonly ITimelineRepository _timelineRepository;
    private readonly IProjectRepository _projectRepository;
    private readonly IProjectRequirementRepository _projectRequirementRepository;

    public TimelineService(
        ITimelineRepository timelineRepository,
        IProjectRepository projectRepository,
        IProjectRequirementRepository projectRequirementRepository)
    {
        _timelineRepository = timelineRepository;
        _projectRepository = projectRepository;
        _projectRequirementRepository = projectRequirementRepository;
    }

    public async Task<(IEnumerable<Timeline> Timelines, int TotalCount)> GetTimelinesAsync(int page, int limit, int? projectId = null)
    {
        return await _timelineRepository.GetTimelinesAsync(page, limit, projectId);
    }

    public async Task<Timeline?> GetTimelineByIdAsync(int id)
    {
        return await _timelineRepository.GetByIdAsync(id);
    }

    public async Task<Timeline> CreateTimelineAsync(Timeline timeline)
    {
        timeline.CreatedAt = DateTime.Now;
        timeline.UpdatedAt = DateTime.Now;
        var createdTimeline = await _timelineRepository.AddAsync(timeline);

        // Update requirement status to UnderDevelopment if ProjectRequirementId is provided
        if (timeline.ProjectRequirementId.HasValue)
        {
            var requirement = await _projectRequirementRepository.GetByIdAsync(timeline.ProjectRequirementId.Value);
            if (requirement != null)
            {
                requirement.Status = RequirementStatusEnum.UnderDevelopment;
                requirement.UpdatedAt = DateTime.Now;
                await _projectRequirementRepository.UpdateAsync(requirement);
            }
        }

        // Update project status to UnderDevelopment
        var project = await _projectRepository.GetByIdAsync(timeline.ProjectId);
        if (project != null)
        {
            project.Status = ProjectStatus.UnderDevelopment;
            project.UpdatedAt = DateTime.Now;
            await _projectRepository.UpdateAsync(project);
        }

        return createdTimeline;
    }

    public async Task<Timeline> UpdateTimelineAsync(Timeline timeline)
    {
        timeline.UpdatedAt = DateTime.Now;
        await _timelineRepository.UpdateAsync(timeline);
        return timeline;
    }

    public async Task<bool> DeleteTimelineAsync(int id)
    {
        var timeline = await _timelineRepository.GetByIdAsync(id);
        if (timeline != null)
        {
            await _timelineRepository.DeleteAsync(timeline);
            return true;
        }
        return false;
    }

    public async Task<IEnumerable<Timeline>> GetTimelinesByProjectAsync(int projectId)
    {
        return await _timelineRepository.GetTimelinesByProjectAsync(projectId);
    }
}