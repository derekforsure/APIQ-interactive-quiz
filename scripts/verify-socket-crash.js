const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', function open() {
    console.log('Connected to server');

    // Send malformed JSON
    console.log('Sending malformed JSON...');
    ws.send('{ invalid json }');

    // Send valid JSON afterwards to check if server is still alive
    setTimeout(() => {
        console.log('Sending valid JSON...');
        ws.send(JSON.stringify({ type: 'PING', payload: {} }));
    }, 1000);
});

ws.on('message', function message(data) {
    console.log('received: %s', data);
});

ws.on('close', function close() {
    console.log('disconnected');
});

ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
});

// Keep alive for a bit
setTimeout(() => {
    console.log('Test finished. If no disconnect, test passed.');
    process.exit(0);
}, 3000);
