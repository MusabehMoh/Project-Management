#!/bin/bash
# 📦 PMA Project Transfer Script
# This script helps prepare the project for offline transfer

echo "🚀 PMA Project Transfer Preparation"
echo "=================================="

# Get project directory
PROJECT_DIR=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_DIR")

echo "📁 Current directory: $PROJECT_DIR"
echo "📦 Project name: $PROJECT_NAME"

# Create transfer directory
TRANSFER_DIR="$PROJECT_DIR/../${PROJECT_NAME}-transfer"
mkdir -p "$TRANSFER_DIR"

echo ""
echo "🎯 Choose transfer option:"
echo "1. Complete transfer (includes node_modules) - Larger but ready to run"
echo "2. Source only (excludes node_modules) - Smaller but needs npm install"
echo "3. Both options"

read -p "Enter choice (1-3): " choice

case $choice in
    1|3)
        echo ""
        echo "📦 Creating complete transfer archive..."
        tar -czf "$TRANSFER_DIR/${PROJECT_NAME}-complete.tar.gz" \
            --exclude='.git' \
            --exclude='*.log' \
            --exclude='.env.local' \
            --exclude='dist' \
            .
        echo "✅ Complete archive created: ${PROJECT_NAME}-complete.tar.gz"
        echo "   Size: $(du -h "$TRANSFER_DIR/${PROJECT_NAME}-complete.tar.gz" | cut -f1)"
        ;;
esac

case $choice in
    2|3)
        echo ""
        echo "📦 Creating source-only transfer archive..."
        tar -czf "$TRANSFER_DIR/${PROJECT_NAME}-source.tar.gz" \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='*.log' \
            --exclude='.env.local' \
            --exclude='dist' \
            .
        echo "✅ Source archive created: ${PROJECT_NAME}-source.tar.gz"
        echo "   Size: $(du -h "$TRANSFER_DIR/${PROJECT_NAME}-source.tar.gz" | cut -f1)"
        ;;
esac

# Create setup instructions
echo ""
echo "📝 Creating setup instructions..."
cp OFFLINE_SETUP.md "$TRANSFER_DIR/"

# Create package list for reference
echo ""
echo "📋 Creating dependency list..."
echo "# PMA Project Dependencies" > "$TRANSFER_DIR/dependencies.txt"
echo "# Generated on $(date)" >> "$TRANSFER_DIR/dependencies.txt"
echo "" >> "$TRANSFER_DIR/dependencies.txt"
echo "## Node.js Version Required:" >> "$TRANSFER_DIR/dependencies.txt"
node --version >> "$TRANSFER_DIR/dependencies.txt"
echo "" >> "$TRANSFER_DIR/dependencies.txt"
echo "## NPM Dependencies:" >> "$TRANSFER_DIR/dependencies.txt"
npm list --depth=0 >> "$TRANSFER_DIR/dependencies.txt" 2>/dev/null

# Create environment template
echo ""
echo "🔧 Creating environment template..."
cat > "$TRANSFER_DIR/.env.template" << EOF
# 🌐 PMA Project Environment Configuration
# Copy this file to .env in your project root and modify as needed

# API Configuration
VITE_USE_MOCK_API=true
VITE_API_URL=http://localhost:3001/api

# Development Settings
VITE_ENABLE_CONSOLE_LOGS=true
VITE_LOG_LEVEL=debug

# Production Settings (uncomment when ready)
# VITE_USE_MOCK_API=false
# VITE_API_URL=https://your-production-api.com/api
# VITE_ENABLE_CONSOLE_LOGS=false
EOF

# Create quick start script
echo ""
echo "🚀 Creating quick start script..."
cat > "$TRANSFER_DIR/quick-start.sh" << 'EOF'
#!/bin/bash
# 🚀 PMA Project Quick Start Script

echo "🚀 PMA Project Quick Start"
echo "========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Make sure you're in the project directory."
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.template .env
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies."
        exit 1
    fi
else
    echo "✅ Dependencies already installed."
fi

echo ""
echo "🎉 Setup complete! Starting development server..."
echo "📱 Application will open at: http://localhost:5173"
echo "⭐ Features available:"
echo "   - User Management (/users)"
echo "   - Project Dashboard (/)"
echo "   - Multi-language support (EN/AR)"
echo "   - Dark/Light theme"
echo "   - Mock API (no backend needed)"
echo ""
echo "🔧 Useful commands:"
echo "   npm run dev      - Start development server"
echo "   npm run build    - Build for production"
echo "   npm run lint     - Run code linting"
echo ""

# Start development server
npm run dev
EOF

chmod +x "$TRANSFER_DIR/quick-start.sh"

# Create Windows batch file
cat > "$TRANSFER_DIR/quick-start.bat" << 'EOF'
@echo off
echo 🚀 PMA Project Quick Start
echo =========================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo ✅ NPM version:
npm --version

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found. Make sure you're in the project directory.
    pause
    exit /b 1
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy .env.template .env
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies.
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies already installed.
)

echo.
echo 🎉 Setup complete! Starting development server...
echo 📱 Application will open at: http://localhost:5173
echo ⭐ Features available:
echo    - User Management (/users)
echo    - Project Dashboard (/)
echo    - Multi-language support (EN/AR)
echo    - Dark/Light theme
echo    - Mock API (no backend needed)
echo.
echo 🔧 Useful commands:
echo    npm run dev      - Start development server
echo    npm run build    - Build for production
echo    npm run lint     - Run code linting
echo.

REM Start development server
npm run dev
pause
EOF

echo ""
echo "✅ Transfer preparation complete!"
echo ""
echo "📂 Transfer files created in: $TRANSFER_DIR"
echo "📁 Contents:"
ls -la "$TRANSFER_DIR"

echo ""
echo "🚀 Next steps:"
echo "1. Copy the entire transfer directory to your offline machine"
echo "2. Extract the archive: tar -xzf ${PROJECT_NAME}-*.tar.gz"
echo "3. Run the quick start script: ./quick-start.sh (or quick-start.bat on Windows)"
echo "4. Or follow the detailed instructions in OFFLINE_SETUP.md"

echo ""
echo "💡 Tips:"
echo "- Use ${PROJECT_NAME}-complete.tar.gz for immediate setup (larger file)"
echo "- Use ${PROJECT_NAME}-source.tar.gz for smaller transfer (needs npm install)"
echo "- Both include setup instructions and quick start scripts"
EOF
