# Project Management Application (PMA) - Copilot Instructions

## Project Overview

This is a comprehensive Project Management Application (PMA) built with modern web technologies. The application provides tools for managing projects, tasks, timelines, team collaboration, and role-based dashboards for different user types (Analyst Managers, Developer Managers, etc.). The system supports multi-language functionality (English/Arabic) with full RTL support and features a modern, responsive design.

## High-Level Repository Information

- **Repository Size**: Large-scale application with multiple specialized dashboards
- **Project Type**: Full-stack web application with mock API server
- **Primary Languages**: TypeScript (95%), JavaScript (3%), CSS (2%)
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Framework**: HeroUI (NextUI successor) with Tailwind CSS
- **Target Runtime**: Node.js 16+ for development, static build for production

## Architecture & Key Technologies

### Frontend Stack
- **React 18+** with TypeScript for type safety
- **Vite** for fast development and building
- **HeroUI** component library (modern successor to NextUI)
- **Tailwind CSS** for styling with custom design system
- **Framer Motion** for animations
- **React Query** for state management and API calls
- **React Router** for navigation
- **SignalR** for real-time communication

### Backend/API
- **Mock API Server** using Node.js and Express.js
- **Real-time updates** via SignalR hubs
- **RESTful API** design patterns

## Build & Development Instructions

### Prerequisites
- Node.js v16+ (tested with v18+)
- npm (comes with Node.js)

### Environment Setup
1. Always run `npm install` in the root directory first
2. Install mock API server dependencies: `cd mock-api-server && npm install`
3. Copy `.env.example` to `.env` for local development

### Development Commands
- **Frontend only**: `npm run dev` (runs on port 5173)
- **API server only**: `npm run dev:api` (runs mock API server)
- **Full development**: `npm run dev:all` (runs both frontend and API concurrently)
- **Build for production**: `npm run build`
- **Force build**: `npm run build:force` (skips TypeScript checking)
- **Lint code**: `npm run lint` (auto-fixes issues)
- **Preview production build**: `npm run preview`

### Critical Build Notes
- Always run TypeScript compiler before building with `tsc`
- The build process requires clean compilation - fix all TypeScript errors first
- Use `npm run build:force` only when TypeScript errors are non-blocking
- Mock API server must be running for full functionality testing

### Testing & Validation
- Run `npm run lint` before committing to ensure code quality
- Test files are located in root directory (test-*.js, test-*.ts)
- Manual testing: Use `npm run dev:all` to test full application functionality
- Check responsive design on different screen sizes
- Test both English and Arabic language modes

## Project Structure

### Root Directory Files
- `package.json` - Frontend dependencies and scripts
- `vite.config.ts` - Vite configuration with proxy to mock API
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration with custom theme
- `eslint.config.mjs` - ESLint configuration
- `.env.example` - Environment variables template

### Source Code Organization (`src/`)
- `components/` - Reusable UI components
  - `dashboard/` - Dashboard-specific components
    - `AnalystManagerDashboard.tsx` - Analyst manager dashboard
    - `DeveloperManagerDashboard.tsx` - Developer manager dashboard
    - `developer/` - Developer-specific components
  - `calendar/` - Calendar components
  - `primitives.ts` - Base UI component definitions
- `pages/` - Main application pages/routes
- `contexts/` - React contexts (Language, User, Notifications, Search)
- `hooks/` - Custom React hooks
- `services/` - API service layers
  - `api/` - API service classes and interfaces
- `types/` - TypeScript type definitions
- `utils/` - Utility functions
- `styles/` - Global CSS styles
- `layouts/` - Page layout components
- create directories for everything new to keep things organized.

### Mock API Server (`mock-api-server/`)
- `src/app.ts` - Main Express server (runs on port 3002)
- `src/routes/` - API route definitions  
- `src/controllers/` - Request handlers
- `src/services/` - Business logic
- `src/data/` - Mock data sources
- `src/signalR/` - Real-time hubs

### API Configuration
- **Mock API Server Port**: 3002 (default)
- **Frontend Dev Server Port**: 5173 (Vite)
- **API Base URL**: `http://localhost:3002/api` (configured in `src/services/api/client.ts`)
- **WebSocket URL**: `ws://localhost:3002` (for SignalR)

### Using API Services
- **Always use service classes** from `src/services/api/` instead of direct fetch calls
- **Use apiClient** for consistent error handling and configuration
- **Follow existing patterns** from services like `projectRequirementsService`, `developerQuickActionsService`
- **Port Configuration**: API calls automatically use port 3002 via `API_CONFIG.BASE_URL`

### Example API Usage
```typescript
// ✅ Correct - Use service classes
import { projectRequirementsService } from "@/services/api";
const result = await projectRequirementsService.getApprovedRequirements({ limit: 5 });

// ❌ Wrong - Direct fetch calls
const response = await fetch('/api/project-requirements/approved-requirements');
```

### Configuration Files
- `vite.config.ts` - Includes proxy configuration for API calls
- `tsconfig.json` - Strict TypeScript configuration
- `tailwind.config.js` - Custom theme with hero-ui integration
- `eslint.config.mjs` - Code quality rules

## Coding Standards & Conventions

### TypeScript Guidelines
- Always use strict TypeScript with proper type annotations
- Define interfaces for all data structures
- Use `React.FC` or explicit return types for components
- Prefer `type` over `interface` for unions and computed types
- Use `interface` for object shapes and extending

