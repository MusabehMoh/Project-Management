/**
 * Runtime configuration - Can be modified after deployment
 * 
 * HOW TO USE:
 * 1. After deployment, modify this file to point to your production API URL
 * 2. No rebuild is required, changes take effect immediately on page refresh
 * 3. This file overrides values from .env used during build
 */
window.PMA_CONFIG = {
  // API endpoint URL - change this to your production API URL after deployment
  apiUrl: "http://localhost:52246/api",
  
  // WebSocket URL for real-time features
  wsUrl: "http://localhost:52246/notificationHub",
  
  // Enable/disable SignalR real-time updates
  enableSignalR: true,

  // Application basename for routing (change this if deploying to a subdirectory)
  basename: ""
};