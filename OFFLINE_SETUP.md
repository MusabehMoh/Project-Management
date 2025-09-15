# 🚀 PMA Project - Offline Development Setup Guide

## Prerequisites for Offline Machine

### Required Software
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **Git** (optional but recommended)
   - Download from: https://git-scm.com/

3. **Code Editor**
   - VS Code (recommended): https://code.visualstudio.com/
   - Or any TypeScript/React compatible editor

## 📦 Transfer Options

### Option A: Complete Transfer (Recommended for Offline)
```bash
# If you transferred the complete project with node_modules:
cd PMA-main
npm run dev  # Should work immediately
```

### Option B: Source Code Transfer
```bash
# If you transferred only source code:
cd PMA-main
npm install  # Install dependencies
npm run dev  # Start development server
```

## 🔧 Environment Setup

### 1. Environment Variables
Create `.env` file in project root:
```env
# Development Configuration
VITE_USE_MOCK_API=true
VITE_ENABLE_CONSOLE_LOGS=true
VITE_API_URL=http://localhost:3001/api

# Production Configuration (when ready)
# VITE_USE_MOCK_API=false
# VITE_API_URL=https://your-production-api.com/api
```

### 2. Package Scripts
```bash
# Development
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🌐 API Configuration

### Mock API (Default for Development)
- **Enabled by default** with `VITE_USE_MOCK_API=true`
- **No backend required** - uses mock data
- **Perfect for offline development**

### Real API Integration
```typescript
// When ready to connect to real API:
// 1. Set VITE_USE_MOCK_API=false in .env
// 2. Update VITE_API_URL to your API endpoint
// 3. Ensure backend is running and accessible
```

## 📁 Project Structure
```
PMA-main/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services (mock & real)
│   ├── contexts/          # React contexts (Language, etc.)
│   ├── types/             # TypeScript type definitions
│   ├── styles/            # Global styles
│   └── assets/            # Static assets
├── public/                # Public static files
└── [config files]        # Various configuration files
```

## 🔍 Key Features

### Current Implementation
- ✅ **User Management** with role-based permissions
- ✅ **Project Dashboard** with mock data
- ✅ **Multilingual Support** (English/Arabic)
- ✅ **Dark/Light Theme** switching
- ✅ **Responsive Design** for all devices
- ✅ **Mock API Integration** for offline development
- ✅ **Accessibility Compliant** with ARIA labels

### Mock Data Available
- **Users**: 10+ mock users with different roles
- **Roles**: Administrator, Project Manager, Team Lead, Developer, QA
- **Actions**: 10+ permission actions across categories
- **Projects**: Sample project data for dashboard

## 🛠️ Development Workflow

### 1. Start Development
```bash
npm run dev
# Open http://localhost:5173
```

### 2. Available Pages
- **Dashboard**: `/` - Main dashboard with project overview
- **Users**: `/users` - User management interface
- **Projects**: `/projects` - Project management
- **Pricing**: `/pricing` - Pricing information

### 3. User Management Features
- **Add Users**: Select employee, assign role, set permissions
- **Edit Users**: Modify roles and permissions
- **Role-based Access**: Different permission levels
- **Employee Search**: By name, military number, or username

### 4. Navigation Features
- **Current User Display**: Shows logged-in user info with role
- **Language Switching**: English ↔ Arabic
- **Theme Switching**: Dark ↔ Light mode
- **Search Functionality**: Global search (Ctrl+K)

## 🔧 Customization

### Adding New Features
1. **Components**: Add to `src/components/`
2. **Pages**: Add to `src/pages/`
3. **API Services**: Extend `src/services/api/`
4. **Types**: Define in `src/types/`

### Mock Data Modification
- **Users**: `src/services/api/mockUserService.ts`
- **Projects**: `src/services/api/mock.ts`
- **Roles & Actions**: `src/services/api/mockUserService.ts`

### Translations
- **English**: `src/contexts/LanguageContext.tsx` (en object)
- **Arabic**: `src/contexts/LanguageContext.tsx` (ar object)

## 🚨 Common Issues & Solutions

### Node.js Version
```bash
# Check version
node --version
# Should be v18+ for best compatibility
```

### Port Conflicts
```bash
# If port 5173 is in use, Vite will automatically use next available port
# Or specify custom port:
npm run dev -- --port 3000
```

### Dependencies Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Check for type errors
npm run type-check
```

## 📋 Checklist for Offline Setup

- [ ] Node.js v18+ installed
- [ ] Project files extracted
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env`)
- [ ] Development server starts (`npm run dev`)
- [ ] Application loads at http://localhost:5173
- [ ] User management features work
- [ ] Language switching works
- [ ] Theme switching works
- [ ] Mock API responses working

## 🎯 Next Steps

1. **Explore the Application**
   - Test user management features
   - Try different roles and permissions
   - Test multilingual functionality

2. **Customize for Your Needs**
   - Modify mock data to match your organization
   - Adjust UI components and styling
   - Add new features as required

3. **Prepare for Production**
   - Set up real API endpoints
   - Configure production environment variables
   - Test with real data

## 💡 Tips for Offline Development

- **Mock API is fully functional** - no internet required
- **All dependencies included** if using complete transfer
- **Hot reload works** - changes reflect immediately
- **TypeScript support** - full IntelliSense and error checking
- **Debugging tools** - Browser DevTools, React DevTools

---

**Happy Coding! 🚀**

For questions or issues, refer to the documentation in the source code or check the console for error messages.
