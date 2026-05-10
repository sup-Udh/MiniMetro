/**
 * GameScene — thin orchestrator. Creates the simulation and all
 * renderers, then dispatches update/render each frame.
 */

import Phaser from 'phaser';
import SimulationManager from './simulation/SimulationManager.js';
import StationRenderer from './rendering/StationRenderer.js';
import TrackRenderer from './rendering/TrackRenderer.js';
import TrainRenderer from './rendering/TrainRenderer.js';
import PassengerRenderer from './rendering/PassengerRenderer.js';
import UIRenderer from './rendering/UIRenderer.js';
import GameOverRenderer from './rendering/GameOverRenderer.js';
import DebugOverlay from './rendering/DebugOverlay.js';
import InputHandler from './input/InputHandler.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.sim = new SimulationManager();
    this.sim.init();

    // Track known stations (to bind input when new ones appear)
    this._knownStationIds = new Set();

    // Create renderers
    this.stationRenderer = new StationRenderer(this, this.sim);
    this.trackRenderer = new TrackRenderer(this, this.sim);
    this.trainRenderer = new TrainRenderer(this, this.sim);
    this.passengerRenderer = new PassengerRenderer(this, this.sim);
    this.uiRenderer = new UIRenderer(this, this.sim);
    this.gameOverRenderer = new GameOverRenderer(this, this.sim);
    this.debugOverlay = new DebugOverlay(this, this.sim);

    // Input handler
    this.inputHandler = new InputHandler(
      this, this.sim, this.stationRenderer, this.trackRenderer, this.uiRenderer
    );

    // Game over restart callback
    this.gameOverRenderer.onRestart = () => this._restart();
  }

  update(time, delta) {
    // 1. Simulation tick
    this.sim.update(delta);

    // 2. Bind input for newly created stations
    this._bindNewStations();

    // 3. Render all layers (reads sim state only)
    this.stationRenderer.render();
    this.trackRenderer.render();
    this.trainRenderer.render();
    this.passengerRenderer.render();
    this.uiRenderer.render();
    this.debugOverlay.render();

    // 4. Game over overlay (on top of everything)
    if (this.sim.isGameOver) {
      this.gameOverRenderer.render();
    }
  }

  /**
   * Check for new stations and bind their input handlers.
   */
  _bindNewStations() {
    for (const station of this.sim.stations) {
      if (station.visible && !this._knownStationIds.has(station.id)) {
        // StationRenderer.render() already created the graphic this frame
        // We need to wait a frame for it to exist, so check if it's there
        const graphic = this.stationRenderer.getGraphic(station.id);
        if (graphic) {
          this.inputHandler.bindStation(station.id);
          this._knownStationIds.add(station.id);
        }
      }
    }
  }

  /**
   * Full restart — destroy everything and reinitialize.
   */
  _restart() {
    // Destroy all renderers
    this.stationRenderer.destroy();
    this.trackRenderer.destroy();
    this.trainRenderer.destroy();
    this.passengerRenderer.destroy();
    this.uiRenderer.destroy();
    this.gameOverRenderer.destroy();
    this.debugOverlay.destroy();

    // Re-create everything
    this.sim = new SimulationManager();
    this.sim.init();
    this._knownStationIds = new Set();

    this.stationRenderer = new StationRenderer(this, this.sim);
    this.trackRenderer = new TrackRenderer(this, this.sim);
    this.trainRenderer = new TrainRenderer(this, this.sim);
    this.passengerRenderer = new PassengerRenderer(this, this.sim);
    this.uiRenderer = new UIRenderer(this, this.sim);
    this.gameOverRenderer = new GameOverRenderer(this, this.sim);
    this.debugOverlay = new DebugOverlay(this, this.sim);

    this.inputHandler = new InputHandler(
      this, this.sim, this.stationRenderer, this.trackRenderer, this.uiRenderer
    );

    this.gameOverRenderer.onRestart = () => this._restart();
  }
}