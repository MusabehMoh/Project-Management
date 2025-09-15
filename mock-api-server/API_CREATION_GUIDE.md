# 🚀 Easy API Creator Guide

This guide shows you how to quickly create new mock APIs for your PMA project.

## Quick API Creation Steps

### 1. Define Your Data Type (Optional)

Create a new type definition in `src/types/`:

```typescript
// src/types/newFeature.ts
export interface NewFeature {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
```

### 2. Create Mock Data

Add mock data in `src/data/`:

```typescript
// src/data/mockNewFeatures.ts
import { NewFeature } from "../types/newFeature.js";

export const mockNewFeatures: NewFeature[] = [
  {
    id: "1",
    name: "Feature One",
    description: "This is the first feature",
    status: "active",
    createdAt: "2025-01-01T10:00:00Z",
    updatedAt: "2025-01-01T10:00:00Z"
  },
  {
    id: "2", 
    name: "Feature Two",
    description: "This is the second feature",
    status: "inactive",
    createdAt: "2025-01-02T10:00:00Z",
    updatedAt: "2025-01-02T10:00:00Z"
  }
];
```

### 3. Create Service (Business Logic)

Add a service in `src/services/`:

```typescript
// src/services/newFeatureService.ts
import { NewFeature } from "../types/newFeature.js";
import { mockNewFeatures } from "../data/mockNewFeatures.js";

export class NewFeatureService {
  private features: NewFeature[] = [...mockNewFeatures];

  async getAll(): Promise<NewFeature[]> {
    return this.features;
  }

  async getById(id: string): Promise<NewFeature | null> {
    return this.features.find(feature => feature.id === id) || null;
  }

  async create(feature: Omit<NewFeature, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewFeature> {
    const newFeature: NewFeature = {
      ...feature,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.features.push(newFeature);
    return newFeature;
  }

  async update(id: string, updates: Partial<NewFeature>): Promise<NewFeature | null> {
    const index = this.features.findIndex(feature => feature.id === id);
    
    if (index === -1) {
      return null;
    }

    this.features[index] = {
      ...this.features[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return this.features[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.features.findIndex(feature => feature.id === id);
    
    if (index === -1) {
      return false;
    }

    this.features.splice(index, 1);
    return true;
  }
}
```

### 4. Create Controller (HTTP Handlers)

Add a controller in `src/controllers/`:

```typescript
// src/controllers/newFeatureController.ts
import { Request, Response } from "express";
import { NewFeatureService } from "../services/newFeatureService.js";
import { mockDelayHandler } from "../utils/mockDelay.js";

const newFeatureService = new NewFeatureService();

export class NewFeatureController {
  async getAll(req: Request, res: Response) {
    await mockDelayHandler();
    
    try {
      const features = await newFeatureService.getAll();
      
      res.json({
        success: true,
        data: features,
        pagination: {
          total: features.length,
          page: 1,
          limit: 100
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch features",
          code: "FETCH_ERROR"
        }
      });
    }
  }

  async getById(req: Request, res: Response) {
    await mockDelayHandler();
    
    try {
      const feature = await newFeatureService.getById(req.params.id);
      
      if (!feature) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Feature not found",
            code: "NOT_FOUND"
          }
        });
      }
      
      res.json({
        success: true,
        data: feature
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch feature",
          code: "FETCH_ERROR"
        }
      });
    }
  }

  async create(req: Request, res: Response) {
    await mockDelayHandler();
    
    try {
      const { name, description, status } = req.body;
      
      if (!name || !description) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Missing required fields: name, description",
            code: "VALIDATION_ERROR"
          }
        });
      }

      const feature = await newFeatureService.create({
        name,
        description,
        status: status || 'active'
      });

      res.status(201).json({
        success: true,
        data: feature,
        message: "Feature created successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to create feature",
          code: "CREATE_ERROR"
        }
      });
    }
  }

  async update(req: Request, res: Response) {
    await mockDelayHandler();
    
    try {
      const feature = await newFeatureService.update(req.params.id, req.body);
      
      if (!feature) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Feature not found",
            code: "NOT_FOUND"
          }
        });
      }

      res.json({
        success: true,
        data: feature,
        message: "Feature updated successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to update feature",
          code: "UPDATE_ERROR"
        }
      });
    }
  }

  async delete(req: Request, res: Response) {
    await mockDelayHandler();
    
    try {
      const deleted = await newFeatureService.delete(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Feature not found",
            code: "NOT_FOUND"
          }
        });
      }

      res.json({
        success: true,
        message: "Feature deleted successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to delete feature",
          code: "DELETE_ERROR"
        }
      });
    }
  }
}
```

