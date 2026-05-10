/**
 * GameClock — tracks in-game time, day/week progression,
 * and controls spawn timing for stations and passengers.
 * No Phaser dependencies.
 */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export { DAYS };

export default class GameClock {
  constructor() {
    this.totalTime = 0;             // ms elapsed
    this.dayDuration = 60000;       // 1 minute real-time = 1 in-game day
    this.stationSpawnDays = 2;      // new station every 2 in-game days
    this.passengerBaseInterval = 8000; // base ms between passenger spawns
    this.lastStationDay = 0;        // day number when last station was spawned
    this.passengerTimer = 0;        // accumulator for passenger spawning
  }

  get currentDay() {
    return DAYS[Math.floor(this.totalTime / this.dayDuration) % 7];
  }

  get dayNumber() {
    return Math.floor(this.totalTime / this.dayDuration);
  }

  get dayProgress() {
    return (this.totalTime % this.dayDuration) / this.dayDuration;
  }

  get weekNumber() {
    return Math.floor(this.totalTime / (this.dayDuration * 7)) + 1;
  }

  get passengerSpawnInterval() {
    // Gets faster over time — more pressure as weeks pass
    return Math.max(3000, this.passengerBaseInterval - this.weekNumber * 500);
  }

  update(delta) {
    this.totalTime += delta;
  }

  shouldSpawnStation() {
    const day = this.dayNumber;
    if (day >= this.lastStationDay + this.stationSpawnDays) {
      this.lastStationDay = day;
      return true;
    }
    return false;
  }

  shouldSpawnPassenger(delta) {
    this.passengerTimer += delta;
    if (this.passengerTimer >= this.passengerSpawnInterval) {
      this.passengerTimer -= this.passengerSpawnInterval;
      return true;
    }
    return false;
  }
}
