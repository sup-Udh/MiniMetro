/**
 * TrackRenderer — draws metro line connections with smooth curves
 * and animated connection growth. Reads simulation state only.
 */

export default class TrackRenderer {
  constructor(scene, sim) {
    this.scene = scene;
    this.sim = sim;
    this.graphics = this.scene.add.graphics();
    this.graphics.setDepth(2);

    // Preview line (while dragging)
    this.previewGraphics = this.scene.add.graphics();
    this.previewGraphics.setDepth(3);

    // Track segment animation progress: "fromId-toId" → { t: 0..1 }
    this.segmentAnims = new Map();
  }

  render() {
    this.graphics.clear();

    // Draw each line's track segments
    for (const line of this.sim.lines) {
      if (line.stationIds.length < 2) continue;

      const segments = line.getTrackSegments();

      for (const [fromId, toId] of segments) {
        const from = this.sim.getStationById(fromId);
        const to = this.sim.getStationById(toId);
        if (!from || !to) continue;

        // Get/create animation state
        const key = `${fromId}-${toId}`;
        if (!this.segmentAnims.has(key)) {
          this.segmentAnims.set(key, { t: 0 });
        }

        const anim = this.segmentAnims.get(key);

        // Animate growth
        if (anim.t < 1) {
          anim.t = Math.min(1, anim.t + 0.04); // ~25 frames to full
        }

        // Draw the segment
        this._drawSegment(from, to, line.color, anim.t);
      }
    }
  }

  _drawSegment(from, to, color, progress) {
    const lineWidth = 8;
    this.graphics.lineStyle(lineWidth, color, 0.85);

    // Lerp endpoint for growth animation
    const endX = from.x + (to.x - from.x) * progress;
    const endY = from.y + (to.y - from.y) * progress;

    this.graphics.beginPath();
    this.graphics.moveTo(from.x, from.y);
    this.graphics.lineTo(endX, endY);
    this.graphics.strokePath();

    // Draw rounded caps
    this.graphics.fillStyle(color, 0.85);
    this.graphics.fillCircle(from.x, from.y, lineWidth / 2);
    if (progress >= 1) {
      this.graphics.fillCircle(to.x, to.y, lineWidth / 2);
    }
  }

  /**
   * Draw a preview line from a station to the cursor position.
   * Called by InputHandler during drag.
   */
  drawPreview(fromX, fromY, toX, toY, color) {
    this.previewGraphics.clear();
    this.previewGraphics.lineStyle(6, color, 0.4);
    this.previewGraphics.beginPath();
    this.previewGraphics.moveTo(fromX, fromY);
    this.previewGraphics.lineTo(toX, toY);
    this.previewGraphics.strokePath();
  }

  clearPreview() {
    this.previewGraphics.clear();
  }

  destroy() {
    this.graphics.destroy();
    this.previewGraphics.destroy();
  }
}
