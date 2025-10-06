# Database Connection Test Script
# This script tests the SQL Server connection

$connectionString = "Data Source=DESKTOP-88VGRA9;Database=PMA;Integrated Security=True;TrustServerCertificate=True;"

Write-Host "Testing database connection..." -ForegroundColor Cyan
Write-Host "Connection String: $connectionString" -ForegroundColor Gray
Write-Host ""

try {
    # Load SQL Server assembly
    Add-Type -AssemblyName "System.Data"
    
    # Create connection
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    
    Write-Host "Opening connection..." -ForegroundColor Yellow
    $connection.Open()
    
    Write-Host "[OK] Connection successful!" -ForegroundColor Green
    Write-Host "Database: $($connection.Database)" -ForegroundColor White
    Write-Host "Server Version: $($connection.ServerVersion)" -ForegroundColor White
    Write-Host "State: $($connection.State)" -ForegroundColor White
    Write-Host ""
    
    # Test a simple query
    Write-Host "Testing query execution..." -ForegroundColor Yellow
    $command = $connection.CreateCommand()
    $command.CommandText = 'SELECT @@VERSION'
    $version = $command.ExecuteScalar()
    Write-Host "[OK] Query executed successfully!" -ForegroundColor Green
    Write-Host "SQL Server Version: $($version.Split("`n")[0])" -ForegroundColor White
    Write-Host ""
    
    # List all tables in the database
    Write-Host "Listing tables in database..." -ForegroundColor Yellow
    $command.CommandText = @"
SELECT TABLE_SCHEMA, TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE' 
ORDER BY TABLE_SCHEMA, TABLE_NAME
"@
    
    $reader = $command.ExecuteReader()
    $count = 0
    
    while ($reader.Read()) {
        Write-Host "  - $($reader['TABLE_SCHEMA']).$($reader['TABLE_NAME'])" -ForegroundColor Gray
        $count++
    }
    $reader.Close()
    
    Write-Host ""
    Write-Host "Total tables found: $count" -ForegroundColor White
    Write-Host ""
    
    $connection.Close()
    Write-Host "[OK] All tests passed! Database is accessible." -ForegroundColor Green
    
    exit 0
}
catch [System.Data.SqlClient.SqlException] {
    Write-Host "[ERROR] SQL Error occurred:" -ForegroundColor Red
    Write-Host "Error Number: $($_.Exception.Number)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Server: $($_.Exception.Server)" -ForegroundColor Red
    
    # Common error codes
    switch ($_.Exception.Number) {
        -1 { Write-Host "`nTip: Connection timeout. Check if SQL Server is running and accessible." -ForegroundColor Yellow }
        -2 { Write-Host "`nTip: Network error. Check server name and network connectivity." -ForegroundColor Yellow }
        18456 { Write-Host "`nTip: Login failed. Check Windows authentication and permissions." -ForegroundColor Yellow }
        4060 { Write-Host "`nTip: Database does not exist. Check database name." -ForegroundColor Yellow }
    }
    
    exit 1
}
catch {
    Write-Host "[ERROR] Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.Exception.GetType().FullName -ForegroundColor Gray
    exit 1
}
