const fetch = require('node-fetch');

async function testRequirementCreation() {
  try {
    const response = await fetch('http://localhost:3002/api/sprints/1/requirements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Requirement',
        description: 'Test requirement description',
        startDate: '2025-09-01T00:00:00.000Z',
        endDate: '2025-09-14T23:59:59.999Z',
        statusId: 1,
        priorityId: 2,
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

testRequirementCreation();
