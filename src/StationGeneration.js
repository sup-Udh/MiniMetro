// StationGeneration provides helper functions for creating station definitions.
// This file is intended to be imported by GameScene.

export function generateStations() {
  const stations = [];
  const minDistance = 80; // Minimum distance between stations to prevent overlap
  
  while (stations.length < 10) {
    const newStation = {
      x: Math.random() * 700 + 50,
      y: Math.random() * 500 + 50
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
