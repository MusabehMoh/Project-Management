# Update Program.cs to add IMappingService registration
$programFile = "d:\Work\Project-Management\pma-api-server\src\PMA.Api\Program.cs"

# Read the content of Program.cs
$content = Get-Content $programFile -Raw

# Check if we need to add the using statement for our config namespace
if (-not ($content -match "using PMA.Api.Config;")) {
    $content = $content -replace "using Microsoft.Extensions.Options;", "using Microsoft.Extensions.Options;`r`nusing PMA.Api.Config;"
}

# Find where to add our service registration
$addServicesPattern = "// Add AutoMapper"
$newContent = $content -replace $addServicesPattern, "// Register mapping services`r`nbuilder.Services.AddMappingServices();`r`n`r`n// Add AutoMapper"

# Save the updated content
$newContent | Set-Content $programFile -Force

Write-Output "Updated Program.cs to register mapping services."