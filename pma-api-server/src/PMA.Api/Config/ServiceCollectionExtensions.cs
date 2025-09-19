using Microsoft.Extensions.DependencyInjection;
using PMA.Core.Interfaces;
using PMA.Core.Services;

namespace PMA.Api.Config
{
    /// <summary>
    /// Service configuration extension methods for dependency injection
    /// </summary>
    public static class ServiceCollectionExtensions
    {
        /// <summary>
        /// Registers mapping services in the dependency injection container
        /// </summary>
        public static IServiceCollection AddMappingServices(this IServiceCollection services)
        {
            services.AddScoped<IMappingService, MappingService>();
            return services;
        }
    }
}