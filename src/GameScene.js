export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    // stations
    this.add.circle(200, 300, 15, 0xffffff);
    this.add.circle(400, 200, 15, 0xffffff);
    this.add.circle(600, 350, 15, 0xffffff);

    // train (moving dot)
    const train = this.add.circle(200, 300, 8, 0xff0000);

    this.tweens.add({
      targets: train,
      x: 600,
      y: 350,
      duration: 3000,
      yoyo: true,
      repeat: -1,
    });
  }
}