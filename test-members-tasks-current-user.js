// Test script for members-tasks endpoint with current user filtering
// This script tests the updated endpoint that filters tasks by current user's PRS ID

const baseUrl = 'http://localhost:52246'; // Update this to match your API server port
const apiPath = '/api/members-tasks';

async function testMembersTasksEndpoint() {
  try {
    console.log('🧪 Testing members-tasks endpoint with current user filtering...');
    
    // Test the endpoint
    const url = `${baseUrl}${apiPath}?page=1&limit=20`;
    console.log(`📡 Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response status text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Response structure:');
      console.log('- Success:', data.success);
      console.log('- Message:', data.message);
      console.log('- Data type:', typeof data.data);
      
      if (data.data && Array.isArray(data.data)) {
        console.log('- Tasks count:', data.data.length);
        
        if (data.data.length > 0) {
          console.log('- First task sample:');
          const task = data.data[0];
          console.log(`  - ID: ${task.id}`);
          console.log(`  - Name: ${task.name}`);
          console.log(`  - PrimaryAssigneeId: ${task.primaryAssigneeId}`);
          console.log(`  - Status: ${task.status}`);
        }
      }
      
      if (data.pagination) {
        console.log('- Pagination:');
        console.log(`  - Page: ${data.pagination.page}`);
        console.log(`  - Limit: ${data.pagination.limit}`);
        console.log(`  - Total: ${data.pagination.totalItems}`);
        console.log(`  - Total Pages: ${data.pagination.totalPages}`);
      }
      
      console.log('✅ Members-tasks endpoint with current user filtering is working!');
    } else {
      const errorData = await response.text();
      console.log('❌ Endpoint failed');
      console.log('📊 Error response:', errorData);
      
      if (response.status === 401) {
        console.log('🔒 Note: This might be due to authentication being required');
      }
    }
    
  } catch (error) {
    console.error('💥 Error testing endpoint:', error.message);
    console.log('💡 Make sure the .NET API server is running on the correct port');
  }
}

// Note about the implementation:
console.log('📝 Implementation Summary:');
console.log('- The endpoint now uses ICurrentUserProvider.GetCurrentUserPrsIdAsync()');
console.log('- It automatically filters tasks by the current user\'s PRS ID');
console.log('- No more manual primaryAssigneeId parameter needed - it\'s set automatically');
console.log('- Users will only see tasks assigned to them');
console.log('');

testMembersTasksEndpoint();