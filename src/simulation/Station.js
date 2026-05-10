/**
 * Station data model and procedural generation.
 * No Phaser dependencies.
 */

import { distance } from '../utils/math.js';

export const SHAPES = ['circle', 'triangle', 'square', 'diamond', 'pentagon', 'star', 'cross', 'hexagon'];

export default class Station {
  constructor(id, x, y, shape) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.shape = shape;
    this.visible = false;
    this.waitingPassengers = [];
    this.overcrowdTimer = 0;       // seconds of overcrowding elapsed
    this.overcrowdLimit = 30;      // seconds until game over
    this.maxPassengers = 6;
  }

  get isOvercrowded() {
    return this.waitingPassengers.length >= this.maxPassengers;
  }

  addPassenger(passenger) {
    this.waitingPassengers.push(passenger);
  }

  removePassenger(passengerId) {
    this.waitingPassengers = this.waitingPassengers.filter(p => p.id !== passengerId);
  }
}

/**
 * Generate a single station with collision checking against existing stations.
 * Called by SimulationManager whenever the clock triggers a new station spawn.
 */
export function generateStation(id, existingStations, forcedShape = null) {
  const minDist = 120;
  const margin = 80;
  const maxAttempts = 200;
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = Math.random() * (w - margin * 2) + margin;
    const y = Math.random() * (h - margin * 2) + margin;

    let tooClose = false;
    for (const s of existingStations) {
      if (distance(x, y, s.x, s.y) < minDist) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      const shape = forcedShape || SHAPES[Math.floor(Math.random() * SHAPES.length)];
      return new Station(id, x, y, shape);
    }
  }

  // Fallback — relax constraints
  const x = Math.random() * (w - margin * 2) + margin;
  const y = Math.random() * (h - margin * 2) + margin;
  const shape = forcedShape || SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return new Station(id, x, y, shape);
}
