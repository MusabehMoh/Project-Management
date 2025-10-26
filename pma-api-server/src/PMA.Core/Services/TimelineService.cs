using PMA.Core.Entities;
using PMA.Core.Interfaces;
using System.Threading.Tasks;

namespace PMA.Core.Services;

public class TimelineService : ITimelineService
{
    private readonly ITimelineRepository _timelineRepository;

    public TimelineService(ITimelineRepository timelineRepository)
    {
        _timelineRepository = timelineRepository;
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
        return await _timelineRepository.AddAsync(timeline);
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