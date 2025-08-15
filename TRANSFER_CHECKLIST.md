# ✅ PMA Project Transfer Checklist

## 📋 Pre-Transfer Checklist

### Current Machine Preparation
- [ ] **Project is working** - Run `npm run dev` to verify everything works
- [ ] **All changes saved** - Commit or save any pending changes
- [ ] **Dependencies updated** - Run `npm install` to ensure all packages are current
- [ ] **Build test passed** - Run `npm run build` to verify project builds successfully

### Transfer Preparation
- [ ] **Run transfer script** - Execute `prepare-transfer.bat` (Windows) or `prepare-transfer.sh` (Linux/Mac)
- [ ] **Choose transfer method**:
  - [ ] Complete (includes node_modules) - ~200-500MB
  - [ ] Source only (excludes node_modules) - ~10-50MB
- [ ] **Verify archives created** - Check transfer directory for .zip/.tar.gz files

## 🚚 Transfer Methods

### Method 1: USB Drive/External Storage
```
1. Copy transfer directory to USB drive
2. Transport to offline machine
3. Copy from USB to desired location
4. Extract and run quick-start script
```

### Method 2: Network Transfer (if available)
```
1. Upload to shared network drive
2. Download on offline machine
3. Extract and run quick-start script
```

### Method 3: Cloud Storage (if available)
```
1. Upload to cloud storage (Google Drive, OneDrive, etc.)
2. Download on offline machine
3. Extract and run quick-start script
```

## 🎯 Offline Machine Setup Checklist

### Prerequisites Installation
- [ ] **Node.js v18+** installed and working
  - Test: `node --version` should show v18.x.x or higher
  - Test: `npm --version` should show compatible version
- [ ] **Code Editor** installed (VS Code recommended)
- [ ] **Git** installed (optional but recommended)

### Project Setup
- [ ] **Extract project** archive to desired location
- [ ] **Navigate to project** directory
- [ ] **Copy environment file** - Copy `.env.template` to `.env`
- [ ] **Install dependencies** (if using source-only transfer) - Run `npm install`
- [ ] **Test installation** - Run `npm run dev`

### Verification Steps
- [ ] **Development server starts** - Should open on http://localhost:5173
- [ ] **Application loads** - Main dashboard should appear
- [ ] **Navigation works** - Can navigate between pages
- [ ] **User management works** - Can access /users page
- [ ] **Language switching works** - Can toggle English/Arabic
- [ ] **Theme switching works** - Can toggle dark/light mode
- [ ] **Mock API responses** - User data loads correctly

## 🔧 Features to Test

### Core Functionality
- [ ] **Dashboard loads** with project overview
- [ ] **User management** page functional
- [ ] **Add new user** workflow complete
- [ ] **Edit user** functionality working
- [ ] **Role selection** with permissions working
- [ ] **Employee search** by name/military number

### UI/UX Features
- [ ] **Responsive design** - Works on different screen sizes
- [ ] **Dark/Light theme** toggle functional
- [ ] **English/Arabic** language switching
- [ ] **Navigation menu** fully functional
- [ ] **User profile** dropdown in navbar
- [ ] **Current user info** displayed correctly

### Technical Features
- [ ] **Hot reload** working (changes reflect immediately)
- [ ] **TypeScript** compilation working
- [ ] **ESLint** rules active
- [ ] **Build process** successful (`npm run build`)
- [ ] **No console errors** in browser DevTools

## 📁 Project Structure Understanding

### Key Directories
```
src/
├── components/     # UI components (navbar, forms, etc.)
├── pages/         # Page components (dashboard, users, etc.)
├── hooks/         # Custom React hooks (useCurrentUser, etc.)
├── services/      # API services (mock and real)
├── contexts/      # React contexts (LanguageContext)
├── types/         # TypeScript type definitions
└── styles/        # Global styles and configurations
```

### Configuration Files
```
package.json       # Dependencies and scripts
tsconfig.json      # TypeScript configuration
vite.config.ts     # Vite build configuration
tailwind.config.js # Tailwind CSS configuration
eslint.config.mjs  # ESLint rules
```

## 🚨 Troubleshooting Guide

### Common Issues

#### "node is not recognized"
- **Problem**: Node.js not installed or not in PATH
- **Solution**: Install Node.js from https://nodejs.org/

#### "Cannot find module"
- **Problem**: Dependencies not installed
- **Solution**: Run `npm install` in project directory

#### "Port 5173 is not available"
- **Problem**: Port conflict
- **Solution**: Vite will automatically use next available port, or specify: `npm run dev -- --port 3000`

#### "Module build failed"
- **Problem**: TypeScript or build errors
- **Solution**: Check console for specific errors, run `npm run type-check`

#### Application loads but features don't work
- **Problem**: Environment configuration or mock API issues
- **Solution**: Check `.env` file exists and has correct settings

## 🎯 Success Criteria

### Project is successfully transferred when:
- [ ] **Development server starts** without errors
- [ ] **All main pages load** (/, /users, /projects, /pricing)
- [ ] **User management features** work completely
- [ ] **Language switching** works between English and Arabic
- [ ] **Theme switching** works between dark and light modes
- [ ] **Mock API** provides data for all features
- [ ] **No critical console errors** in browser DevTools
- [ ] **Build process** completes successfully

## 📞 Support Information

### Resources Available
- **OFFLINE_SETUP.md** - Detailed setup instructions
- **quick-start.bat/.sh** - Automated setup scripts
- **dependencies.txt** - List of all project dependencies
- **Source code comments** - Inline documentation

### Getting Help
- Check browser console for error messages
- Review TypeScript compilation errors
- Verify Node.js and npm versions
- Ensure all files were transferred correctly

---

## 🎉 You're Ready!

Once all items in this checklist are complete, your PMA project should be fully functional on the offline machine with all features working exactly as they did on the original development environment.

**Happy coding! 🚀**
