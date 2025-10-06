# Define absolute paths to avoid variable reference issues
# Handle the case where $PSScriptRoot might be empty (when running in older PowerShell versions)
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$packagesFolder = (Join-Path $scriptDir "nuget-packages")
$sourceUrl = "https://api.nuget.org/v3/index.json"

# Enable TLS 1.2 for secure connections
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Create packages folder if it doesn't exist
if (-not (Test-Path $packagesFolder)) {
    New-Item -ItemType Directory -Path $packagesFolder
    Write-Host "Created directory: $packagesFolder"
}

# List of packages with their versions
$packages = @(
    # PMA.Api packages
    @{ Name = "Microsoft.AspNetCore.OpenApi"; Version = "8.0.0" },
    @{ Name = "Serilog.Sinks.Seq"; Version = "9.0.0" },
    @{ Name = "Swashbuckle.AspNetCore"; Version = "6.4.0" },
    @{ Name = "Microsoft.EntityFrameworkCore"; Version = "8.0.0" },
    @{ Name = "Microsoft.EntityFrameworkCore.SqlServer"; Version = "8.0.0" },
    @{ Name = "Microsoft.EntityFrameworkCore.Tools"; Version = "8.0.0" },
    @{ Name = "AutoMapper"; Version = "12.0.1" },
    @{ Name = "AutoMapper.Extensions.Microsoft.DependencyInjection"; Version = "12.0.1" },
    @{ Name = "FluentValidation.AspNetCore"; Version = "11.3.0" },
    @{ Name = "Serilog.AspNetCore"; Version = "8.0.0" },
    @{ Name = "Serilog.Sinks.Console"; Version = "5.0.0" },
    @{ Name = "Serilog.Sinks.File"; Version = "6.0.0" },
    @{ Name = "Microsoft.AspNetCore.Mvc.Versioning"; Version = "5.1.0" },
    @{ Name = "Microsoft.AspNetCore.Mvc.Versioning.ApiExplorer"; Version = "5.1.0" },
    @{ Name = "Microsoft.AspNetCore.Authentication.Negotiate"; Version = "8.0.0" },
    
    # PMA.Core packages
    @{ Name = "FluentValidation"; Version = "11.9.0" },
    @{ Name = "Microsoft.Extensions.Caching.Abstractions"; Version = "9.0.9" },
    @{ Name = "Microsoft.AspNetCore.Http.Features"; Version = "2.2.0" },
    
    # PMA.Infrastructure packages
    @{ Name = "Microsoft.EntityFrameworkCore.Relational"; Version = "8.0.0" },
    @{ Name = "Microsoft.Extensions.Configuration.Binder"; Version = "8.0.0" },
    @{ Name = "Microsoft.Extensions.Logging.Abstractions"; Version = "8.0.0" }
)

# Check if NuGet CLI is available
$nugetPath = "$scriptDir\nuget.exe"
if (-not (Test-Path $nugetPath)) {
    Write-Host "NuGet CLI not found. Downloading..."
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri "https://dist.nuget.org/win-x86-commandline/latest/nuget.exe" -OutFile $nugetPath
        Write-Host "NuGet CLI downloaded successfully to $nugetPath" -ForegroundColor Green
        
        # Verify the file exists
        if (-not (Test-Path $nugetPath)) {
            throw "NuGet.exe was not downloaded successfully"
        }
    }
    catch {
        Write-Host "Failed to download NuGet CLI: $_" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "NuGet CLI found at $nugetPath" -ForegroundColor Green
}

# Download each package
foreach ($package in $packages) {
    $packageId = $package.Name
    $version = $package.Version
    
    Write-Host "Downloading $packageId version $version..."
    
    try {
        # Ensure NuGet.exe exists before trying to use it
        if (-not (Test-Path $nugetPath)) {
            throw "NuGet.exe not found at $nugetPath"
        }
        
        # Use Start-Process to have more control over the execution
        # Properly escape paths to handle colons and special characters
        $arguments = @("install", $packageId, "-Version", $version, "-OutputDirectory", "`"$packagesFolder`"", "-Source", $sourceUrl, "-NoCache")
        $processInfo = Start-Process -FilePath $nugetPath -ArgumentList $arguments -NoNewWindow -PassThru -Wait
        
        if ($processInfo.ExitCode -eq 0) {
            Write-Host "Successfully downloaded $packageId v$version" -ForegroundColor Green
        } else {
            Write-Host "Failed to download $packageId v$version (Exit code: $($processInfo.ExitCode))" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "Error downloading $packageId v$version`: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nAll NuGet packages have been downloaded to $packagesFolder"