/**
 * UIRenderer — draws the day/time progress bar, line selector, and score.
 * Minimal, clean Mini Metro style.
 */

import { DAYS } from '../simulation/GameClock.js';

export default class UIRenderer {
  constructor(scene, sim) {
    this.scene = scene;
    this.sim = sim;

    this.graphics = this.scene.add.graphics();
    this.graphics.setDepth(50);
    this.graphics.setScrollFactor(0);

    // Text objects
    this.dayText = this.scene.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#666666'
    }).setDepth(51).setScrollFactor(0);

    this.weekText = this.scene.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#999999'
    }).setDepth(51).setScrollFactor(0);

    this.scoreText = this.scene.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#333333'
    }).setDepth(51).setScrollFactor(0);

    // Line selector state
    this.activeLineIndex = 0;
    this.lineButtons = [];
    this._createLineButtons();
  }

  get activeLineId() {
    if (this.activeLineIndex < this.sim.lines.length) {
      return this.sim.lines[this.activeLineIndex].id;
    }
    return null;
  }

  render() {
    const w = this.scene.scale.width;

    this.graphics.clear();
    this._drawDayBar(w);
    this._updateScore(w);
    this._updateLineButtons();
  }

  _drawDayBar(screenWidth) {
    const barY = 12;
    const barLeft = 20;
    const barRight = screenWidth - 20;
    const barWidth = barRight - barLeft;

    // Background track
    this.graphics.lineStyle(2, 0xdddddd);
    this.graphics.beginPath();
    this.graphics.moveTo(barLeft, barY);
    this.graphics.lineTo(barRight, barY);
    this.graphics.strokePath();

    // Day markers
    const clock = this.sim.clock;
    for (let i = 0; i < 7; i++) {
      const x = barLeft + (barWidth * i) / 6;
      this.graphics.fillStyle(0xbbbbbb);
      this.graphics.fillCircle(x, barY, 3);
    }

    // Current position cursor
    const dayInWeek = clock.dayNumber % 7;
    const progress = dayInWeek + clock.dayProgress;
    const cursorX = barLeft + (barWidth * progress) / 6;

    this.graphics.fillStyle(0x333333);
    this.graphics.fillCircle(cursorX, barY, 5);

    // Day label
    this.dayText.setText(clock.currentDay);
    this.dayText.setPosition(cursorX - this.dayText.width / 2, barY + 10);

    // Week label
    this.weekText.setText(`Week ${clock.weekNumber}`);
    this.weekText.setPosition(barLeft, barY + 10);
  }

  _updateScore(screenWidth) {
    this.scoreText.setText(`${this.sim.score}`);
    this.scoreText.setPosition(screenWidth - 50, 35);
  }

  _createLineButtons() {
    const startX = 30;
    const startY = this.scene.scale.height - 40;

    for (let i = 0; i < this.sim.lines.length; i++) {
      const line = this.sim.lines[i];
      const x = startX + i * 40;

      const btn = this.scene.add.circle(x, startY, 14, line.color);
      btn.setDepth(52);
      btn.setStrokeStyle(2, 0x333333);
      btn.setInteractive();
      btn.setScrollFactor(0);

      btn.on('pointerdown', () => {
        this.activeLineIndex = i;
      });

      this.lineButtons.push(btn);
    }
  }

  _updateLineButtons() {
    for (let i = 0; i < this.lineButtons.length; i++) {
      const btn = this.lineButtons[i];
      const isActive = i === this.activeLineIndex;

      btn.setStrokeStyle(isActive ? 3 : 1.5, isActive ? 0x222222 : 0x999999);
      btn.setScale(isActive ? 1.2 : 1.0);

      // Update Y position in case of resize
      btn.setPosition(30 + i * 40, this.scene.scale.height - 40);
    }
  }

  destroy() {
    this.graphics.destroy();
    this.dayText.destroy();
    this.weekText.destroy();
    this.scoreText.destroy();
    for (const btn of this.lineButtons) btn.destroy();
  }
}
