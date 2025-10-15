@echo off
echo ====================================
echo AI-Powered Form Suggestions Setup
echo ====================================
echo.

REM Check if Ollama is installed
where ollama >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [STEP 1/3] Installing Ollama...
    winget install Ollama.Ollama -e --silent
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install Ollama
        echo Please install manually from: https://ollama.com/download
        pause
        exit /b 1
    )
    echo Ollama installed successfully!
    echo Please restart this script after closing and reopening your terminal.
    pause
    exit /b 0
) else (
    echo [STEP 1/3] Ollama is already installed ✓
)

echo.
echo [STEP 2/3] Pulling Mistral 7B model (~4.4GB download)...
echo This may take a few minutes depending on your internet speed...
ollama pull mistral:7b-instruct

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Failed to download Mistral model
    echo Trying alternative: Llama 3.2 3B (smaller, faster)...
    ollama pull llama3.2:3b
    
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to download any model
        echo Please check your internet connection and try again
        pause
        exit /b 1
    )
)

echo.
echo [STEP 3/3] Testing model...
ollama run mistral:7b-instruct "Say 'Hello, AI is ready!'" --verbose

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Model test failed
    pause
    exit /b 1
)

echo.
echo ====================================
echo Setup Complete! ✓
echo ====================================
echo.
echo Your AI assistant is ready to use!
echo.
echo Next steps:
echo 1. Make sure your .env file has: VITE_LLM_ENABLED=true
echo 2. Start Ollama server: ollama serve
echo 3. Run your app: npm run dev
echo.
echo To start Ollama automatically, add to your dev script:
echo   "dev:all": "concurrently \"ollama serve\" \"npm run dev\" \"npm run dev:api\""
echo.
echo Available models:
ollama list
echo.
echo ====================================
pause
