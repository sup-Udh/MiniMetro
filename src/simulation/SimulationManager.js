/**
 * SimulationManager — central simulation tick dispatcher.
 * Owns all game state. No Phaser dependencies.
 */

import GameClock from './GameClock.js';
import Station, { generateStation, SHAPES } from './Station.js';
import Line from './Line.js';
import Train, { TrainState } from './Train.js';
import Passenger, { PassengerState } from './Passenger.js';

export default class SimulationManager {
  constructor() {
    this.stations = [];
    this.lines = [];
    this.trains = [];
    this.passengers = [];
    this.clock = new GameClock();
    this.nextId = 0;
    this.score = 0;

    // Fail state
    this.isGameOver = false;
    this.gameOverStationId = null;

    // Events (renderers can subscribe)
    this.events = [];
  }

  _genId() {
    return this.nextId++;
  }

  init() {
    // Create 3 initial stations with guaranteed unique shapes
    const usedShapes = [];
    for (let i = 0; i < 3; i++) {
      // Pick a shape not yet used
      const available = SHAPES.filter(s => !usedShapes.includes(s));
      const shape = available[Math.floor(Math.random() * available.length)];
      usedShapes.push(shape);

      const station = generateStation(this._genId(), this.stations, shape);
      station.visible = true;
      this.stations.push(station);
    }

    // Create 3 lines (yellow, red, blue)
    const lineConfigs = [
      { color: 0xf0cb16, hex: '#f0cb16' },
      { color: 0xeb2827, hex: '#eb2827' },
      { color: 0x019ad1, hex: '#019ad1' }
    ];

    for (const cfg of lineConfigs) {
      const line = new Line(this._genId(), cfg.color, cfg.hex);
      this.lines.push(line);

      // Create 1 train per line
      const train = new Train(this._genId(), line.id);
      line.trainIds.push(train.id);
      this.trains.push(train);
    }
  }

  // ==================== MAIN UPDATE ====================

  update(delta) {
    if (this.isGameOver) return;

    this.clock.update(delta);
    this._updateStationSpawning();
    this._updatePassengerSpawning(delta);
    this._updateTrains(delta);
    this._updatePassengerStates(delta);
    this._updateOvercrowding(delta);
  }

  // ==================== STATION SPAWNING ====================

  _updateStationSpawning() {
    if (this.clock.shouldSpawnStation()) {
      const station = generateStation(this._genId(), this.stations);
      station.visible = true;
      this.stations.push(station);
      this._emit('stationAdded', station);
    }
  }

  // ==================== PASSENGER SPAWNING ====================

  _updatePassengerSpawning(delta) {
    if (!this.clock.shouldSpawnPassenger(delta)) return;

    const visible = this.stations.filter(s => s.visible);
    if (visible.length < 2) return;

    // Pick random origin station
    const origin = visible[Math.floor(Math.random() * visible.length)];

    // Pick a target shape DIFFERENT from origin's shape
    const otherShapes = SHAPES.filter(s => s !== origin.shape);
    const targetShape = otherShapes[Math.floor(Math.random() * otherShapes.length)];

    const passenger = new Passenger(this._genId(), targetShape, origin.id);
    this.passengers.push(passenger);
    origin.addPassenger(passenger);
    this._emit('passengerSpawned', passenger);
  }

  // ==================== TRAIN UPDATES ====================

  _updateTrains(delta) {
    for (const train of this.trains) {
      const line = this.getLineById(train.lineId);

      train.update(delta, (id) => this.getStationById(id), line, (t, stationId) => {
        this._onTrainArrived(t, stationId);
      });

      // Update passenger slot indices
      train.updatePassengerSlots();
    }
  }

