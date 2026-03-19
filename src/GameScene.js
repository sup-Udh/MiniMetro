import { generateStations } from "./StationGeneration";
import Passenger from "./elements/Passenger";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.stations = generateStations();

    // Colors
    this.lineColors = [0xf0cb16, 0xeb2827, 0x019ad1];

    this.pathGraphics = this.add.graphics({ lineStyle: { width: 4, color: this.lineColors[0] } });
    this.hoverGraphics = this.add.graphics({ lineStyle: { width: 4, color: 0xffc266 } });

    // Line system
    this.lines = [
      {
        stations: [],
        color: this.lineColors[0]
      }
    ];

    this.currentLine = this.lines[0];

    // Drag system
    this.isDragging = false;
    this.dragStartIndex = null;
    this.hoverIndex = null;

    // Stations

  

    this.stations.forEach((s, i) => {
      s.baseColor = 0x000000;
      s.highlightColor = 0xffc266;
      s.visible = false;

      // Create visual based on the randomized shape from generateStations
      let graphic;
      const size = 15;

      if (s.shape === 'square') {
        graphic = this.add.rectangle(s.x, s.y, size * 2, size * 2, s.baseColor);
      } else if (s.shape === 'triangle') {
        graphic = this.add.triangle(s.x, s.y, s.x, s.y - size, s.x - size, s.y + size, s.x + size, s.y + size, s.baseColor);
      } else if (s.shape === 'diamond') {
        graphic = this.add.polygon(s.x, s.y, [0, -size, size, 0, 0, size, -size, 0], s.baseColor);
      } else if (s.shape === 'hexagon') {
        const points = [];
        for (let j = 0; j < 6; j++) {
          const angle = (j * Math.PI * 2) / 6;
          points.push(size * Math.cos(angle), size * Math.sin(angle));
        }
        graphic = this.add.polygon(s.x, s.y, points, s.baseColor);
      } else if (s.shape === 'pentagon') {
        const points = [];
        for (let j = 0; j < 5; j++) {
          const angle = (j * Math.PI * 2) / 5 - Math.PI / 2;
          points.push(size * Math.cos(angle), size * Math.sin(angle));
        }
        graphic = this.add.polygon(s.x, s.y, points, s.baseColor);
      } else if (s.shape === 'octagon') {
        const points = [];
        for (let j = 0; j < 8; j++) {
          const angle = (j * Math.PI * 2) / 8;
          points.push(size * Math.cos(angle), size * Math.sin(angle));
        }
        graphic = this.add.polygon(s.x, s.y, points, s.baseColor);
      } else if (s.shape === 'star') {
        const points = [];
        for (let j = 0; j < 10; j++) {
          const angle = (j * Math.PI) / 5;
          const radius = j % 2 === 0 ? size : size * 0.5;
          points.push(radius * Math.cos(angle), radius * Math.sin(angle));
        }
        graphic = this.add.polygon(s.x, s.y, points, s.baseColor);
      } else if (s.shape === 'cross') {
        graphic = this.add.graphics();
        graphic.lineStyle(2, s.baseColor);
        graphic.lineBetween(s.x - size, s.y, s.x + size, s.y);
        graphic.lineBetween(s.x, s.y - size, s.x, s.y + size);
      } else {
        graphic = this.add.circle(s.x, s.y, size, s.baseColor);
      }

      s.circle = graphic
        .setInteractive({ useHandCursor: true })
        .setAlpha(0)
        .setScale(0.5)
        .setStrokeStyle(2, 0xffffff)
        .setFillStyle(0x000000);

      s.circle.on("pointerdown", () => this.startDrag(i));
      s.circle.on("pointerover", () => this.onStationHover(i));
      s.circle.on("pointerout", () => this.onStationOut(i));
    });

    this.input.on("pointerup", () => this.stopDrag());

    // Train
    this.train = this.add
      .rectangle(this.stations[0].x, this.stations[0].y, 10, 20, 0xff4d4d)
      .setOrigin(0.5)
      .setAlpha(0);

    // Train capacity (how many passengers it can carry at once)
    this.train.capacity = 4;
    this.train.onboard = [];

    // Pause duration at a station (ms)
    this.stationStopDuration = 800;

    this.train.line = this.currentLine;
    this.train.index = 0;
    this.train.direction = 1;

    this.isMoving = false;

    // Station spawning
    this.nextStationIndex = 0;

    this.showStation(this.nextStationIndex);
    this.nextStationIndex++;

    this.time.addEvent({
      delay: 1900,
      callback: () => {
        if (this.nextStationIndex < this.stations.length) {
          this.showStation(this.nextStationIndex);
          this.nextStationIndex++;
        }
      },
      loop: true
    });

    // ================= PASSENGERS SPAWN RATIO ================= ////////////////////////////////////


    
    this.passengers = [];
    this.time.addEvent({
      delay: 10000,  // how often a passenger is generated.
      callback: () => this.spawnPassenger(),
      loop: true
    });
  }

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

  // ================= PASSENGERS =================

  spawnPassenger() {
    const visibleStations = this.stations.filter(s => s.visible);
    if (visibleStations.length < 2) return;

    const origin = Phaser.Utils.Array.GetRandom(visibleStations);
    let destination = Phaser.Utils.Array.GetRandom(visibleStations);

    while (destination === origin && visibleStations.length > 1) {
      destination = Phaser.Utils.Array.GetRandom(visibleStations);
    }

    const passenger = new Passenger(this, origin, destination);
    this.passengers.push(passenger);
  }

  // ================= LINE SYSTEM =================

  addToLine(index) {
    const line = this.currentLine;

    if (line.stations.length && line.stations[line.stations.length - 1] === index) {
      return;
    }

    line.stations.push(index);
    this.drawLines();

    if (!this.isMoving && line.stations.length >= 2) {
      this.startMoving();
    }
  }

  drawLines() {
    this.pathGraphics.clear();

    this.lines.forEach(line => {
      if (line.stations.length < 2) return;

      this.pathGraphics.lineStyle(4, line.color);

      for (let i = 1; i < line.stations.length; i++) {
        const from = this.stations[line.stations[i - 1]];
        const to = this.stations[line.stations[i]];

        this.pathGraphics.lineBetween(from.x, from.y, to.x, to.y);
      }
    });
  }

  // ================= DRAG SYSTEM =================

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

  // ================= TRAIN MOVEMENT =================

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

    if (nextIndex >= line.stations.length || nextIndex < 0) {
      this.train.direction *= -1;
      nextIndex = this.train.index + this.train.direction;
    }

    const nextStationIndex = line.stations[nextIndex];
    const nextStation = this.stations[nextStationIndex];

    // 🔥 ROTATE TRAIN BASED ON DIRECTION
    const angle = Phaser.Math.Angle.Between(
      this.train.x,
      this.train.y,
      nextStation.x,
      nextStation.y
    );

    this.train.setRotation(angle + Math.PI / 2); // rotate train accordignly to the lines.

    this.tweens.add({
      targets: this.train,
      x: nextStation.x,
      y: nextStation.y,
      duration: 1000,
      onComplete: () => {
        this.train.index = nextIndex;
        this.onTrainArrivedAtStation(nextStationIndex);
      }
    });
  }

  onTrainArrivedAtStation(stationIndex) {
    const station = this.stations[stationIndex];

    // Determine how many more passengers the train can take
    const availableSlots = Math.max(0, this.train.capacity - this.train.onboard.length);
    if (availableSlots <= 0) {
      return this.time.delayedCall(this.stationStopDuration, () => this.moveTrain());
    }

    const waitingPassengers = this.passengers
      .filter(p => !p.isOnTrain && p.origin === station && !p.isDelivered)
      .slice(0, availableSlots);

    const continueMoving = () => {
      this.time.delayedCall(this.stationStopDuration, () => this.moveTrain());
    };

    if (waitingPassengers.length > 0) {
      let remaining = waitingPassengers.length;
      const onBoarded = passenger => {
        // Track onboard passengers for capacity enforcement
        this.train.onboard.push(passenger);

        remaining -= 1;
        if (remaining <= 0) {
          continueMoving();
        }
      };

      waitingPassengers.forEach(p => p.animateBoarding(this.train, () => onBoarded(p)));
    } else {
      continueMoving();
    }
  }
}