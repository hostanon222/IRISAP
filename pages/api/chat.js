import { initializeStore } from '@/utils/store';
import { aiService } from '@/services/ai';

// Initialize store and get instances
const store = initializeStore();
const { wss, generator } = store;

console.log('🔄 API route initialized');
console.log('🔑 API Key Status:', !!process.env.ANTHROPIC_API_KEY); // Debug log

// Verify API key is loaded
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is not set in environment variables');
}

if (wss) {
  // Only set up listeners if they haven't been set up already
  if (!wss.listenerCount('connection')) {
    console.log('📡 Setting up WebSocket listeners...');
    
    wss.on('connection', (ws) => {
      console.log('🔌 New WebSocket connection established');
      
      // Add viewer to the generator
      generator.addViewer(ws);

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('📨 Received message:', data);

          // Verify API key before processing messages
          if (!process.env.ANTHROPIC_API_KEY) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'API key not configured'
            }));
            return;
          }

        } catch (error) {
          console.error('❌ Error processing message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        generator.removeViewer(ws);
      });

      ws.on('error', (error) => {
        console.error('🚨 WebSocket error:', error);
      });
    });

    console.log('✅ WebSocket listeners set up');
  }
}

export default async function handler(req, res) {
  // Debug logs for environment variables
  console.log('🔑 API Key available in handler:', !!process.env.ANTHROPIC_API_KEY);
  console.log('🌍 Environment:', process.env.NODE_ENV);

  if (req.method === 'GET' && req.headers.upgrade === 'websocket') {
    console.log('🤝 WebSocket upgrade request received');
    
    // Verify API key before upgrading connection
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ API key not found');
      return res.status(401).json({ 
        error: 'API key not configured',
        keyExists: !!process.env.ANTHROPIC_API_KEY
      });
    }

    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
      wss.emit('connection', ws, req);
    });
    return;
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 