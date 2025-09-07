@echo off
echo Starting PMA Mock API Server...
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Dependencies not installed. Running setup...
    call setup.bat
    if %errorlevel% neq 0 exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo Environment file not found. Copying from example...
    copy ".env.example" ".env"
)

echo Starting development server...
echo Server will be available at: http://localhost:3001
echo API endpoints at: http://localhost:3001/api
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
