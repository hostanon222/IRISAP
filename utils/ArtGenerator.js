const { LRUCache } = require('lru-cache');
const { aiService } = require('../services/ai');
const { storageService } = require('../services/storage');

class ArtGenerator {
  constructor() {
    console.log('🎨 Initializing IRIS Art Generator...');
    this._initializeState();
    this._initializeCache();
    this._initializeRateLimiting();
    this.initialize();
  }

  _initializeState() {
    this.viewers = new Set();
    this.currentDrawing = null;
    this.currentState = [];
    this.currentStatus = "initializing";
    this.currentPhase = "initializing";
    this.currentIdea = null;
    this.currentReflection = null;
    this.totalCreations = 0;
    this.isRunning = false;
    this.generationInterval = 120;
    this.totalPixelsDrawn = 0;
    this.lastGenerationTime = new Date();
  }

  _initializeCache() {
    this.cache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 60 * 24
    });
  }

  _initializeRateLimiting() {
    this.rateLimits = new Map();
    this.maxRequestsPerMinute = 60;
    this.pendingUpdates = new Set();
    this.updateInterval = setInterval(() => this.broadcastPendingUpdates(), 1000);
    
    this.failureCount = 0;
    this.failureThreshold = 5;
    this.resetTimeout = 60000;
    this.lastFailureTime = 0;
    
    this.generationQueue = [];
    this.isProcessingQueue = false;
  }

  async initialize() {
    console.log('\n=== IRIS Initialization ===');
    try {
      const stats = await storageService.getStats();
      this.totalCreations = stats.totalCreations;
      this.totalPixelsDrawn = stats.totalPixels;
      
      this.isRunning = true;
      console.log('⚡ System activated');
      console.log(`📊 Loaded stats: ${this.totalCreations} creations, ${this.totalPixelsDrawn} pixels`);
      
      await this.generateNewArtwork();
      this.startGenerationLoop();
      
      console.log('✅ IRIS initialization complete\n');
    } catch (error) {
      console.error('❌ Initialization error:', error);
    }
  }

  async generateNewArtwork() {
    if (this._isCircuitBreakerOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      await this._generateArtworkPhases();
      await this._saveAndCacheArtwork();
      this.failureCount = 0;
    } catch (error) {
      this._handleGenerationError(error);
      throw error;
    }
  }

  async _generateArtworkPhases() {
    // Ideation Phase
    this._updateStatus("thinking", "ideation");
    this.currentIdea = await aiService.generateArtConcept();
    
    // Creation Phase
    this._updateStatus("drawing", "creation");
    const instructions = await aiService.generateDrawingInstructions(this.currentIdea);
    await this.broadcastInstructions(instructions);
    
    // Reflection Phase
    this._updateStatus("reflecting", "reflection");
    this.currentReflection = await aiService.generateReflection(this.currentIdea, instructions);
    await this.broadcastReflection(this.currentReflection);
  }

  async _saveAndCacheArtwork() {
    try {
      this._updateStatus("saving", "storage");
      console.log('💾 Starting artwork storage process...');

      if (!this.currentDrawing?.instructions) {
        throw new Error('No drawing instructions available');
      }

      // Save to database and get updated stats
      console.log('🗄️ Saving to database...');
      const { artwork: savedArtwork, stats } = await storageService.saveArtwork({
        drawingInstructions: this.currentDrawing.instructions,
        description: this.currentIdea,
        reflection: this.currentReflection
      });

      // Update local stats from database
      this.totalCreations = stats.totalCreations;
      this.totalPixelsDrawn = stats.totalPixels;

      console.log(`✅ Artwork saved successfully! ID: ${savedArtwork.id}`);
      console.log(`📊 Stats: ${stats.totalCreations} total creations, ${stats.totalPixels} total pixels`);

      // Cache the artwork
      const artworkId = `artwork_${Date.now()}`;
      this.cache.set(artworkId, {
        id: savedArtwork.id,
        idea: this.currentIdea,
        reflection: this.currentReflection,
        instructions: this.currentDrawing.instructions
      });

      this._updateStatus("completed", "completed");
      console.log('🎨 Generation cycle complete!\n');

    } catch (error) {
      console.error('❌ Error saving artwork:', error);
      this._updateStatus("error", "storage");
      throw error;
    }
  }

  _updateStatus(status, phase) {
    this.currentStatus = status;
    this.currentPhase = phase;
    
    // Enhanced status logging
    const statusEmoji = {
      thinking: '🤔',
      drawing: '✏️',
      reflecting: '💭',
      saving: '💾',
      completed: '✨',
      error: '❌'
    };

    console.log(`${statusEmoji[status] || '➡️'} Status: ${status.toUpperCase()} - Phase: ${phase.toUpperCase()}`);
    this.broadcastState();
  }

  _isCircuitBreakerOpen() {
    if (this.failureCount >= this.failureThreshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      return timeSinceLastFailure < this.resetTimeout;
    }
    return false;
  }

  _handleGenerationError(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.error('Generation error:', error);
  }

  async startGenerationLoop() {
    console.log('🔄 Starting generation loop...');
    while (this.isRunning) {
      try {
        console.log('⏰ Waiting for next generation interval...');
        await new Promise(resolve => setTimeout(resolve, this.generationInterval * 1000));
        console.log('🎨 Starting new artwork cycle...');
        await this.generateNewArtwork();
      } catch (error) {
        console.error('❌ Generation loop error:', error);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  async broadcastState() {
    const state = {
      type: 'state_update',
      status: this.currentStatus,
      phase: this.currentPhase,
      idea: this.currentIdea,
      total_creations: this.totalCreations,
      total_pixels: this.totalPixelsDrawn,
      viewers: this.viewers.size,
      generation_time: Math.floor((new Date() - this.lastGenerationTime) / 1000),
      last_saved: this.cache.get(`artwork_${Date.now()}`)?.id
    };

    const message = JSON.stringify(state);
    console.log('📤 Broadcasting state:', JSON.stringify(state, null, 2));

    for (const viewer of this.viewers) {
      try {
        viewer.send(message);
      } catch (error) {
        console.error('Error broadcasting to viewer:', error);
        this.viewers.delete(viewer);
      }
    }
  }

  async broadcastInstructions(instructions) {
    console.log('📢 Broadcasting drawing instructions');
    
    // Store the current drawing instructions
    this.currentDrawing = {
      instructions,
      timestamp: Date.now()
    };

    const message = JSON.stringify({
      type: 'drawing_instructions',
      instructions
    });

    for (const viewer of this.viewers) {
      try {
        viewer.send(message);
      } catch (error) {
        console.error('Error broadcasting instructions:', error);
        this.viewers.delete(viewer);
      }
    }
  }

  async broadcastReflection(reflection) {
    console.log('📢 Broadcasting reflection');
    const message = JSON.stringify({
      type: 'reflection',
      reflection
    });

    for (const viewer of this.viewers) {
      try {
        viewer.send(message);
      } catch (error) {
        console.error('Error broadcasting reflection:', error);
        this.viewers.delete(viewer);
      }
    }
  }

  addViewer(ws) {
    // Check rate limit
    const ip = ws._socket.remoteAddress;
    const now = Date.now();
    const recentRequests = this.rateLimits.get(ip) || [];
    const recentCount = recentRequests.filter(time => now - time < 60000).length;

    if (recentCount >= this.maxRequestsPerMinute) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Rate limit exceeded'
      }));
      return;
    }

    recentRequests.push(now);
    this.rateLimits.set(ip, recentRequests);

    // Add viewer
    this.viewers.add(ws);
    
    // Send cached state
    this.sendCachedState(ws);
    
    console.log(`👥 Total viewers: ${this.viewers.size}`);
  }

  async sendCachedState(ws) {
    try {
      // Send most recent cached artwork
      const cachedArtworks = Array.from(this.cache.keys())
        .sort()
        .slice(-5); // Get 5 most recent

      for (const artworkId of cachedArtworks) {
        const artwork = this.cache.get(artworkId);
        if (artwork) {
          ws.send(JSON.stringify({
            type: 'cached_artwork',
            ...artwork
          }));
        }
      }

      // Send current state
      await this.broadcastState();
    } catch (error) {
      console.error('Error sending cached state:', error);
    }
  }

  async broadcastPendingUpdates() {
    if (this.pendingUpdates.size === 0) return;

    const updates = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();

    const message = JSON.stringify({
      type: 'batch_update',
      updates
    });

    const disconnected = new Set();
    for (const viewer of this.viewers) {
      try {
        viewer.send(message);
      } catch (error) {
        disconnected.add(viewer);
      }
    }

    // Clean up disconnected viewers
    for (const viewer of disconnected) {
      this.removeViewer(viewer);
    }
  }

  queueUpdate(update) {
    this.pendingUpdates.add(update);
  }

  removeViewer(ws) {
    console.log('👋 Viewer disconnected');
    this.viewers.delete(ws);
    console.log(`👥 Total viewers: ${this.viewers.size}`);
  }

  cleanup() {
    clearInterval(this.updateInterval);
    this.cache.reset();
    this.rateLimits.clear();
    this.pendingUpdates.clear();
  }
}

module.exports = {
  default: ArtGenerator
};
