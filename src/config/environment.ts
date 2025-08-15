// Environment configuration utilities

// Application Configuration
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || "Project Management Application",
  version: import.meta.env.VITE_APP_VERSION || "1.0.0",
  description: import.meta.env.VITE_APP_DESCRIPTION || "Project Management System",
  environment: import.meta.env.MODE || "development",
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || "10000"),
  useMockApi: import.meta.env.VITE_USE_MOCK_API === "true",
} as const;

// Authentication Configuration
export const AUTH_CONFIG = {
  provider: import.meta.env.VITE_AUTH_PROVIDER || "local",
  timeout: parseInt(import.meta.env.VITE_AUTH_TIMEOUT || "3600000"),
  sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || "1800000"),
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || "10485760"), // 10MB
  allowedTypes: (import.meta.env.VITE_ALLOWED_FILE_TYPES || ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif").split(","),
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
  notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === "true",
  export: import.meta.env.VITE_ENABLE_EXPORT === "true",
  bulkOperations: import.meta.env.VITE_ENABLE_BULK_OPERATIONS === "true",
  devtools: import.meta.env.VITE_ENABLE_DEVTOOLS === "true",
} as const;

// Localization Configuration
export const LOCALE_CONFIG = {
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || "en",
  supportedLanguages: (import.meta.env.VITE_SUPPORTED_LANGUAGES || "en,ar").split(","),
  fallbackLanguage: import.meta.env.VITE_FALLBACK_LANGUAGE || "en",
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  defaultTheme: import.meta.env.VITE_DEFAULT_THEME || "light",
  persistence: import.meta.env.VITE_THEME_PERSISTENCE === "true",
} as const;

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  debounceDelay: parseInt(import.meta.env.VITE_DEBOUNCE_DELAY || "300"),
  paginationDefaultLimit: parseInt(import.meta.env.VITE_PAGINATION_DEFAULT_LIMIT || "20"),
  paginationMaxLimit: parseInt(import.meta.env.VITE_PAGINATION_MAX_LIMIT || "100"),
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  csrfProtection: import.meta.env.VITE_CSRF_PROTECTION === "true",
  rateLimitRequests: parseInt(import.meta.env.VITE_RATE_LIMIT_REQUESTS || "100"),
  rateLimitWindow: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW || "900000"),
} as const;

// Development Configuration
export const DEV_CONFIG = {
  enableConsoleLog: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === "true",
  mockDelayMin: parseInt(import.meta.env.VITE_MOCK_DELAY_MIN || "200"),
  mockDelayMax: parseInt(import.meta.env.VITE_MOCK_DELAY_MAX || "800"),
} as const;

// Environment helpers
export const isDevelopment = () => import.meta.env.MODE === "development";
export const isProduction = () => import.meta.env.MODE === "production";
export const isTest = () => import.meta.env.MODE === "test";

// Validation helpers
export const validateEnvironment = () => {
  const errors: string[] = [];

  // Required environment variables
  const requiredVars = [
    "VITE_API_URL",
  ];

  // Check for required variables in production
  if (isProduction()) {
    requiredVars.forEach(varName => {
      if (!(import.meta.env as any)[varName]) {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    });
  }

  // Validate API URL format
  if (import.meta.env.VITE_API_URL) {
    try {
      new URL(import.meta.env.VITE_API_URL);
    } catch {
      errors.push("Invalid VITE_API_URL format");
    }
  }

  // Validate numeric values
  const numericVars = [
    "VITE_API_TIMEOUT",
    "VITE_AUTH_TIMEOUT", 
    "VITE_SESSION_TIMEOUT",
    "VITE_MAX_FILE_SIZE",
  ];

  numericVars.forEach(varName => {
    const value = (import.meta.env as any)[varName];
    if (value && isNaN(parseInt(value))) {
      errors.push(`Invalid numeric value for ${varName}: ${value}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Configuration summary for debugging
export const getConfigSummary = () => {
  if (!DEV_CONFIG.enableConsoleLog) return;
  
  console.group("🔧 Application Configuration");
  console.log("App:", APP_CONFIG);
  console.log("API:", API_CONFIG);
  console.log("Auth:", AUTH_CONFIG);
  console.log("Features:", FEATURE_FLAGS);
  console.log("Locale:", LOCALE_CONFIG);
  console.log("Performance:", PERFORMANCE_CONFIG);
  console.groupEnd();
};

// Initialize configuration validation and logging
if (isDevelopment()) {
  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.error("❌ Environment Configuration Errors:", validation.errors);
  }
  
  if (DEV_CONFIG.enableConsoleLog) {
    getConfigSummary();
  }
}
