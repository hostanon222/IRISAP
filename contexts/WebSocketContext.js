import React, { createContext, useContext, useEffect, useState } from 'react';
import WebSocketClient from '@/utils/websocket';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [wsClient, setWsClient] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [stats, setStats] = useState({
    totalCreations: 0,
    totalPixels: 0,
    viewers: 0,
  });
  const [currentIdea, setCurrentIdea] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('waiting');
  const [drawingInstructions, setDrawingInstructions] = useState(null);
  const [currentReflection, setCurrentReflection] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [completedArtworkId, setCompletedArtworkId] = useState(null);

  // Load and draw last generated artwork immediately on mount
  useEffect(() => {
    const savedArtwork = localStorage.getItem('lastGeneratedArtwork');
    if (savedArtwork && (currentPhase === 'waiting' || currentPhase === 'completed')) {
      try {
        const artwork = JSON.parse(savedArtwork);
        setLastGenerated(artwork);
        setDrawingInstructions(artwork.instructions);
        handleDrawingInstructions(artwork.instructions);
      } catch (error) {
        console.error('Error loading saved artwork:', error);
      }
    }
  }, []);

  // Only initialize WebSocket on client side
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    try {
      const client = new WebSocketClient();
      
      client.onStatusUpdate = (newStatus) => {
        console.log('Status update:', newStatus);
        setStatus(newStatus);
        
        // If status becomes 'completed' or 'waiting', show last generated artwork
        if (newStatus === 'completed' || newStatus === 'waiting') {
          const savedArtwork = localStorage.getItem('lastGeneratedArtwork');
          if (savedArtwork) {
            try {
              const artwork = JSON.parse(savedArtwork);
              handleDrawingInstructions(artwork.instructions);
            } catch (error) {
              console.error('Error loading saved artwork:', error);
            }
          }
        }
      };
      
      client.onStatsUpdate = (newStats) => {
        console.log('Stats update:', newStats);
        setStats(newStats);
      };
      
      // Handle all state updates
      client.addMessageListener((data) => {
        console.log('Received message:', data);
        
        switch (data.type) {
          case 'state_update':
            setStatus(data.status);
            setCurrentPhase(data.phase);
            setCurrentIdea(data.idea);
            if (data.artworkId) {
              setCompletedArtworkId(data.artworkId);
            }
            setStats({
              totalCreations: data.total_creations,
              totalPixels: data.total_pixels,
              viewers: data.viewers
            });
            break;
            
          case 'drawing_instructions':
            setDrawingInstructions(data.instructions);
            // Save as last generated when new instructions arrive
            const newArtwork = {
              instructions: data.instructions,
              timestamp: Date.now()
            };
            setLastGenerated(newArtwork);
            localStorage.setItem('lastGeneratedArtwork', JSON.stringify(newArtwork));
            break;
            
          case 'reflection':
            setCurrentReflection(data.reflection);
            break;
            
          case 'error':
            console.error('Error from server:', data.message);
            setStatus('error');
            break;
        }
      });

      setWsClient(client);

      return () => {
        client.disconnect();
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setStatus('error');
    }
  }, []);

  // Handle new drawing instructions
  useEffect(() => {
    if (drawingInstructions) {
      handleDrawingInstructions(drawingInstructions);
    }
  }, [drawingInstructions]);

  // Function to handle drawing instructions
  const handleDrawingInstructions = (instructions) => {
    if (!instructions) {
      console.log('No instructions to draw');
      return;
    }
    
    const canvas = document.getElementById('artCanvas');
    if (!canvas) {
      console.log('Canvas not found');
      return;
    }

    console.log('Drawing instructions:', instructions);
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background
    ctx.fillStyle = instructions.background || '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw each element
    instructions.elements.forEach(element => {
      ctx.beginPath();
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.stroke_width;

      switch (element.type) {
        case 'circle':
          const [x, y] = element.points[0];
          const radius = element.points[1] ? 
            Math.hypot(element.points[1][0] - x, element.points[1][1] - y) : 
            50;
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          break;

        case 'line':
        case 'wave':
        case 'spiral':
          element.points.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point[0], point[1]);
            else ctx.lineTo(point[0], point[1]);
          });
          break;
      }

      if (element.closed) ctx.closePath();
      ctx.stroke();
    });
  };

  return (
    <WebSocketContext.Provider value={{ 
      wsClient, 
      status, 
      stats, 
      currentIdea, 
      currentPhase,
      drawingInstructions,
      currentReflection,
      lastGenerated,
      completedArtworkId
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
} 