### 5. Create Routes

Add routes in `src/routes/`:

```typescript
// src/routes/newFeature.ts
import { Router } from "express";
import { NewFeatureController } from "../controllers/newFeatureController.js";

const router = Router();
const controller = new NewFeatureController();

// CRUD routes
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.post("/", controller.create.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.delete("/:id", controller.delete.bind(controller));

export { router as newFeatureRoutes };
```

### 6. Register Routes

Update `src/routes/index.ts`:

```typescript
// Add this import
import { newFeatureRoutes } from "./newFeature.js";

// Add this route registration
routes.use("/new-features", newFeatureRoutes);
```

## 🎯 Common API Patterns

### Filtering and Search
```typescript
// In your controller
async getAll(req: Request, res: Response) {
  const { search, status, limit = 10, page = 1 } = req.query;
  
  let features = await newFeatureService.getAll();
  
  // Apply filters
  if (search) {
    features = features.filter(f => 
      f.name.toLowerCase().includes(search.toString().toLowerCase())
    );
  }
  
  if (status) {
    features = features.filter(f => f.status === status);
  }
  
  // Apply pagination
  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedFeatures = features.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedFeatures,
    pagination: {
      total: features.length,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(features.length / Number(limit))
    }
  });
}
```

### Validation
```typescript
// Create a validation middleware
const validateNewFeature = (req: Request, res: Response, next: NextFunction) => {
  const { name, description } = req.body;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Name is required",
        code: "VALIDATION_ERROR"
      }
    });
  }
  
  if (!description || description.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Description is required", 
        code: "VALIDATION_ERROR"
      }
    });
  }
  
  next();
};

// Use in routes
router.post("/", validateNewFeature, controller.create.bind(controller));
```

### Relationships
```typescript
// For related data (e.g., features belonging to projects)
async getByProjectId(projectId: number): Promise<NewFeature[]> {
  return this.features.filter(feature => feature.projectId === projectId);
}
```

## 🔧 Testing Your APIs

Once you've created your API, test it with:

### Using VS Code REST Client

Create a `.http` file:

```http
### Get all features
GET http://localhost:3001/api/new-features

### Get feature by ID
GET http://localhost:3001/api/new-features/1

### Create new feature
POST http://localhost:3001/api/new-features
Content-Type: application/json

{
  "name": "Test Feature",
  "description": "This is a test feature",
  "status": "active"
}

### Update feature
PUT http://localhost:3001/api/new-features/1
Content-Type: application/json

{
  "name": "Updated Feature Name",
  "status": "inactive"
}

### Delete feature
DELETE http://localhost:3001/api/new-features/1
```

### Using Browser/Postman

- GET: `http://localhost:3001/api/new-features`
- POST: `http://localhost:3001/api/new-features` (with JSON body)
- PUT: `http://localhost:3001/api/new-features/1` (with JSON body)
- DELETE: `http://localhost:3001/api/new-features/1`

## 🚀 Frontend Integration

In your React components:

```typescript
// src/services/api/newFeatureService.ts (in your main project)
import { apiClient } from "./client";

export const newFeatureService = {
  getAll: () => apiClient.get("/new-features"),
  getById: (id: string) => apiClient.get(`/new-features/${id}`),
  create: (data: any) => apiClient.post("/new-features", data),
  update: (id: string, data: any) => apiClient.put(`/new-features/${id}`, data),
  delete: (id: string) => apiClient.delete(`/new-features/${id}`)
};
```

## 📝 Quick Copy-Paste Template

Here's a minimal API template you can copy and modify:

```bash
# 1. Create files (replace 'items' with your feature name)
touch src/types/items.ts
touch src/data/mockItems.ts  
touch src/services/itemService.ts
touch src/controllers/itemController.ts
touch src/routes/items.ts

# 2. Add route to src/routes/index.ts:
# routes.use("/items", itemRoutes);
```

That's it! Your new API will be available at `http://localhost:3001/api/items` 🎉

## 📚 Available Examples

Check these existing APIs for reference:
- **Projects**: `/api/projects` - Basic CRUD
- **Timelines**: `/api/timelines` - Complex relationships
- **Auth**: `/api/auth` - Authentication patterns

Happy coding! 🚀
