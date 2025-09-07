@echo off
echo Installing PMA Mock API Server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Navigate to mock-api-server directory
cd /d "%~dp0"

REM Install dependencies
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo Setting up environment file...
    copy ".env.example" ".env"
)

echo.
echo ✅ Installation complete!
echo.
echo To start the mock API server:
echo   npm run dev     (for development with hot reload)
echo   npm run build   (to build for production)
echo   npm start       (to run production build)
echo.
echo The server will run on http://localhost:3001
echo API endpoints will be available at http://localhost:3001/api
echo.
pause
