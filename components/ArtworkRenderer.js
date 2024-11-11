import React, { useRef, useEffect } from 'react';

export default function ArtworkRenderer({ instructions, width = 800, height = 400 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !instructions) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background
    ctx.fillStyle = instructions.background || '#000000';
    ctx.fillRect(0, 0, width, height);

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
  }, [instructions, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full"
    />
  );
} 