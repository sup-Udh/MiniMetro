export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    // stations
    const stations = [
      { x: 200, y: 300 },
      { x: 400, y: 200 },
      { x: 600, y: 350 },
      { x: 500, y: 500 }
    ];

    // draw stations
    stations.forEach(s => {
      this.add.circle(s.x, s.y, 15, 0xffffff);
    });

    // train
    const train = this.add.circle(200, 300, 8, 0xff0000);
    train.currentStation = 0;

    // loop through stations
    this.moveToNext = () => {
      const next = (train.currentStation + 1) % stations.length;

      this.tweens.add({
        targets: train,
        x: stations[next].x,
        y: stations[next].y,
        duration: 1000,
        onComplete: () => {
          train.currentStation = next;
          this.moveToNext();
        }
      });
    };

    // start moving
    this.moveToNext();
  }
}