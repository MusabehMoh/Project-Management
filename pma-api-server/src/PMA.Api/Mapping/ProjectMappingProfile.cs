using AutoMapper;
using PMA.Core.Entities;
using PMA.Core.DTOs;

namespace PMA.Api.Mapping;

public class ProjectMappingProfile : Profile
{
    public ProjectMappingProfile()
    {
        // Map from CreateProjectDto to Project entity
        CreateMap<CreateProjectDto, Project>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.ProjectOwnerId, opt => opt.MapFrom(src => src.ProjectOwner))
            .ForMember(dest => dest.AlternativeOwnerId, opt => opt.MapFrom(src => src.AlternativeOwner))
            .ForMember(dest => dest.OwningUnitId, opt => opt.MapFrom(src => src.OwningUnit))
            .ForMember(dest => dest.ProjectAnalysts, opt => opt.Ignore()) // Will be handled separately
            .ForMember(dest => dest.ProjectOwner, opt => opt.Ignore()) // Will be populated from database lookup
            .ForMember(dest => dest.AlternativeOwner, opt => opt.Ignore()) // Will be populated from database lookup
            .ForMember(dest => dest.OwningUnit, opt => opt.Ignore()) // Will be populated from database lookup 
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.ProjectOwnerEmployee, opt => opt.Ignore())
            .ForMember(dest => dest.AlternativeOwnerEmployee, opt => opt.Ignore())
            .ForMember(dest => dest.OwningUnitEntity, opt => opt.Ignore())
            .ForMember(dest => dest.Tasks, opt => opt.Ignore());

        // Map from UpdateProjectDto to Project entity (for updates)
        CreateMap<UpdateProjectDto, Project>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.ProjectOwnerId, opt => opt.MapFrom(src => src.ProjectOwner))
            .ForMember(dest => dest.AlternativeOwnerId, opt => opt.MapFrom(src => src.AlternativeOwner))
            .ForMember(dest => dest.OwningUnitId, opt => opt.MapFrom(src => src.OwningUnit))
            .ForMember(dest => dest.ProjectAnalysts, opt => opt.Ignore()) // Will be handled separately
            .ForMember(dest => dest.ProjectOwner, opt => opt.Ignore()) // Will be populated from database lookup
            .ForMember(dest => dest.AlternativeOwner, opt => opt.Ignore()) // Will be populated from database lookup
            .ForMember(dest => dest.OwningUnit, opt => opt.Ignore()) // Will be populated from database lookup 
            .ForMember(dest => dest.ProjectOwnerEmployee, opt => opt.Ignore())
            .ForMember(dest => dest.AlternativeOwnerEmployee, opt => opt.Ignore())
            .ForMember(dest => dest.OwningUnitEntity, opt => opt.Ignore())
            .ForMember(dest => dest.Tasks, opt => opt.Ignore())
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

        // Map from Project entity to ProjectDto
        CreateMap<Project, ProjectDto>();
    }
}