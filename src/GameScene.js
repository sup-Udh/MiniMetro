import { generateStations } from "./StationGeneration";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.stations = generateStations();

    // Graphics for permanent lines
    this.pathGraphics = this.add.graphics({ lineStyle: { width: 4, color: 0x00ff00 } });

    // Graphics for hover preview
    this.hoverGraphics = this.add.graphics({ lineStyle: { width: 4, color: 0x90ee90 } });

    // Line system (IMPORTANT CHANGE)
    this.lines = [
      {
        stations: [], // ordered station indices
        color: 0x00ff00
      }
    ];

    this.currentLine = this.lines[0];

    // Drag system
    this.isDragging = false;
    this.dragStartIndex = null;
    this.hoverIndex = null;

    // Create station visuals
    this.stations.forEach((s, i) => {
      s.baseColor = 0xffffff;
      s.highlightColor = 0x90ee90;
      s.visible = false;

      s.circle = this.add
        .circle(s.x, s.y, 15, s.baseColor)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0)
        .setScale(0.5);

      s.circle.on("pointerdown", () => this.startDrag(i));
      s.circle.on("pointerover", () => this.onStationHover(i));
      s.circle.on("pointerout", () => this.onStationOut(i));
    });

    this.input.on("pointerup", () => this.stopDrag());

    // Train setup
    this.train = this.add.circle(this.stations[0].x, this.stations[0].y, 8, 0xff0000).setAlpha(0);

    this.train.line = this.currentLine;
    this.train.index = 0;
    this.train.direction = 1;

    this.isMoving = false;

    // Station spawn system
    this.nextStationIndex = 0;

    this.showStation(this.nextStationIndex);
    this.nextStationIndex++;

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.nextStationIndex < this.stations.length) {
          this.showStation(this.nextStationIndex);
          this.nextStationIndex++;
        }
      },
      loop: true
    });
  }

  // Show station with animation
  showStation(index) {
    const station = this.stations[index];
    if (!station || station.visible) return;

    station.visible = true;

    this.tweens.add({
      targets: station.circle,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut"
    });

    if (index === 0) {
      this.tweens.add({
        targets: this.train,
        alpha: 1,
        duration: 500
      });
    }
  }

  // =========================
  // 🚇 LINE SYSTEM
  // =========================

  addToLine(index) {
    const line = this.currentLine;

    // Prevent duplicate consecutive stations
    if (line.stations.length && line.stations[line.stations.length - 1] === index) {
      return;
    }

    line.stations.push(index);

    this.drawLines();

    // Start train once we have at least 2 stations
    if (!this.isMoving && line.stations.length >= 2) {
      this.startMoving();
    }
  }

  drawLines() {
    this.pathGraphics.clear();

    this.lines.forEach(line => {
      if (line.stations.length < 2) return;

      for (let i = 1; i < line.stations.length; i++) {
        const from = this.stations[line.stations[i - 1]];
        const to = this.stations[line.stations[i]];

        this.pathGraphics.lineBetween(from.x, from.y, to.x, to.y);
      }
    });
  }

  // =========================
  // 🖱 DRAG SYSTEM
  // =========================

  startDrag(index) {
    if (!this.stations[index].visible) return;

    this.isDragging = true;
    this.dragStartIndex = index;

    this.addToLine(index);
  }

  onStationHover(index) {
    if (!this.isDragging) return;
    if (!this.stations[index].visible) return;
    if (index === this.dragStartIndex) return;

    this.hoverIndex = index;

    this.stations[index].circle.setFillStyle(this.stations[index].highlightColor);

    this.drawHoverLine(index);
  }

  onStationOut(index) {
    if (!this.isDragging) return;

    this.stations[index].circle.setFillStyle(this.stations[index].baseColor);

    this.hoverGraphics.clear();
    this.hoverIndex = null;
  }

  stopDrag() {
    if (!this.isDragging) return;

    if (this.hoverIndex !== null) {
      this.addToLine(this.hoverIndex);
    }

    this.hoverGraphics.clear();

    if (this.hoverIndex !== null) {
      this.stations[this.hoverIndex].circle.setFillStyle(this.stations[this.hoverIndex].baseColor);
    }

    this.isDragging = false;
    this.dragStartIndex = null;
    this.hoverIndex = null;
  }

  drawHoverLine(hoverIndex) {
    this.hoverGraphics.clear();

    const start = this.stations[this.dragStartIndex];
    const hover = this.stations[hoverIndex];

    this.hoverGraphics.lineBetween(start.x, start.y, hover.x, hover.y);
  }

  // =========================
  // 🚆 TRAIN MOVEMENT
  // =========================

  startMoving() {
    this.isMoving = true;
    this.moveTrain();
  }

  moveTrain() {
    const line = this.train.line;

    if (!line || line.stations.length < 2) {
      this.isMoving = false;
      return;
    }

    let nextIndex = this.train.index + this.train.direction;

    // Reverse at ends (IMPORTANT)
    if (nextIndex >= line.stations.length || nextIndex < 0) {
      this.train.direction *= -1;
      nextIndex = this.train.index + this.train.direction;
    }

    const nextStationIndex = line.stations[nextIndex];
    const nextStation = this.stations[nextStationIndex];

    this.tweens.add({
      targets: this.train,
      x: nextStation.x,
      y: nextStation.y,
      duration: 1000,
      onComplete: () => {
        this.train.index = nextIndex;
        this.moveTrain();
      }
    });
  }
}