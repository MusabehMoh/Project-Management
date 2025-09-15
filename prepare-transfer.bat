@echo off
REM 📦 PMA Project Transfer Script for Windows
REM This script helps prepare the project for offline transfer

echo 🚀 PMA Project Transfer Preparation
echo ==================================

REM Get project directory
set PROJECT_DIR=%cd%
for %%I in (.) do set PROJECT_NAME=%%~nxI

echo 📁 Current directory: %PROJECT_DIR%
echo 📦 Project name: %PROJECT_NAME%

REM Create transfer directory
set TRANSFER_DIR=%PROJECT_DIR%\..\%PROJECT_NAME%-transfer
if not exist "%TRANSFER_DIR%" mkdir "%TRANSFER_DIR%"

echo.
echo 🎯 Choose transfer option:
echo 1. Complete transfer (includes node_modules) - Larger but ready to run
echo 2. Source only (excludes node_modules) - Smaller but needs npm install
echo 3. Both options

set /p choice="Enter choice (1-3): "

if "%choice%"=="1" goto complete
if "%choice%"=="2" goto source
if "%choice%"=="3" goto both
goto invalid

:complete
:both
echo.
echo 📦 Creating complete transfer archive...
REM Using 7zip if available, otherwise tar
where 7z >nul 2>&1
if %errorlevel% equ 0 (
    7z a -tzip "%TRANSFER_DIR%\%PROJECT_NAME%-complete.zip" . -x!.git -x!*.log -x!.env.local -x!dist
) else (
    REM Fallback to PowerShell
    powershell -command "Compress-Archive -Path '.\*' -DestinationPath '%TRANSFER_DIR%\%PROJECT_NAME%-complete.zip' -Force"
)
echo ✅ Complete archive created: %PROJECT_NAME%-complete.zip
if "%choice%"=="1" goto finish

:source
echo.
echo 📦 Creating source-only transfer archive...
REM Using 7zip if available, otherwise tar
where 7z >nul 2>&1
if %errorlevel% equ 0 (
    7z a -tzip "%TRANSFER_DIR%\%PROJECT_NAME%-source.zip" . -x!.git -x!node_modules -x!*.log -x!.env.local -x!dist
) else (
    REM Fallback to PowerShell (more complex exclusion)
    powershell -command "$exclude = @('.git', 'node_modules', '*.log', '.env.local', 'dist'); Get-ChildItem -Recurse | Where-Object { $exclude -notcontains $_.Name } | Compress-Archive -DestinationPath '%TRANSFER_DIR%\%PROJECT_NAME%-source.zip' -Force"
)
echo ✅ Source archive created: %PROJECT_NAME%-source.zip
goto finish

:invalid
echo ❌ Invalid choice. Please run the script again and choose 1, 2, or 3.
goto end

:finish
REM Create setup instructions
echo.
echo 📝 Creating setup instructions...
copy OFFLINE_SETUP.md "%TRANSFER_DIR%\"

REM Create package list for reference
echo.
echo 📋 Creating dependency list...
echo # PMA Project Dependencies > "%TRANSFER_DIR%\dependencies.txt"
echo # Generated on %date% %time% >> "%TRANSFER_DIR%\dependencies.txt"
echo. >> "%TRANSFER_DIR%\dependencies.txt"
echo ## Node.js Version Required: >> "%TRANSFER_DIR%\dependencies.txt"
node --version >> "%TRANSFER_DIR%\dependencies.txt"
echo. >> "%TRANSFER_DIR%\dependencies.txt"
echo ## NPM Dependencies: >> "%TRANSFER_DIR%\dependencies.txt"
npm list --depth=0 >> "%TRANSFER_DIR%\dependencies.txt" 2>nul

REM Create environment template
echo.
echo 🔧 Creating environment template...
(
echo # 🌐 PMA Project Environment Configuration
echo # Copy this file to .env in your project root and modify as needed
echo.
echo # API Configuration
echo VITE_USE_MOCK_API=true
echo VITE_API_URL=http://localhost:3001/api
echo.
echo # Development Settings
echo VITE_ENABLE_CONSOLE_LOGS=true
echo VITE_LOG_LEVEL=debug
echo.
echo # Production Settings ^(uncomment when ready^)
echo # VITE_USE_MOCK_API=false
echo # VITE_API_URL=https://your-production-api.com/api
echo # VITE_ENABLE_CONSOLE_LOGS=false
) > "%TRANSFER_DIR%\.env.template"

REM Create quick start batch file
echo.
echo 🚀 Creating quick start script...
(
echo @echo off
echo echo 🚀 PMA Project Quick Start
echo echo =========================
echo.
echo REM Check if Node.js is installed
echo node --version ^>nul 2^>^&1
echo if %%errorlevel%% neq 0 ^(
echo     echo ❌ Node.js is not installed. Please install Node.js v18+ first.
echo     echo    Download from: https://nodejs.org/
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo ✅ Node.js version:
echo node --version
echo echo ✅ NPM version:
echo npm --version
echo.
echo REM Check if we're in the right directory
echo if not exist "package.json" ^(
echo     echo ❌ package.json not found. Make sure you're in the project directory.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo REM Create .env if it doesn't exist
echo if not exist ".env" ^(
echo     echo 📝 Creating .env file from template...
echo     copy .env.template .env
echo ^)
echo.
echo REM Install dependencies if node_modules doesn't exist
echo if not exist "node_modules" ^(
echo     echo 📦 Installing dependencies...
echo     npm install
echo     if %%errorlevel%% neq 0 ^(
echo         echo ❌ Failed to install dependencies.
echo         pause
echo         exit /b 1
echo     ^)
echo ^) else ^(
echo     echo ✅ Dependencies already installed.
echo ^)
echo.
echo echo.
echo echo 🎉 Setup complete! Starting development server...
echo echo 📱 Application will open at: http://localhost:5173
echo echo ⭐ Features available:
echo echo    - User Management ^(/users^)
echo echo    - Project Dashboard ^(/^)
echo echo    - Multi-language support ^(EN/AR^)
echo echo    - Dark/Light theme
echo echo    - Mock API ^(no backend needed^)
echo echo.
echo echo 🔧 Useful commands:
echo echo    npm run dev      - Start development server
echo echo    npm run build    - Build for production
echo echo    npm run lint     - Run code linting
echo echo.
echo.
echo REM Start development server
echo npm run dev
echo pause
) > "%TRANSFER_DIR%\quick-start.bat"

echo.
echo ✅ Transfer preparation complete!
echo.
echo 📂 Transfer files created in: %TRANSFER_DIR%
echo 📁 Contents:
dir "%TRANSFER_DIR%"

echo.
echo 🚀 Next steps:
echo 1. Copy the entire transfer directory to your offline machine
echo 2. Extract the archive ^(use WinRAR, 7-Zip, or built-in Windows extraction^)
echo 3. Run the quick start script: quick-start.bat
echo 4. Or follow the detailed instructions in OFFLINE_SETUP.md

echo.
echo 💡 Tips:
echo - Use %PROJECT_NAME%-complete.zip for immediate setup ^(larger file^)
echo - Use %PROJECT_NAME%-source.zip for smaller transfer ^(needs npm install^)
echo - Both include setup instructions and quick start scripts

:end
pause
