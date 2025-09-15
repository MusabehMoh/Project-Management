const fetch = require('node-fetch');

async function testSprintCreation() {
  try {
    const response = await fetch('http://localhost:3002/api/timelines/1/sprints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Sprint',
        description: 'Test sprint description',
        startDate: '2025-09-01T00:00:00.000Z',
        endDate: '2025-09-14T23:59:59.999Z',
        statusId: 1,
        departmentId: 3
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSprintCreation();
