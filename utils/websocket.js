import { getWebSocketUrl } from './websocketConfig';

class WebSocketClient {
  constructor() {
    this.isConnected = false;
    this.messageQueue = [];
    this.listeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.pingDelay = 30000; // 30 seconds
    this.pongDelay = 10000; // 10 seconds timeout for pong
    
    // Only connect if we're in the browser
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  connect() {
    try {
      console.log('Attempting WebSocket connection...');
      
      // Always use ws:// for localhost, wss:// for production
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const protocol = isLocalhost ? 'ws:' : 'wss:';
      const wsUrl = `${protocol}//${window.location.host}/api/chat`;
      
      console.log('Connecting to:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onStatusUpdate('connected');
      
      // Send any queued messages
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.send(message);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.onStatusUpdate('disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.log('WebSocket error:', error);
      this.onStatusUpdate('error');
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`Attempting to reconnect in ${delay}ms...`);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      console.log('Max reconnection attempts reached');
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'display_update':
        this.onStatsUpdate({
          totalCreations: data.total_creations,
          totalPixels: data.total_pixels,
          viewers: data.viewers
        });
        break;
      case 'request_canvas_data':
        this.sendCanvasData();
        break;
      default:
        // Notify all listeners
        this.listeners.forEach(listener => listener(data));
    }
  }

  sendCanvasData() {
    const canvas = document.getElementById('artCanvas');
    if (canvas) {
      const imageData = canvas.toDataURL('image/png');
      this.send({
        type: 'canvas_data',
        data: imageData
      });
    }
  }

  send(message) {
    if (!this.isConnected) {
      this.messageQueue.push(message);
      return;
    }

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  addMessageListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  onStatusUpdate(status) {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  onStatsUpdate(stats) {
    if (this.statsCallback) {
      this.statsCallback(stats);
    }
  }

  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  setStatsCallback(callback) {
    this.statsCallback = callback;
  }

  startHeartbeat() {
    this.pingInterval = setInterval(() => {
      this.ws.send(JSON.stringify({ type: 'ping' }));
      
      // Set pong timeout
      this.pongTimeout = setTimeout(() => {
        console.log('Pong timeout - reconnecting...');
        this.ws.close();
      }, this.pongDelay);
    }, this.pingDelay);
  }

  stopHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
  }

  pongReceived() {
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
  }
}

export default WebSocketClient; 