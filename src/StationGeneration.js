// StationGeneration provides helper functions for creating station definitions.
// This file is intended to be imported by GameScene.

export function generateStations() {
  // Define station locations here with random shapes.
  const shapes = ['circle', 'rectangle', 'triangle'];
  return [
    { x: 200, y: 300, shape: shapes[Math.floor(Math.random() * shapes.length)] },
    { x: 400, y: 200, shape: shapes[Math.floor(Math.random() * shapes.length)] },
    { x: 600, y: 350, shape: shapes[Math.floor(Math.random() * shapes.length)] },
    { x: 500, y: 500, shape: shapes[Math.floor(Math.random() * shapes.length)] }
  ];
}
