const { WebSocketServer } = require('ws');
const ArtGenerator = require('./ArtGenerator').default;

// Global store for server-side instances
global.store = global.store || {
  wss: null,
  generator: null,
  initialized: false
};

function initializeStore() {
  if (!global.store.initialized) {
    console.log('🚀 Initializing global store...');
    
    // Initialize WebSocket server
    global.store.wss = new WebSocketServer({ noServer: true });
    console.log('📡 WebSocket server created');

    // Initialize art generator
    global.store.generator = new ArtGenerator();
    console.log('🎨 Art generator created');

    global.store.initialized = true;
    console.log('✅ Global store initialized');
  }
  return global.store;
}

module.exports = {
  initializeStore,
  store: global.store
}; 