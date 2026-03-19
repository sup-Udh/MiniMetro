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
