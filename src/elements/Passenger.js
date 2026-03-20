import Phaser from "phaser";
import { generateShape } from "../StationGeneration";

export default class Passenger {
  constructor(scene, originStation, destinationStation) {
    this.scene = scene;
    this.origin = originStation;
    this.destination = destinationStation;
    this.shape = originStation.shape;

    const passengerColors = {
      square: 0xff0000,
      triangle: 0x00ff00,
      diamond: 0x0000ff,
      hexagon: 0xff00ff,
      pentagon: 0x00ffff,
      octagon: 0xffff00,
      star: 0xffa500,
      cross: 0x800080,
      circle: 0xffffff
    };

    const color = passengerColors[this.shape] ?? 0xffffff;

    const offsetX = Phaser.Math.Between(-10, 10);
    const offsetY = Phaser.Math.Between(-10, 10);

    this.sprite = generateShape(
      scene,
      originStation.x + offsetX,
      originStation.y + offsetY,
      6,
      this.shape,
      color
    ).setDepth(5);

    this.isOnTrain = false;
    this.isDelivered = false;
    this.isAnimating = false;
  }

  boardTrain() {
    this.isOnTrain = true;
  }

  // 🔥 FIXED: boarding respects rotation
  animateBoarding(train, onComplete) {
    if (!this.sprite) {
      this.isOnTrain = true;
      if (onComplete) onComplete();
      return;
    }

    const angle = train.rotation;

    const targetX = train.x;
    const targetY = train.y;

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: targetY,
      scale: 0.5,
      alpha: 1,
      duration: 400,
      ease: "Power2",
      onComplete: () => {
        this.boardTrain();
        if (onComplete) onComplete();
      }
    });
  }

  animateDelivery(station, onComplete) {
    if (!this.sprite || this.isAnimating) {
      this.deliver();
      if (onComplete) onComplete();
      return;
    }

    this.isAnimating = true;

    this.scene.tweens.add({
      targets: this.sprite,
      x: station.x,
      y: station.y,
      scale: 0.2,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        this.isAnimating = false;
        this.deliver();
        if (onComplete) onComplete();
      }
    });
  }

  deliver() {
    this.isDelivered = true;
    if (this.sprite && this.sprite.destroy) {
      this.sprite.destroy();
    }
  }

  // 🔥 CORE FIX: rotated offsets
  updateOnTrain(train, index) {
    if (!this.isOnTrain || !this.sprite) return;

    this.sprite.setVisible(true);
    this.sprite.setAlpha(1);
    this.sprite.setScale(0.5);
    this.sprite.setDepth(10);

    // Arrange passengers in grid inside train
    const offsetX = (index % 2 === 0 ? -6 : 6);
    const offsetY = Math.floor(index / 2) * 6 - 4;

    const angle = train.rotation;

    // Rotate offsets with train
    const rotatedX = offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
    const rotatedY = offsetX * Math.sin(angle) + offsetY * Math.cos(angle);

    this.sprite.setPosition(train.x + rotatedX, train.y + rotatedY);

    // Optional: rotate passenger too
    this.sprite.setRotation(angle);
  }
}