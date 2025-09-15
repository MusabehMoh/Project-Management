// Simple WebSocket connection test
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3003?username=test');

ws.on('open', function open() {
  console.log('✅ WebSocket connection successful!');
  console.log('Sending test authentication...');
  
  ws.send(JSON.stringify({
    type: 'authenticate',
    username: 'test',
    userId: 1
  }));
});

ws.on('message', function message(data) {
  console.log('📨 Received:', data.toString());
});

ws.on('close', function close() {
  console.log('❌ WebSocket connection closed');
});

ws.on('error', function error(err) {
  console.error('🚨 WebSocket error:', err.message);
});

// Close after 5 seconds
setTimeout(() => {
  console.log('🔚 Closing connection...');
  ws.close();
  process.exit(0);
}, 5000);
