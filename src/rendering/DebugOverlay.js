/**
 * DebugOverlay — toggle with 'D' key. Shows FPS, train states,
 * passenger counts, and track info.
 */

export default class DebugOverlay {
  constructor(scene, sim) {
    this.scene = scene;
    this.sim = sim;
    this.visible = false;

    this.text = this.scene.add.text(10, 40, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#00ff00',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 6 }
    }).setDepth(200).setScrollFactor(0).setAlpha(0);

    // Toggle with D key
    this.scene.input.keyboard.on('keydown-D', () => {
      this.visible = !this.visible;
      this.text.setAlpha(this.visible ? 1 : 0);
    });
  }

  render() {
    if (!this.visible) return;

    const sim = this.sim;
    const fps = Math.round(this.scene.game.loop.actualFps);

    const lines = [
      `FPS: ${fps}`,
      `Day: ${sim.clock.currentDay} (${sim.clock.dayNumber}) | Week ${sim.clock.weekNumber}`,
      `Score: ${sim.score}`,
      `Stations: ${sim.stations.filter(s => s.visible).length}`,
      `Passengers: ${sim.passengers.length}`,
      '',
      '--- TRAINS ---'
    ];

    for (const train of sim.trains) {
      const line = sim.getLineById(train.lineId);
      const lineLabel = line ? `Line ${sim.lines.indexOf(line)}` : '?';
      lines.push(
        `  ${lineLabel}: ${train.state} | pos(${Math.round(train.x)},${Math.round(train.y)}) | pax:${train.passengers.length}/${train.capacity}`
      );
    }

    lines.push('', '--- STATIONS ---');
    for (const station of sim.stations) {
      if (!station.visible) continue;
      const crowdIcon = station.isOvercrowded ? '⚠' : '';
      const timer = station.overcrowdTimer > 0 ? ` (${station.overcrowdTimer.toFixed(1)}s)` : '';
      lines.push(
        `  #${station.id} ${station.shape}: ${station.waitingPassengers.length} pax ${crowdIcon}${timer}`
      );
    }

    lines.push('', '--- LINES ---');
    for (let i = 0; i < sim.lines.length; i++) {
      const line = sim.lines[i];
      lines.push(`  Line ${i}: [${line.stationIds.join(' → ')}]`);
    }

    this.text.setText(lines.join('\n'));
  }

  destroy() {
    this.text.destroy();
  }
}
