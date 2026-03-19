import Phaser from "phaser";

// Represents a single passenger waiting at a station.
// Passengers have an origin station and a destination station.
// They can board a train, be delivered, and be removed from the scene.
export default class Passenger {
  constructor(scene, originStation, destinationStation) {
    this.scene = scene;
    this.origin = originStation;
    this.destination = destinationStation;

    // A small visual marker at (or near) the origin station.
    const offsetX = Phaser.Math.Between(-10, 10);
    const offsetY = Phaser.Math.Between(-10, 10);

    this.sprite = scene.add
      .circle(originStation.x + offsetX, originStation.y + offsetY, 6, 0xffffff)
      .setStrokeStyle(1, 0x000000)
      .setDepth(5);

    this.isOnTrain = false;
    this.isDelivered = false;
  }

  // Called when a train picks up this passenger.
  boardTrain() {
    this.isOnTrain = true;
    this.sprite.setVisible(false);
  }

  // Called when the passenger reaches their destination.
  deliver() {
    this.isDelivered = true;
    if (this.sprite && this.sprite.destroy) {
      this.sprite.destroy();
    }
  }

  // If you want the passenger to move with the train, call this each frame.
  setPosition(x, y) {
    if (this.sprite && this.isOnTrain) {
      this.sprite.setPosition(x, y);
    }
  }
}
