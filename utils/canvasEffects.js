class Point3D {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.originalX = x;
    this.originalY = y;
    this.originalZ = z;
  }

  rotate(mouseX, mouseY) {
    // Convert mouse position to rotation angles
    const rotX = (mouseY - window.innerHeight / 2) * 0.0002;
    const rotY = (mouseX - window.innerWidth / 2) * 0.0002;

    // Rotate around Y axis
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const tempX = this.originalX * cosY - this.originalZ * sinY;
    const tempZ = this.originalZ * cosY + this.originalX * sinY;

    // Rotate around X axis
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    this.y = this.originalY * cosX - tempZ * sinX;
    this.z = tempZ * cosX + this.originalY * sinX;
    this.x = tempX;
  }

  project(width, height, fov, viewDistance) {
    const factor = fov / (viewDistance + this.z);
    const x = this.x * factor + width / 2;
    const y = this.y * factor + height / 2;
    return { x, y, factor };
  }
}

class Line3D {
  constructor(start, end, color = '#00ff00') {
    this.start = start;
    this.end = end;
    this.color = color;
  }

  draw(ctx, width, height, fov, viewDistance) {
    const start = this.start.project(width, height, fov, viewDistance);
    const end = this.end.project(width, height, fov, viewDistance);

    const alpha = Math.min(1, Math.max(0, 1 - (this.start.z + this.end.z) / 2000));
    ctx.strokeStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = Math.min(3, (start.factor + end.factor) / 2);
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
}

export function initializeInteractiveCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  let mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let lines = [];
  let points = [];
  let animationFrame;
  
  // 3D space configuration
  const FOV = 250;
  const VIEW_DISTANCE = 500;
  
  // Create 3D grid
  function createGrid() {
    const gridSize = 800;
    const gridDivisions = 20;
    const step = gridSize / gridDivisions;

    // Create points
    for (let x = -gridSize/2; x <= gridSize/2; x += step) {
      for (let z = -gridSize/2; z <= gridSize/2; z += step) {
        points.push(new Point3D(x, -100, z));
      }
    }

    // Create vertical lines
    for (let x = -gridSize/2; x <= gridSize/2; x += step) {
      const start = new Point3D(x, -100, -gridSize/2);
      const end = new Point3D(x, -100, gridSize/2);
      lines.push(new Line3D(start, end));
    }

    // Create horizontal lines
    for (let z = -gridSize/2; z <= gridSize/2; z += step) {
      const start = new Point3D(-gridSize/2, -100, z);
      const end = new Point3D(gridSize/2, -100, z);
      lines.push(new Line3D(start, end));
    }

    // Add some vertical lines for depth
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * gridSize - gridSize/2;
      const z = Math.random() * gridSize - gridSize/2;
      const height = Math.random() * 200 + 50;
      const start = new Point3D(x, -100, z);
      const end = new Point3D(x, -100 - height, z);
      lines.push(new Line3D(start, end, '#00ff33'));
    }
  }

  // Handle window resize
  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);
  handleResize();

  // Mouse event handlers
  const handleMouseMove = (e) => {
    mousePos = {
      x: e.clientX,
      y: e.clientY
    };
  };

  // Add event listeners
  canvas.addEventListener('mousemove', handleMouseMove);

  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw all points
    points.forEach(point => {
      point.rotate(mousePos.x, mousePos.y);
    });

    // Draw all lines
    lines.forEach(line => {
      line.start.rotate(mousePos.x, mousePos.y);
      line.end.rotate(mousePos.x, mousePos.y);
      line.draw(ctx, canvas.width, canvas.height, FOV, VIEW_DISTANCE);
    });
  }

  function animate() {
    animationFrame = requestAnimationFrame(animate);
    draw();
  }

  // Initialize grid and start animation
  createGrid();
  animate();

  // Cleanup function
  return () => {
    cancelAnimationFrame(animationFrame);
    window.removeEventListener('resize', handleResize);
    canvas.removeEventListener('mousemove', handleMouseMove);
  };
} 