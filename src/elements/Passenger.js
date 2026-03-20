import Phaser from "phaser";
import { generateShape } from "../StationGeneration";

// Represents a single passenger waiting at a station.
// Passengers have an origin station and a destination station.
// They can board a train, be delivered, and be removed from the scene.
export default class Passenger {
  constructor(scene, originStation, destinationStation) {
    this.scene = scene;
    this.origin = originStation;
    this.destination = destinationStation;
    this.shape = originStation.shape;

    // A small visual marker at (or near) the origin station.
    const offsetX = Phaser.Math.Between(-10, 10);
    const offsetY = Phaser.Math.Between(-10, 10);

    this.sprite = generateShape(
      scene,
      originStation.x + offsetX,
      originStation.y + offsetY,
      6,
      this.shape,
      0xffffff
    ).setDepth(5);

    this.isOnTrain = false;
    this.isDelivered = false;
  }

  // Called when a train picks up this passenger.
  boardTrain() {
    this.isOnTrain = true;
    this.sprite.setVisible(false);
  }

  // Plays a small “boarding” animation from current position into the train.
  animateBoarding(train, onComplete) {
    if (!this.sprite) {
      if (onComplete) onComplete();
      return;
    }

    this.isOnTrain = true;

    const targetX = train.x;
    const targetY = train.y;

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: targetY,
      scale: 0.2,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.sprite.setVisible(false);
        if (onComplete) onComplete();
      }
    });
  }

  animateDelivery(station, onComplete) {
    if (!this.sprite) {
      this.deliver();
      if (onComplete) onComplete();
      return;
    }

    this.scene.tweens.add({
      targets: this.sprite,
      x: station.x,
      y: station.y,
      scale: 0.2,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        this.deliver();
        if (onComplete) onComplete();
      }
    });
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