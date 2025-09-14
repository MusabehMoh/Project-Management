# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["PMA.sln", "."]
COPY ["src/PMA.Api/PMA.Api.csproj", "src/PMA.Api/"]
COPY ["src/PMA.Core/PMA.Core.csproj", "src/PMA.Core/"]
COPY ["src/PMA.Infrastructure/PMA.Infrastructure.csproj", "src/PMA.Infrastructure/"]
RUN dotnet restore

# Copy everything else and build
COPY . .
WORKDIR "/src/src/PMA.Api"
RUN dotnet build "PMA.Api.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "PMA.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 8080
EXPOSE 8081

ENTRYPOINT ["dotnet", "PMA.Api.dll"]