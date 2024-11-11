require('dotenv').config();
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const { initializeStore } = require('./utils/store');

// Verify API key is loaded
console.log('API Key loaded:', process.env.ANTHROPIC_API_KEY ? '✅' : '❌');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Handle WebSocket upgrade requests
      if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
        return; // Let the WebSocket server handle it
      }

      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize WebSocket server with proper upgrade handling
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade requests
  server.on('upgrade', (request, socket, head) => {
    const pathname = parse(request.url).pathname;

    if (pathname === '/api/chat') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Set up WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    
    // Initialize store and get generator instance
    const { generator } = initializeStore();
    
    if (generator) {
      generator.addViewer(ws);
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received:', data);
        
        // Handle ping messages
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      if (generator) {
        generator.removeViewer(ws);
      }
    });

    // Send initial connection success message
    ws.send(JSON.stringify({
      type: 'connection_established',
      message: 'Connected to IRIS'
    }));
  });

  // Error handling for WebSocket server
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log('\n=== IRIS Server Started ===');
    console.log(`🌐 Server running on http://${hostname}:${port}`);
    console.log('📡 WebSocket server ready');
    console.log('🎨 Art generation system active');
    console.log('========================\n');
  });

  // Handle server shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    wss.close(() => {
      console.log('WebSocket server closed');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  });

  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
  });
});