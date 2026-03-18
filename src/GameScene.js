export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    // station positions
    this.stations = [
      { x: 200, y: 300 },
      { x: 400, y: 200 },
      { x: 600, y: 350 },
      { x: 500, y: 500 }
    ];

    // graphics for connections
    this.pathGraphics = this.add.graphics({ lineStyle: { width: 4, color: 0x00ff00 } });

    // station circles (click to connect)
    this.stations.forEach((s, i) => {
      s.circle = this.add.circle(s.x, s.y, 15, 0xffffff).setInteractive({ useHandCursor: true });
      s.circle.on("pointerdown", () => this.onStationClick(i));
    });

    // train starts at first station
    this.train = this.add.circle(this.stations[0].x, this.stations[0].y, 8, 0xff0000);
    this.train.currentStation = 0;

    this.route = [];
    this.direction = 1;
    this.isMoving = false;
  }

  // Called whenever the player clicks a station circle.
  // `index` is the station position in `this.stations`.
  onStationClick(index) {
    // Ignore if the player clicks the same station twice in a row.
    if (this.route.length && this.route[this.route.length - 1] === index) {
      return;
    }

    // Add the clicked station to the end of the route and redraw the line.
    this.route.push(index);
    this.drawRoute();

    // Start train movement once we have at least two connected stations.
    if (!this.isMoving && this.route.length >= 2) {
      this.startMoving();
    }
  }

  // Draws the current route as a green line between the stations in `this.route`.
  drawRoute() {
    this.pathGraphics.clear(); // remove previous lines before drawing the new route

    if (this.route.length < 2) {
      return; // nothing to draw until we have at least two stations
    }

    // Draw each segment: route[0] -> route[1], route[1] -> route[2], ...
    for (let i = 1; i < this.route.length; i += 1) {
      const from = this.stations[this.route[i - 1]];
      const to = this.stations[this.route[i]];
      this.pathGraphics.lineBetween(from.x, from.y, to.x, to.y);
    }
  }

  // Start moving the train along the route.
  startMoving() {
    this.isMoving = true; // prevent starting again while already moving
    this.direction = 1; // 1 = forward, -1 = backward
    this.moveAlongRoute();
  }

  // Move the train one segment along the route, then call itself again.
  moveAlongRoute() {
    if (this.route.length < 2) {
      this.isMoving = false;
      return;
    }

    // Find where the train is currently in the route list.
    const currentIndex = this.route.indexOf(this.train.currentStation);
    const position = currentIndex >= 0 ? currentIndex : 0;
    let nextPosition = position + this.direction;

    // If we reached the end (or start), reverse direction.
    if (nextPosition < 0 || nextPosition >= this.route.length) {
      this.direction *= -1;
      nextPosition = position + this.direction;
    }

    // Determine the next station to move to.
    const nextStation = this.stations[this.route[nextPosition]];

    // Tween the train to the next station.
    this.tweens.add({
      targets: this.train,
      x: nextStation.x,
      y: nextStation.y,
      duration: 1000,
      onComplete: () => {
        // Update current station and continue moving.
        this.train.currentStation = this.route[nextPosition];
        this.moveAlongRoute();
      }
    });
  }
}
