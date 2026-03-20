import { generateStations, generateShape, SHAPES } from "./StationGeneration";
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

      s.graphic = generateShape(this, s.x, s.y, 15, s.shape, s.baseColor)
        .setInteractive(new Phaser.Geom.Circle(s.x, s.y, 15), Phaser.Geom.Circle.Contains)
        .setAlpha(0)
        .setScale(0.5);

      s.graphic.on("pointerdown", () => this.startDrag(i));
      s.graphic.on("pointerover", () => this.onStationHover(i));
      s.graphic.on("pointerout", () => this.onStationOut(i));
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
      targets: station.graphic,
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

    this.stations[index].graphic.setTint(this.stations[index].highlightColor);
    this.drawHoverLine(index);
  }

  onStationOut(index) {
    if (!this.isDragging) return;

    this.stations[index].graphic.clearTint();
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
      this.stations[this.hoverIndex].graphic.clearTint();
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

    // First, deliver passengers whose shape matches this station.
    const passengersToDeliver = this.train.onboard.filter(p => p.shape === station.shape);

    const continueAfterDelivery = () => {
      // Then board new passengers from this station.
      this.boardPassengersAtStation(station, () => {
        this.time.delayedCall(this.stationStopDuration, () => this.moveTrain());
      });
    };

    if (passengersToDeliver.length > 0) {
      let remaining = passengersToDeliver.length;

      const onDelivered = () => {
        remaining -= 1;
        if (remaining <= 0) {
          this.train.onboard = this.train.onboard.filter(p => !p.isDelivered);
          this.passengers = this.passengers.filter(p => !p.isDelivered);
          continueAfterDelivery();
        }
      };

      passengersToDeliver.forEach(p => p.animateDelivery(station, onDelivered));
    } else {
      continueAfterDelivery();
    }
  }

  boardPassengersAtStation(station, onComplete) {
    const availableSlots = Math.max(0, this.train.capacity - this.train.onboard.length);
    if (availableSlots <= 0) {
      onComplete();
      return;
    }

    const waitingPassengers = this.passengers
      .filter(p => !p.isOnTrain && p.origin === station && !p.isDelivered)
      .slice(0, availableSlots);

    if (waitingPassengers.length > 0) {
      let remaining = waitingPassengers.length;

      const onBoarded = passenger => {
        this.train.onboard.push(passenger);

        remaining -= 1;
        if (remaining <= 0) {
          onComplete();
        }
      };

      waitingPassengers.forEach(p => p.animateBoarding(this.train, () => onBoarded(p)));
    } else {
      onComplete();
    }
  }
}