/**
 * Train state machine and movement logic.
 * No Phaser dependencies — pure simulation.
 */

import { lerp, distance, angleBetween, easeInOutCubic } from '../utils/math.js';
import { PassengerState } from './Passenger.js';

export const TrainState = {
  IDLE: 'idle',
  MOVING: 'moving',
  ARRIVING: 'arriving',
  UNBOARDING: 'unboarding',
  BOARDING: 'boarding',
  DEPARTING: 'departing'
};

export default class Train {
  constructor(id, lineId) {
    this.id = id;
    this.lineId = lineId;
    this.state = TrainState.IDLE;
    this.passengers = [];
    this.capacity = 6;

    // Movement interpolation
    this.fromStationId = null;
    this.toStationId = null;
    this.t = 0;                    // 0..1 interpolation parameter
    this.direction = 1;            // +1 forward, -1 backward along line
    this.speed = 150;              // pixels per second

    // Current computed position
    this.x = 0;
    this.y = 0;
    this.angle = 0;

    // Index on the line's stationIds array
    this.lineIndex = 0;

    // State timer (ms)
    this.stateTimer = 0;

    // Timing constants (ms)
    this.unboardDuration = 500;
    this.boardDuration = 500;
    this.departDuration = 200;
  }

  /**
   * Main update tick. Called every frame by SimulationManager.
   * @param {number} delta - ms since last frame
   * @param {Function} getStation - function(id) => Station
   * @param {Line} line - the line this train belongs to
   * @param {Function} onArrive - callback(train, stationId) when train arrives at a station
   */
  update(delta, getStation, line, onArrive) {
    if (!line || line.stationIds.length < 2) {
      this.state = TrainState.IDLE;
      // Park at first station if available
      if (line && line.stationIds.length === 1) {
        const s = getStation(line.stationIds[0]);
        if (s) { this.x = s.x; this.y = s.y; }
      }
      return;
    }

    switch (this.state) {
      case TrainState.IDLE:
        this._startMoving(getStation, line);
        break;

      case TrainState.MOVING:
        this._updateMoving(delta, getStation, line, onArrive);
        break;

      case TrainState.ARRIVING:
        // Instant transition to unboarding
        this.state = TrainState.UNBOARDING;
        this.stateTimer = 0;
        break;

      case TrainState.UNBOARDING:
        this.stateTimer += delta;
        if (this.stateTimer >= this.unboardDuration) {
          this.state = TrainState.BOARDING;
          this.stateTimer = 0;
        }
        break;

      case TrainState.BOARDING:
        this.stateTimer += delta;
        if (this.stateTimer >= this.boardDuration) {
          this.state = TrainState.DEPARTING;
          this.stateTimer = 0;
        }
        break;

      case TrainState.DEPARTING:
        this.stateTimer += delta;
        if (this.stateTimer >= this.departDuration) {
          this._startMoving(getStation, line);
        }
        break;
    }
  }

  _startMoving(getStation, line) {
    if (line.stationIds.length < 2) {
      this.state = TrainState.IDLE;
      return;
    }

    // Determine next segment
    let nextIndex = this.lineIndex + this.direction;

    // Reverse at endpoints
    if (nextIndex >= line.stationIds.length || nextIndex < 0) {
      this.direction *= -1;
      nextIndex = this.lineIndex + this.direction;
    }

    // Validate
    if (nextIndex < 0 || nextIndex >= line.stationIds.length) {
      this.state = TrainState.IDLE;
      return;
    }

    this.fromStationId = line.stationIds[this.lineIndex];
    this.toStationId = line.stationIds[nextIndex];

    const from = getStation(this.fromStationId);
    const to = getStation(this.toStationId);

    if (!from || !to) {
      this.state = TrainState.IDLE;
      return;
    }

    this.t = 0;
    this.state = TrainState.MOVING;

    // Set initial angle
    this.angle = angleBetween(from.x, from.y, to.x, to.y);
  }

  _updateMoving(delta, getStation, line, onArrive) {
    const from = getStation(this.fromStationId);
    const to = getStation(this.toStationId);

    if (!from || !to) {
      this.state = TrainState.IDLE;
      return;
    }

    // Advance t based on distance and speed
    const dist = distance(from.x, from.y, to.x, to.y);
    const traverseTime = (dist / this.speed) * 1000; // ms
    const dt = delta / Math.max(traverseTime, 1);

    this.t += dt;

    if (this.t >= 1) {
      this.t = 1;
    }

    // Apply easing for smooth accel/decel
    const easedT = easeInOutCubic(this.t);

    // Compute position
    this.x = lerp(from.x, to.x, easedT);
    this.y = lerp(from.y, to.y, easedT);
    this.angle = angleBetween(from.x, from.y, to.x, to.y);

    // Check arrival
    if (this.t >= 1) {
      // Snap to destination
      this.x = to.x;
      this.y = to.y;

      // Update line index
      const nextIndex = this.lineIndex + this.direction;
      this.lineIndex = nextIndex;

      // Notify simulation
      this.state = TrainState.ARRIVING;
      this.stateTimer = 0;

      if (onArrive) {
        onArrive(this, this.toStationId);
      }
    }
  }

  /**
   * Assign a slot index to each onboard passenger.
   */
  updatePassengerSlots() {
    let slotIdx = 0;
    for (const p of this.passengers) {
      if (p.state === PassengerState.ONBOARD || p.state === PassengerState.BOARDING) {
        p.slotIndex = slotIdx++;
      }
    }
  }

  get passengerCount() {
    return this.passengers.filter(
      p => p.state === PassengerState.ONBOARD || p.state === PassengerState.BOARDING
    ).length;
  }

  get hasCapacity() {
    return this.passengerCount < this.capacity;
  }
}
