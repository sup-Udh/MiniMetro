// StationGeneration provides helper functions for creating station definitions.
// This file is intended to be imported by GameScene.

export const SHAPES = ["square", "triangle", "diamond", "hexagon", "pentagon", "octagon", "star", "cross"];

export function generateStations() {
  const stations = [];
  const minDistance = 80; // Minimum distance between stations to prevent overlap
  const margin = 50; // Margin from screen edges
  
  while (stations.length < 5) {
    const newStation = {
      x: Math.random() * (window.innerWidth - margin * 2) + margin,
      y: Math.random() * (window.innerHeight - margin * 2) + margin,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)]
    };
    
    // Check if this station is far enough from all existing stations
    let isTooClose = false;
    for (let station of stations) {
      const distance = Math.sqrt(
        Math.pow(newStation.x - station.x, 2) + 
        Math.pow(newStation.y - station.y, 2)
      );
      
      if (distance < minDistance) {
        isTooClose = true;
        break;
      }
    }
    
    // Only add station if it's not too close to others
    if (!isTooClose) {
      stations.push(newStation);
    }
  }
  
  return stations;
}

export function generateShape(scene, x, y, size, shape, baseColor) {
  const graphic = scene.add.graphics();
  graphic.fillStyle(baseColor);
  graphic.lineStyle(2, 0xffffff);

  if (shape === 'square') {
    graphic.fillRect(x - size, y - size, size * 2, size * 2);
    graphic.strokeRect(x - size, y - size, size * 2, size * 2);
  } else if (shape === 'triangle') {
    graphic.beginPath();
    graphic.moveTo(x, y - size);
    graphic.lineTo(x - size, y + size);
    graphic.lineTo(x + size, y + size);
    graphic.closePath();
    graphic.fillPath();
    graphic.strokePath();
  } else if (shape === 'diamond') {
    graphic.beginPath();
    graphic.moveTo(x, y - size);
    graphic.lineTo(x + size, y);
    graphic.lineTo(x, y + size);
    graphic.lineTo(x - size, y);
    graphic.closePath();
    graphic.fillPath();
    graphic.strokePath();
  } else if (shape === 'hexagon') {
    graphic.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) graphic.moveTo(px, py);
      else graphic.lineTo(px, py);
    }
    graphic.closePath();
    graphic.fillPath();
    graphic.strokePath();
  } else if (shape === 'pentagon') {
    graphic.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) graphic.moveTo(px, py);
      else graphic.lineTo(px, py);
    }
    graphic.closePath();
    graphic.fillPath();
    graphic.strokePath();
  } else if (shape === 'octagon') {
    graphic.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) graphic.moveTo(px, py);
      else graphic.lineTo(px, py);
    }
    graphic.closePath();
    graphic.fillPath();
    graphic.strokePath();
  } else if (shape === 'star') {
    graphic.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? size : size * 0.5;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) graphic.moveTo(px, py);
      else graphic.lineTo(px, py);
    }
    graphic.closePath();
    graphic.fillPath();
    graphic.strokePath();
  } else if (shape === 'cross') {
    graphic.lineBetween(x - size, y, x + size, y);
    graphic.lineBetween(x, y - size, x, y + size);
  } else {
    // circle
    graphic.fillCircle(x, y, size);
    graphic.strokeCircle(x, y, size);
  }

  return graphic;
}
