using PMA.Core.Entities;
using PMA.Core.Interfaces;
using PMA.Core.DTOs;

namespace PMA.Core.Services;

public class LookupService : ILookupService
{
    private readonly ILookupRepository _lookupRepository;

    public LookupService(ILookupRepository lookupRepository)
    {
        _lookupRepository = lookupRepository;
    }

    public async Task<IEnumerable<LookupDto>> GetLookupsAsync(string? code = null)
    {
        var lookups = await _lookupRepository.GetLookupsAsync(code);
        return lookups.Select(MapToDto);
    }

    public async Task<LookupDto?> GetLookupByIdAsync(int id)
    {
        var lookup = await _lookupRepository.GetByIdAsync(id);
        return lookup != null && lookup.IsActive ? MapToDto(lookup) : null;
    }

    public async Task<LookupDto> CreateLookupAsync(Lookup lookup)
    {
        // Ensure new lookups are active by default
        lookup.IsActive = true;
        var createdLookup = await _lookupRepository.AddAsync(lookup);
        return MapToDto(createdLookup);
    }

    public async Task<LookupDto> UpdateLookupAsync(Lookup lookup)
    {
        await _lookupRepository.UpdateAsync(lookup);
        return MapToDto(lookup);
    }

    public async Task<bool> DeleteLookupAsync(int id)
    {
        var lookup = await _lookupRepository.GetByIdAsync(id);
        if (lookup == null)
        {
            return false;
        }

        await _lookupRepository.DeleteAsync(lookup);
        return true;
    }

    public async Task<IEnumerable<LookupDto>> GetLookupsByCategoryAsync(string code)
    {
        var lookups = await _lookupRepository.GetLookupsByCategoryAsync(code);
        return lookups.Select(MapToDto);
    }

    private static LookupDto MapToDto(Lookup lookup)
    {
        return new LookupDto
        {
            Id = lookup.Id,
            Code = lookup.Code,
            Name = lookup.Name,
            NameAr = lookup.NameAr,
            Value = lookup.Value,
            IsActive = lookup.IsActive
        };
    }
}