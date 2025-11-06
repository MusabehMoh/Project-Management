/**
 * Runtime configuration - Can be modified after deployment
 * 
 * HOW TO USE:
 * 1. After deployment, modify this file to point to your production API URL
 * 2. No rebuild is required, changes take effect immediately on page refresh
 * 3. This file overrides values from .env used during build
 * 
 * DEPLOYED ON /pmaweb SUBDIRECTORY:
 * - basename: "/pmaweb/" (must end with slash for routing)
 * - apiUrl: Point to your API server (with or without /pmaweb depending on API location)
 */
window.PMA_CONFIG = {
  // API endpoint URL - change this to your production API URL after deployment
  apiUrl: "http://localhost:52246/api",
  
  // WebSocket URL for real-time features
  wsUrl: "http://localhost:52246/notificationHub",
  
  // Enable/disable SignalR real-time updates
  enableSignalR: true,

  // Application basename for routing - REQUIRED for /pmaweb subdirectory deployment
  // Must include leading and trailing slashes: "/pmaweb/"
  basename: "/",

  // File upload configuration
  maxFileSizeMB: 50,
  allowedFileTypes: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "jpg", "jpeg", "png", "gif", "bmp", "zip", "rar"]
};