  _onTrainArrived(train, stationId) {
    const station = this.getStationById(stationId);
    if (!station) return;

    // 1. Unboard passengers whose targetShape matches this station's shape
    const toUnboard = train.passengers.filter(
      p => p.state === PassengerState.ONBOARD && p.targetShape === station.shape
    );

    for (const p of toUnboard) {
      p.startUnboarding(stationId);
    }

    // 2. Board waiting passengers at this station (up to capacity)
    const waiting = [...station.waitingPassengers];
    for (const p of waiting) {
      if (!train.hasCapacity) break;
      if (p.state !== PassengerState.WAITING) continue;

      p.startBoarding(train.id);
      station.removePassenger(p.id);
      train.passengers.push(p);
    }
  }

  // ==================== PASSENGER STATE UPDATES ====================

  _updatePassengerStates(delta) {
    const animSpeed = 1 / 400; // complete animation in 400ms

    for (const passenger of this.passengers) {
      switch (passenger.state) {
        case PassengerState.BOARDING:
          passenger.animT += delta * animSpeed;
          if (passenger.animT >= 1) {
            passenger.finishBoarding();
          }
          break;

        case PassengerState.UNBOARDING:
          passenger.animT += delta * animSpeed;
          if (passenger.animT >= 1) {
            passenger.finishDelivery();
            // Remove from train
            const train = this.getTrainById(passenger.trainId);
            if (train) {
              train.passengers = train.passengers.filter(p => p.id !== passenger.id);
            }
            this.score++;
          }
          break;
      }
    }

    // Clean up delivered passengers
    this.passengers = this.passengers.filter(p => p.state !== PassengerState.DELIVERED);
  }

  // ==================== OVERCROWDING ====================

  _updateOvercrowding(delta) {
    for (const station of this.stations) {
      if (!station.visible) continue;

      if (station.isOvercrowded) {
        station.overcrowdTimer += delta / 1000;
        if (station.overcrowdTimer >= station.overcrowdLimit) {
          this._triggerGameOver(station);
          return;
        }
      } else {
        // Reset timer when passengers are cleared
        station.overcrowdTimer = Math.max(0, station.overcrowdTimer - delta / 1000);
      }
    }
  }

  _triggerGameOver(station) {
    this.isGameOver = true;
    this.gameOverStationId = station.id;
    this._emit('gameOver', { stationId: station.id, score: this.score });
  }

  // ==================== LINE EDITING API ====================

  addStationToLine(lineId, stationId) {
    const line = this.getLineById(lineId);
    if (!line) return false;

    const success = line.addStation(stationId);

    if (success) {
      this._emit('lineChanged', { lineId, stationId });

      // If a train on this line is IDLE and line now has >= 2 stations, start it
      for (const train of this.trains) {
        if (train.lineId === lineId && train.state === TrainState.IDLE) {
          if (line.stationIds.length >= 2) {
            // Place train at first station
            const firstStation = this.getStationById(line.stationIds[0]);
            if (firstStation) {
              train.x = firstStation.x;
              train.y = firstStation.y;
              train.lineIndex = 0;
            }
          }
        }
      }
    }

    return success;
  }

  // ==================== RESTART ====================

  restart() {
    this.stations = [];
    this.lines = [];
    this.trains = [];
    this.passengers = [];
    this.clock = new GameClock();
    this.nextId = 0;
    this.score = 0;
    this.isGameOver = false;
    this.gameOverStationId = null;
    this.events = [];
    this.init();
  }

  // ==================== QUERIES ====================

  getStationById(id) {
    return this.stations.find(s => s.id === id) || null;
  }

  getLineById(id) {
    return this.lines.find(l => l.id === id) || null;
  }

  getTrainById(id) {
    return this.trains.find(t => t.id === id) || null;
  }

  getTrainsByLine(lineId) {
    return this.trains.filter(t => t.lineId === lineId);
  }

  getVisibleStations() {
    return this.stations.filter(s => s.visible);
  }

  // ==================== EVENTS ====================

  _emit(type, data) {
    this.events.push({ type, data, time: this.clock.totalTime });
    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events.shift();
    }
  }
}
