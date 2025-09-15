# PMA Mock API Server

A Node.js Express mock API server for the PMA (Project Management Application) project. This server provides realistic API endpoints for development and testing.

## Features

- 🚀 Express.js with TypeScript
- 📊 Timeline and Project Management APIs
- 🔒 Mock Authentication
- ⚡ Configurable response delays for realistic testing
- 🛡️ CORS, Rate limiting, and Security headers
- 📝 Comprehensive logging
- 🎯 Easy to customize and extend

## Quick Start

### Installation

```bash
cd mock-api-server
npm install
```

### Environment Setup

Copy the example environment file:
```bash
copy .env.example .env
```

Edit `.env` to customize settings:
```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
ENABLE_MOCK_DELAYS=true
```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Base URL
- Development: `http://localhost:3001/api`

### Authentication
- `POST /auth/login` - Mock login (username: admin, password: password)
- `POST /auth/logout` - Mock logout
- `GET /auth/profile` - Get user profile

### Projects
- `GET /projects` - Get all projects
- `GET /projects/:id` - Get project by ID
- `GET /projects/with-timelines` - Get projects with their timelines

### Timelines
- `GET /timelines/projects/:projectId` - Get timelines for a project
- `GET /timelines/projects-with-timelines` - Get all projects with timelines
- `POST /timelines` - Create new timeline
- `PUT /timelines/:id` - Update timeline
- `DELETE /timelines/:id` - Delete timeline
- `GET /timelines/departments` - Get departments
- `GET /timelines/resources` - Get resources

## API Response Format

All API responses follow this consistent format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "pagination": { /* optional pagination info */ },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "status": 400
  },
  "timestamp": "2025-01-01T10:00:00.000Z"
}
```

## Configuration

The server can be configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `CORS_ORIGIN` | http://localhost:5173 | Allowed CORS origin |
| `ENABLE_MOCK_DELAYS` | true | Add realistic delays to responses |
| `MOCK_DELAY_MIN` | 100 | Minimum delay in ms |
| `MOCK_DELAY_MAX` | 500 | Maximum delay in ms |

## Project Structure

```
src/
├── app.ts              # Main application file
├── config/             # Configuration management
├── controllers/        # Request handlers
├── data/              # Mock data
├── middleware/        # Express middleware
├── routes/            # Route definitions
├── services/          # Business logic
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Adding New APIs

1. **Create Types** (optional):
   ```typescript
   // src/types/newFeature.ts
   export interface NewFeature {
     id: string;
     name: string;
   }
   ```

2. **Add Mock Data**:
   ```typescript
   // src/data/mockNewFeature.ts
   import { NewFeature } from "../types/newFeature.js";
   
   export const mockNewFeatures: NewFeature[] = [
     { id: "1", name: "Feature 1" }
   ];
   ```

3. **Create Service**:
   ```typescript
   // src/services/newFeatureService.ts
   export class NewFeatureService {
     async getAll(): Promise<NewFeature[]> {
       return mockNewFeatures;
     }
   }
   ```

4. **Create Controller**:
   ```typescript
   // src/controllers/newFeatureController.ts
   export class NewFeatureController {
     async getAll(req: Request, res: Response) {
       // Handle request
     }
   }
   ```

5. **Add Routes**:
   ```typescript
   // src/routes/newFeature.ts
   const router = Router();
   const controller = new NewFeatureController();
   
   router.get("/", controller.getAll.bind(controller));
   
   export { router as newFeatureRoutes };
   ```

6. **Register Routes**:
   ```typescript
   // src/routes/index.ts
   import { newFeatureRoutes } from "./newFeature.js";
   
   routes.use("/new-feature", newFeatureRoutes);
   ```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linting
- `npm run lint:fix` - Fix linting issues
- `npm test` - Run tests

## Health Check

Check if the server is running:
```bash
curl http://localhost:3001/health
```

## Integration with Frontend

In your Vite frontend project, set:
```env
VITE_USE_MOCK_API=true
VITE_API_URL=http://localhost:3001/api
```

The frontend will automatically use this mock server when `VITE_USE_MOCK_API=true`.

## License

MIT License
