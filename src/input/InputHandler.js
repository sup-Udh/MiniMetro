/**
 * InputHandler — handles drag-to-connect line drawing and line selection.
 * Reads from StationRenderer for interactive graphics, writes to SimulationManager.
 */

export default class InputHandler {
  constructor(scene, sim, stationRenderer, trackRenderer, uiRenderer) {
    this.scene = scene;
    this.sim = sim;
    this.stationRenderer = stationRenderer;
    this.trackRenderer = trackRenderer;
    this.uiRenderer = uiRenderer;

    // Drag state
    this.isDragging = false;
    this.dragLineId = null;
    this.lastStationId = null;

    this._setupInput();
  }

  _setupInput() {
    // Pointer move (for preview line while dragging)
    this.scene.input.on('pointermove', (pointer) => {
      if (!this.isDragging || this.sim.isGameOver) return;

      const lastStation = this.sim.getStationById(this.lastStationId);
      if (!lastStation) return;

      const line = this.sim.getLineById(this.dragLineId);
      if (!line) return;

      this.trackRenderer.drawPreview(
        lastStation.x, lastStation.y,
        pointer.worldX, pointer.worldY,
        line.color
      );
    });

    // Pointer up — stop drag
    this.scene.input.on('pointerup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.dragLineId = null;
        this.lastStationId = null;
        this.trackRenderer.clearPreview();

        // Clear all highlights
        for (const station of this.sim.stations) {
          const graphic = this.stationRenderer.getGraphic(station.id);
          if (graphic) graphic.clearTint();
        }
      }
    });
  }

  /**
   * Called by GameScene after StationRenderer creates new station graphics.
   * Sets up pointerdown/pointerover/pointerout on the station graphic.
   */
  bindStation(stationId) {
    const graphic = this.stationRenderer.getGraphic(stationId);
    if (!graphic) return;

    graphic.on('pointerdown', () => this._onStationDown(stationId));
    graphic.on('pointerover', () => this._onStationOver(stationId));
    graphic.on('pointerout', () => this._onStationOut(stationId));
  }

  _onStationDown(stationId) {
    if (this.sim.isGameOver) return;

    const lineId = this.uiRenderer.activeLineId;
    if (lineId === null) return;

    const line = this.sim.getLineById(lineId);
    if (!line) return;

    // Start dragging
    this.isDragging = true;
    this.dragLineId = lineId;

    // Add station to line
    const added = this.sim.addStationToLine(lineId, stationId);
    this.lastStationId = stationId;

    // If the station was already the last on the line, just start extending from it
    if (!added && line.getLastStationId() === stationId) {
      this.lastStationId = stationId;
    }
  }

  _onStationOver(stationId) {
    if (!this.isDragging || this.sim.isGameOver) return;
    if (stationId === this.lastStationId) return;

    const graphic = this.stationRenderer.getGraphic(stationId);
    if (graphic) graphic.setTint(0xffc266);

    // Add this station to the line (extending the line through multiple stations in one drag)
    const added = this.sim.addStationToLine(this.dragLineId, stationId);

    if (added) {
      this.lastStationId = stationId;
      this.trackRenderer.clearPreview();
    }
  }

  _onStationOut(stationId) {
    if (this.sim.isGameOver) return;

    const graphic = this.stationRenderer.getGraphic(stationId);
    if (graphic) graphic.clearTint();
  }
}
