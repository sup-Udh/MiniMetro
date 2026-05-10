/**
 * PassengerRenderer — draws passengers waiting at stations and riding trains.
 * Handles boarding/unboarding animations. Reads simulation state only.
 */

import { drawShape } from './ShapeDrawer.js';
import { PassengerState } from '../simulation/Passenger.js';
import { lerp } from '../utils/math.js';

// Color palette for passenger shapes (softer, Mini Metro inspired)
const PASSENGER_COLORS = {
  circle:   0x555555,
  triangle: 0x555555,
  square:   0x555555,
  diamond:  0x555555,
  pentagon: 0x555555,
  hexagon:  0x555555,
  star:     0x555555,
  cross:    0x555555
};

export default class PassengerRenderer {
  constructor(scene, sim) {
    this.scene = scene;
    this.sim = sim;
    this.passengerGraphics = new Map(); // passengerId → Phaser.GameObjects.Graphics
  }

  render() {
    const activeIds = new Set();

    for (const passenger of this.sim.passengers) {
      activeIds.add(passenger.id);

      if (!this.passengerGraphics.has(passenger.id)) {
        this._createPassengerVisual(passenger);
      }

      this._updatePassengerVisual(passenger);
    }

    // Clean up graphics for passengers that no longer exist
    for (const [id, graphic] of this.passengerGraphics) {
      if (!activeIds.has(id)) {
        graphic.destroy();
        this.passengerGraphics.delete(id);
      }
    }
  }

  _createPassengerVisual(passenger) {
    const graphic = this.scene.add.graphics();
    graphic.setDepth(15);

    const color = PASSENGER_COLORS[passenger.targetShape] || 0x555555;
    drawShape(graphic, 5, passenger.targetShape, color, 0x333333, 1);

    // Start with small scale for pop-in effect
    graphic.setScale(0);
    this.scene.tweens.add({
      targets: graphic,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    this.passengerGraphics.set(passenger.id, graphic);
  }

  _updatePassengerVisual(passenger) {
    const graphic = this.passengerGraphics.get(passenger.id);
    if (!graphic) return;

    switch (passenger.state) {
      case PassengerState.WAITING:
        this._positionAtStation(passenger, graphic);
        break;

      case PassengerState.BOARDING:
        this._animateBoarding(passenger, graphic);
        break;

      case PassengerState.ONBOARD:
        this._positionOnTrain(passenger, graphic);
        break;

      case PassengerState.UNBOARDING:
        this._animateUnboarding(passenger, graphic);
        break;

      case PassengerState.DELIVERED:
        graphic.setAlpha(0);
        break;
    }
  }

  _positionAtStation(passenger, graphic) {
    const station = this.sim.getStationById(passenger.stationId);
    if (!station) return;

    // Arrange waiting passengers in a row below the station
    const waitingIndex = station.waitingPassengers.findIndex(p => p.id === passenger.id);
    const col = waitingIndex % 4;
    const row = Math.floor(waitingIndex / 4);

    const offsetX = (col - 1.5) * 12;
    const offsetY = 22 + row * 12;

    graphic.setPosition(station.x + offsetX, station.y + offsetY);
    graphic.setAlpha(1);
    graphic.setScale(1);
    graphic.setRotation(0);
  }

  _animateBoarding(passenger, graphic) {
    const train = this.sim.getTrainById(passenger.trainId);
    if (!train) return;

    // Get the station the passenger was at (approximate from train position)
    // During boarding, passenger moves from their last position to the train
    const currentX = graphic.x;
    const currentY = graphic.y;

    // Smoothly move toward train
    graphic.x = lerp(currentX, train.x, 0.15);
    graphic.y = lerp(currentY, train.y, 0.15);
    graphic.setScale(lerp(1, 0.6, passenger.animT));
    graphic.setAlpha(1);
  }

  _positionOnTrain(passenger, graphic) {
    const train = this.sim.getTrainById(passenger.trainId);
    if (!train) return;

    // Local offsets inside the train (2-column grid)
    const idx = passenger.slotIndex;
    const localX = (idx % 2 === 0 ? -4 : 4);
    const localY = Math.floor(idx / 2) * 5 - 3;

    // Rotate offsets with train
    const cos = Math.cos(train.angle);
    const sin = Math.sin(train.angle);
    const rotX = localX * cos - localY * sin;
    const rotY = localX * sin + localY * cos;

    graphic.setPosition(train.x + rotX, train.y + rotY);
    graphic.setRotation(train.angle);
    graphic.setScale(0.6);
    graphic.setAlpha(1);
    graphic.setDepth(21); // Above train
  }

  _animateUnboarding(passenger, graphic) {
    const station = this.sim.getStationById(passenger.stationId);
    if (!station) return;

    // Move from current position toward station + fade out
    graphic.x = lerp(graphic.x, station.x, 0.12);
    graphic.y = lerp(graphic.y, station.y, 0.12);
    graphic.setScale(lerp(0.6, 0.1, passenger.animT));
    graphic.setAlpha(lerp(1, 0, passenger.animT));
  }

  destroy() {
    for (const graphic of this.passengerGraphics.values()) {
      graphic.destroy();
    }
    this.passengerGraphics.clear();
  }
}
