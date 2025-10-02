// Test AdHoc Task API endpoint
// This script tests the newly added AdHoc endpoint in mock API server

console.log("🧪 TESTING ADHOC TASK API ENDPOINT");
console.log("==================================\n");

const testAdHocTask = {
  name: "Test AdHoc Task",
  description: "Testing the new AdHoc task endpoint",
  startDate: "2024-01-15T09:00:00Z",
  endDate: "2024-01-16T17:00:00Z",
  assignedMembers: [101, 102] // Array of member IDs
};

console.log("📤 Request Data:");
console.log(JSON.stringify(testAdHocTask, null, 2));

// Test function for the API
const testAdHocAPI = async () => {
  try {
    const response = await fetch('http://localhost:3002/api/tasks/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testAdHocTask)
    });

    console.log("\n📨 Response Status:", response.status);

    if (response.ok) {
      const result = await response.json();
      console.log("✅ SUCCESS - AdHoc task created!");
      console.log("📥 Response Data:");
      console.log(JSON.stringify(result, null, 2));
      
      console.log("\n🔍 Key Validations:");
      console.log("✅ TypeId = 3 (AdHoc):", result.data?.typeId === 3);
      console.log("✅ StatusId = 1 (ToDo):", result.data?.statusId === 1);
      console.log("✅ PriorityId = 2 (Medium):", result.data?.priorityId === 2);
      console.log("✅ SprintId = 1 (Default):", result.data?.sprintId === 1);
      console.log("✅ AssignedMembers preserved:", JSON.stringify(result.data?.assignedMembers));
      
    } else {
      const error = await response.json();
      console.log("❌ ERROR - Request failed!");
      console.log("📥 Error Data:");
      console.log(JSON.stringify(error, null, 2));
    }
    
  } catch (error) {
    console.log("❌ NETWORK ERROR:");
    console.log(error.message);
    console.log("\n💡 Possible Issues:");
    console.log("- Mock API server not running (should be on port 3002)");
    console.log("- CORS issues");
    console.log("- Network connectivity problems");
  }
};

console.log("\n🚀 To test this endpoint:");
console.log("1. Ensure mock API server is running: npm run dev:api");
console.log("2. Open browser console and run this script");
console.log("3. Or use curl:");
console.log(`curl -X POST http://localhost:3002/api/tasks/adhoc \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(testAdHocTask)}'`);

// If running in browser, uncomment this:
// testAdHocAPI();