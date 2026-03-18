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
    // graphics for hover/drag preview
    this.hoverGraphics = this.add.graphics({ lineStyle: { width: 4, color: 0x90ee90 } });

    // station circles (click or drag to connect)
    this.isDragging = false;
    this.dragStartIndex = null;
    this.hoverIndex = null;

    this.stations.forEach((s, i) => {
      s.baseColor = 0xffffff; // default color
      s.highlightColor = 0x90ee90; // light green when being hovered during drag

      s.circle = this.add
        .circle(s.x, s.y, 15, s.baseColor)
        .setInteractive({ useHandCursor: true });

      s.circle.on("pointerdown", () => this.startDrag(i));
      s.circle.on("pointerover", () => this.onStationHover(i));
      s.circle.on("pointerout", () => this.onStationOut(i));
    });

    // stop drag when mouse/finger is released
    this.input.on("pointerup", () => this.stopDrag());

    // train starts at first station
    this.train = this.add.circle(this.stations[0].x, this.stations[0].y, 8, 0xff0000);
    this.train.currentStation = 0;

    this.route = [];
    this.connections = {}; // adjacency list for connected stations (ordered neighbors)
    this.previousStation = null; // last station the train came from
    this.isMoving = false;
  }

  // Called whenever the player clicks a station circle.
  // `index` is the station position in `this.stations`.
  onStationClick(index) {
    // Ignore if the player clicks the same station twice in a row.
    if (this.route.length && this.route[this.route.length - 1] === index) {
      return;
    }

    // Add the clicked station to the end of the route and redraw the visual line.
    if (this.route.length) {
      const last = this.route[this.route.length - 1];
      this.connectStations(last, index);
    }

    this.route.push(index);
    this.drawRoute();

    // Start train movement once we have at least one connection.
    if (!this.isMoving && this.route.length >= 2) {
      this.startMoving();
    }
  }

  // Add a bidirectional connection (edge) between two stations.
  // Neighbors are stored in insertion order so traversal can cycle through them.
  connectStations(a, b) {
    if (!this.connections[a]) {
      this.connections[a] = [];
    }
    if (!this.connections[b]) {
      this.connections[b] = [];
    }

    if (!this.connections[a].includes(b)) {
      this.connections[a].push(b);
    }
    if (!this.connections[b].includes(a)) {
      this.connections[b].push(a);
    }
  }

  // Called on pointer down: begin a drag operation starting from `index`.
  startDrag(index) {
    this.isDragging = true;
    this.dragStartIndex = index;
    this.hoverIndex = null;

    // Also treat it as a click so the station gets added to the route immediately.
    this.onStationClick(index);
  }

  // Highlight station while dragging over it and draw preview line.
  onStationHover(index) {
    if (!this.isDragging) {
      return;
    }

    // Avoid highlighting the station we started from.
    if (index === this.dragStartIndex) {
      return;
    }

    if (this.hoverIndex !== null && this.hoverIndex !== index) {
      this.stations[this.hoverIndex].circle.setFillStyle(this.stations[this.hoverIndex].baseColor);
    }

    this.hoverIndex = index;
    this.stations[index].circle.setFillStyle(this.stations[index].highlightColor);

    // Draw the preview line to show where the route will connect.
    this.drawHoverLine(index);
  }

  // Remove highlight and preview line when the pointer leaves a station.
  onStationOut(index) {
    if (!this.isDragging) {
      return;
    }

    if (this.hoverIndex === index) {
      this.stations[index].circle.setFillStyle(this.stations[index].baseColor);
      this.hoverIndex = null;
      this.hoverGraphics.clear();
    }
  }

  // Finish a drag. If the pointer was released over another station,
  // connect the two stations (build the graph) and start movement.
  stopDrag() {
    if (!this.isDragging) {
      return;
    }

    if (this.hoverIndex !== null && this.hoverIndex !== this.dragStartIndex) {
      // Ensure the route includes the start station.
      if (!this.route.length) {
        this.route.push(this.dragStartIndex);
      } else if (this.route[this.route.length - 1] !== this.dragStartIndex) {
        this.route.push(this.dragStartIndex);
      }

      // Connect the stations in the adjacency map and update the visual route.
      this.connectStations(this.dragStartIndex, this.hoverIndex);
      this.onStationClick(this.hoverIndex);
    }

    // Reset hover line and highlight states.
    this.hoverGraphics.clear();

    if (this.hoverIndex !== null) {
      this.stations[this.hoverIndex].circle.setFillStyle(this.stations[this.hoverIndex].baseColor);
      this.hoverIndex = null;
    }

    if (this.dragStartIndex !== null) {
      this.stations[this.dragStartIndex].circle.setFillStyle(this.stations[this.dragStartIndex].baseColor);
      this.dragStartIndex = null;
    }

    this.isDragging = false;
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

  // Start moving the train along connected stations.
  startMoving() {
    this.isMoving = true; // prevent starting again while already moving
    this.previousStation = null; // reset direction
    this.moveAlongRoute();
  }

  // Draw a preview line while dragging from the start station to `hoverIndex`.
  drawHoverLine(hoverIndex) {
    this.hoverGraphics.clear();

    if (!this.isDragging || this.dragStartIndex === null) {
      return;
    }

    const start = this.stations[this.dragStartIndex];
    const hover = this.stations[hoverIndex];

    this.hoverGraphics.lineBetween(start.x, start.y, hover.x, hover.y);
  }

  // Move the train along connected stations (graph traversal).
  moveAlongRoute() {
    const current = this.train.currentStation;
    const neighbors = this.connections[current];

    if (!neighbors || neighbors.length === 0) {
      this.isMoving = false;
      return;
    }

    // Find index of the station we came from in the neighbor list.
    const lastIndex = this.previousStation !== null ? neighbors.indexOf(this.previousStation) : -1;

    // Choose next neighbor in order (wraps around).
    let nextIndex = (lastIndex + 1) % neighbors.length;
    let next = neighbors[nextIndex];

    // If we haven't moved yet and lastIndex is -1, just take the first neighbor.
    if (lastIndex === -1) {
      next = neighbors[0];
      nextIndex = 0;
    }

    const nextStation = this.stations[next];

    this.tweens.add({
      targets: this.train,
      x: nextStation.x,
      y: nextStation.y,
      duration: 1500,
      onComplete: () => {
        this.previousStation = current;
        this.train.currentStation = next;
        this.moveAlongRoute();
      }
    });
  }
}

