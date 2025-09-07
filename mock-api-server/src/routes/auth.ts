import { Router } from "express";
import { Request, Response } from "express";

import { mockDelayHandler } from "../utils/mockDelay.js";

const router = Router();

// Mock login endpoint
router.post("/login", async (req: Request, res: Response) => {
  await mockDelayHandler();

  const { username, password } = req.body;

  // Simple mock authentication
  if (username === "admin" && password === "password") {
    res.json({
      success: true,
      data: {
        token: "mock-jwt-token-123456",
        user: {
          id: 1,
          username: "admin",
          name: "System Administrator",
          email: "admin@company.com",
          role: "admin",
        },
      },
      message: "Login successful",
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      },
    });
  }
});

// Mock logout endpoint
router.post("/logout", async (req: Request, res: Response) => {
  await mockDelayHandler();

  res.json({
    success: true,
    message: "Logout successful",
  });
});

// Mock user profile endpoint
router.get("/profile", async (req: Request, res: Response) => {
  await mockDelayHandler();

  // In a real app, you'd verify the JWT token here
  res.json({
    success: true,
    data: {
      id: 1,
      username: "admin",
      name: "System Administrator",
      email: "admin@company.com",
      role: "admin",
      department: "Information Technology Division",
    },
  });
});

export { router as authRoutes };
