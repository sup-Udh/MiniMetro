/**
 * StationRenderer — draws stations with shapes, appear animations,
 * and overcrowding indicators. Reads simulation state only.
 */

import { drawShape } from './ShapeDrawer.js';

export default class StationRenderer {
  constructor(scene, sim) {
    this.scene = scene;
    this.sim = sim;
    this.stationGraphics = new Map(); // stationId → { graphic, ring, appeared }
  }

  render() {
    for (const station of this.sim.stations) {
      if (!station.visible) continue;

      if (!this.stationGraphics.has(station.id)) {
        this._createStationVisual(station);
      }

      this._updateOvercrowdingIndicator(station);
    }
  }

  _createStationVisual(station) {
    // Main shape
    const graphic = this.scene.add.graphics();
    graphic.setPosition(station.x, station.y);
    graphic.setDepth(10);

    // Draw the shape (white fill, dark stroke — clean Mini Metro style)
    drawShape(graphic, 14, station.shape, 0xffffff, 0x333333, 2.5);

    // Interactive hit area for drag system
    graphic.setInteractive(
      new Phaser.Geom.Circle(0, 0, 20),
      Phaser.Geom.Circle.Contains
    );

    // Store station id on the graphic for input handler
    graphic.setData('stationId', station.id);

    // Overcrowding ring (separate graphics so it can pulse independently)
    const ring = this.scene.add.graphics();
    ring.setPosition(station.x, station.y);
    ring.setDepth(9);
    ring.setAlpha(0);

    // Appear animation
    graphic.setAlpha(0);
    graphic.setScale(0.3);

    this.scene.tweens.add({
      targets: graphic,
      alpha: 1,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });

    this.stationGraphics.set(station.id, { graphic, ring, appeared: true });
  }

  _updateOvercrowdingIndicator(station) {
    const entry = this.stationGraphics.get(station.id);
    if (!entry) return;

    const { ring } = entry;
    ring.clear();

    if (station.overcrowdTimer > 0) {
      // Draw countdown ring
      const progress = station.overcrowdTimer / station.overcrowdLimit;
      const alpha = 0.4 + 0.6 * progress;
      const pulseScale = 1 + 0.1 * Math.sin(this.scene.time.now * 0.008);

      ring.setAlpha(alpha);
      ring.setScale(pulseScale);

      // Background ring (gray)
      ring.lineStyle(3, 0x999999, 0.3);
      ring.strokeCircle(0, 0, 22);

      // Progress ring (red)
      ring.lineStyle(3, 0xe74c3c);
      ring.beginPath();
      ring.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress), false);
      ring.strokePath();
    } else {
      ring.setAlpha(0);
    }
  }

  /**
   * Get the Phaser Graphics object for a station (used by InputHandler).
   */
  getGraphic(stationId) {
    const entry = this.stationGraphics.get(stationId);
    return entry ? entry.graphic : null;
  }

  destroy() {
    for (const { graphic, ring } of this.stationGraphics.values()) {
      graphic.destroy();
      ring.destroy();
    }
    this.stationGraphics.clear();
  }
}