### React Patterns
- Use functional components with hooks exclusively
- Implement proper error boundaries where needed
- Use React.memo for performance optimization when appropriate
- Follow component composition patterns
- Use custom hooks for reusable logic

### File Naming
- Components: `PascalCase.tsx` (e.g., `DeveloperManagerDashboard.tsx`)
- Hooks: `camelCase.ts` starting with `use` (e.g., `useCurrentUser.ts`)
- Services: `camelCase.ts` (e.g., `apiClient.ts`)
- Types: `PascalCase.ts` or `camelCase.ts` (e.g., `UserTypes.ts`)

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow HeroUI component patterns
- Support both light and dark themes
- Ensure RTL support for Arabic language
- Use responsive design principles
- Maintain consistent spacing using Tailwind's spacing scale

### Import Organization
- External libraries first
- Internal services and utilities
- Component imports
- Type-only imports last
- Use absolute imports with `@/` prefix

## Language & Internationalization

### Multi-language Support
- All user-facing text must be internationalized
- Use `useLanguage()` hook for translations
- Add translations to `LanguageContext.tsx` for both English and Arabic
- Support RTL (right-to-left) layout for Arabic
- Use `dir={language === "ar" ? "rtl" : "ltr"}` on containers
- **CRITICAL**: Always add translations when creating new components with user-facing text
- **NO FALLBACK TEXT**: Use proper translation keys, don't rely on fallback English text

### Translation Key Patterns
- Use dot notation: `"dashboard.title"`, `"user.profile.edit"`
- Group related translations logically (e.g., all `developerDashboard.*` keys together)
- Always add both English and Arabic translations
- For new components, add translations immediately after creating the component

## Component Library (HeroUI)

### Core Components Used
- `Card`, `CardBody`, `CardHeader` for containers
- `Button` with various variants and states
- `Table` family for data display
- `Modal` for overlays
- `Input`, `Select`, `Autocomplete` for forms
- `Chip`, `Badge` for status indicators
- `Progress` for loading states
- `Avatar`, `AvatarGroup` for user representation

### Theming
- Uses custom theme configuration in `tailwind.config.js`
- Supports automatic dark/light mode switching
- Color palette: primary, secondary, success, warning, danger, default

## API Integration

### Service Layer Pattern
- Create service classes in `src/services/api/`
- Use `apiClient` base class for HTTP requests
- Implement proper error handling and TypeScript types
- Follow RESTful conventions
- Handle loading states and error states

### Mock API Server
- Located in `mock-api-server/`
- Provides realistic data structures
- Supports SignalR for real-time updates
- Use for development and testing

## Dashboard System

### Dashboard Types
- **AnalystManagerDashboard**: Requirements management, team performance
- **DeveloperManagerDashboard**: Development team management, approved requirements, deployments
- Each dashboard has specialized components in respective subdirectories

### Dashboard Components
- **ApprovedRequirements**: Shows approved requirements ready for development (Developer Manager)
- **PendingRequirements**: Shows draft requirements awaiting approval (Analyst Manager)
- **DeveloperQuickActions**: Task assignment and management tools
- Each component uses proper API services and follows consistent design patterns

### Role-Based Access
- Use `usePermissions()` hook for role checking
- Implement proper access controls in routing
- Support multiple roles per user

## Performance Considerations

- Use React.memo for expensive re-renders
- Implement proper loading states with Skeleton components
- Use React Query for API state management
- Optimize images and assets
- Lazy load non-critical components

## Error Handling Patterns

- Use try-catch blocks for async operations
- Implement error boundaries for component errors
- Provide user-friendly error messages
- Log errors appropriately for debugging
- Graceful fallbacks for failed API calls

## Development Workflow

1. Always start with `npm run dev:all` for full functionality
2. Make changes in small, focused commits
3. Run `npm run lint` before committing
4. Test in both English and Arabic modes
5. Verify responsive behavior
6. Check TypeScript compilation with `tsc`
7. **DO NOT create test files** unless specifically requested by the user
8. **DO NOT create documentation files or readme files** unless told
9. dont run npm run dev since its always running by myself.

## File Creation Guidelines

- **Components**: Always add proper translations immediately
- **API Services**: Use existing service patterns, never direct fetch calls
- **Hooks**: Follow existing naming conventions and patterns
- **Test Files**: DO NOT create test files automatically - only when explicitly requested
- **Documentation**: DO NOT create documentation files unless specifically asked

## Common Issues & Solutions

### Build Issues
- **TypeScript errors**: Fix all type issues before building
- **Missing dependencies**: Run `npm install` in both root and `mock-api-server/`
- **Port conflicts**: Default ports are 5173 (frontend) and 3002 (API)

### Development Issues
- **API calls failing**: Ensure mock API server is running
- **SignalR connection issues**: Check server status and CORS configuration
- **Styling issues**: Verify Tailwind classes and HeroUI component usage
- **Language switching**: Ensure translations exist in LanguageContext

## Validation Steps

Before any code changes, agents should:
1. Run `npm run dev:all` to ensure full application functionality
2. Test basic navigation and core features
3. Verify both language modes work correctly
4. Check responsive design on different screen sizes
5. Validate TypeScript compilation with `tsc`
6. Run linting with `npm run lint`

## Trust These Instructions

These instructions are comprehensive and regularly updated. Trust the information provided here and only search for additional context if:
- Specific implementation details are missing
- New features require documentation updates
- Error messages indicate configuration issues not covered
- API endpoints or data structures have changed

When in doubt, refer to the existing codebase patterns and maintain consistency with established conventions.