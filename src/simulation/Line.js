/**
 * Line data model — represents a metro line (color + ordered stations + trains).
 * No Phaser dependencies.
 */

export default class Line {
  constructor(id, color, colorHex) {
    this.id = id;
    this.color = color;         // Phaser numeric color e.g. 0xf0cb16
    this.colorHex = colorHex;   // CSS hex string e.g. '#f0cb16'
    this.stationIds = [];       // ordered station IDs on this line
    this.trainIds = [];         // trains assigned to this line
  }

  hasStation(stationId) {
    return this.stationIds.includes(stationId);
  }

  getTrackSegments() {
    const segments = [];
    for (let i = 0; i < this.stationIds.length - 1; i++) {
      segments.push([this.stationIds[i], this.stationIds[i + 1]]);
    }
    return segments;
  }

  getFirstStationId() {
    return this.stationIds.length > 0 ? this.stationIds[0] : null;
  }

  getLastStationId() {
    return this.stationIds.length > 0 ? this.stationIds[this.stationIds.length - 1] : null;
  }

  /**
   * Add a station to the line. Returns true if added successfully.
   */
  addStation(stationId) {
    // Don't add duplicate consecutive stations
    if (this.stationIds.length > 0 && this.getLastStationId() === stationId) {
      return false;
    }
    // Don't add if already on this line (no loops for now)
    if (this.hasStation(stationId)) {
      return false;
    }
    this.stationIds.push(stationId);
    return true;
  }

  /**
   * Check if two stations are connected (adjacent) on this line.
   */
  areAdjacent(stationIdA, stationIdB) {
    for (let i = 0; i < this.stationIds.length - 1; i++) {
      if (
        (this.stationIds[i] === stationIdA && this.stationIds[i + 1] === stationIdB) ||
        (this.stationIds[i] === stationIdB && this.stationIds[i + 1] === stationIdA)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the index of a station on this line.
   */
  indexOf(stationId) {
    return this.stationIds.indexOf(stationId);
  }
}
