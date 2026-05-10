/**
 * TrainRenderer — draws trains as colored pill/capsule shapes.
 * Position and rotation read from simulation state.
 */

export default class TrainRenderer {
  constructor(scene, sim) {
    this.scene = scene;
    this.sim = sim;
    this.trainVisuals = new Map(); // trainId → Phaser.GameObjects.Rectangle
  }

  render() {
    for (const train of this.sim.trains) {
      const line = this.sim.getLineById(train.lineId);
      if (!line) continue;

      // Only show train if line has at least 1 station
      if (line.stationIds.length === 0) continue;

      if (!this.trainVisuals.has(train.id)) {
        this._createTrainVisual(train, line);
      }

      this._updateTrainVisual(train, line);
    }
  }

  _createTrainVisual(train, line) {
    // Rounded rectangle — pill shape
    const rect = this.scene.add.rectangle(train.x, train.y, 26, 12, line.color);
    rect.setOrigin(0.5);
    rect.setDepth(20);
    rect.setStrokeStyle(1.5, 0x333333);
    rect.setAlpha(0);

    // Fade in
    this.scene.tweens.add({
      targets: rect,
      alpha: 1,
      duration: 400
    });

    this.trainVisuals.set(train.id, rect);
  }

  _updateTrainVisual(train, line) {
    const rect = this.trainVisuals.get(train.id);
    if (!rect) return;

    rect.setPosition(train.x, train.y);
    rect.setRotation(train.angle);

    // Update color to match line
    rect.setFillStyle(line.color);

    // Subtle scale pulse when stopped at station
    const isStopped = ['arriving', 'unboarding', 'boarding', 'departing'].includes(train.state);
    const targetScale = isStopped ? 1.1 : 1.0;
    rect.setScale(rect.scaleX + (targetScale - rect.scaleX) * 0.1);
  }

  destroy() {
    for (const rect of this.trainVisuals.values()) {
      rect.destroy();
    }
    this.trainVisuals.clear();
  }
}
