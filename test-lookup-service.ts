import { lookupServiceInstance } from "@/services/api";

// Test script to verify lookup service configuration
console.log("🔍 Testing Lookup Service Configuration...");

// Check if the service has the expected methods
console.log(
  "✅ Has getTaskStatuses:",
  typeof lookupServiceInstance.getTaskStatuses === "function",
);
console.log(
  "✅ Has getTaskPriorities:",
  typeof lookupServiceInstance.getTaskPriorities === "function",
);

// Test the service configuration
(async () => {
  try {
    console.log("🧪 Testing Task Status fetch...");
    const statusResponse = await lookupServiceInstance.getTaskStatuses();

    console.log("✅ Task Statuses loaded:", statusResponse.success);
    console.log("📊 Status count:", statusResponse.data?.length || 0);

    console.log("🧪 Testing Task Priority fetch...");
    const priorityResponse = await lookupServiceInstance.getTaskPriorities();

    console.log("✅ Task Priorities loaded:", priorityResponse.success);
    console.log("📊 Priority count:", priorityResponse.data?.length || 0);

    // Show which service is being used
    const isDevelopment = import.meta.env.MODE === "development";
    const useMockApi =
      import.meta.env.VITE_USE_MOCK_API === "true" ||
      import.meta.env.NEXT_PUBLIC_USE_MOCK_API === "true" ||
      isDevelopment;

    console.log(
      `🔧 Current Service: ${useMockApi ? "Mock Lookup Service" : "Real Lookup Service"}`,
    );
    console.log(`🌍 Environment: ${import.meta.env.MODE}`);
  } catch (error) {
    console.error("❌ Lookup service test failed:", error);
  }
})();
