// Simple test for the AdHoc endpoint
const baseUrl = 'http://localhost:3002';

async function testAdHocEndpoint() {
  try {
    console.log('🧪 Testing AdHoc endpoint...');
    
    // Test health check first
    const healthResponse = await fetch(`${baseUrl}/api`);
    console.log('✅ Health check:', healthResponse.status);
    
    // Test AdHoc endpoint
    const testData = {
      name: "Test AdHoc Task",
      description: "This is a test task",
      startDate: "2024-01-15",
      endDate: "2024-01-20",
      assignedMembers: [1, 2]
    };

    console.log('📝 Sending test data:', testData);
    
    const response = await fetch(`${baseUrl}/api/tasks/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response status text:', response.statusText);
    
    const responseData = await response.text();
    console.log('📊 Response data:', responseData);
    
    if (response.ok) {
      console.log('✅ AdHoc endpoint is working!');
    } else {
      console.log('❌ AdHoc endpoint failed');
    }
    
  } catch (error) {
    console.error('💥 Error testing endpoint:', error.message);
  }
}

testAdHocEndpoint();