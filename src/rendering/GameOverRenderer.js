/**
 * GameOverRenderer — displays game over screen with stats and restart button.
 */

export default class GameOverRenderer {
  constructor(scene, sim) {
    this.scene = scene;
    this.sim = sim;
    this.created = false;
    this.overlay = null;
    this.texts = [];
    this.restartBtn = null;
    this.onRestart = null; // callback set by GameScene
  }

  render() {
    if (!this.sim.isGameOver) return;

    if (!this.created) {
      this._create();
      this.created = true;
    }
  }

  _create() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const cx = w / 2;
    const cy = h / 2;

    // Dark overlay
    this.overlay = this.scene.add.rectangle(cx, cy, w, h, 0x000000, 0);
    this.overlay.setDepth(100);
    this.overlay.setScrollFactor(0);

    this.scene.tweens.add({
      targets: this.overlay,
      fillAlpha: 0.65,
      duration: 800,
      ease: 'Power2'
    });

    // Game Over title
    const title = this.scene.add.text(cx, cy - 80, 'Game Over', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setAlpha(0);

    this.scene.tweens.add({
      targets: title,
      alpha: 1,
      y: cy - 90,
      duration: 600,
      delay: 300,
      ease: 'Power2'
    });

    // Stats
    const clock = this.sim.clock;
    const statsLines = [
      `Passengers Delivered: ${this.sim.score}`,
      `Days Survived: ${clock.dayNumber}`,
      `Weeks Completed: ${clock.weekNumber - 1}`
    ];

    const stats = this.scene.add.text(cx, cy - 10, statsLines.join('\n'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setAlpha(0);

    this.scene.tweens.add({
      targets: stats,
      alpha: 1,
      duration: 600,
      delay: 600,
      ease: 'Power2'
    });

    // Play Again button
    const btnBg = this.scene.add.rectangle(cx, cy + 80, 180, 48, 0xffffff, 0.9);
    btnBg.setDepth(101);
    btnBg.setScrollFactor(0);
    btnBg.setInteractive({ useHandCursor: true });
    btnBg.setAlpha(0);

    const btnText = this.scene.add.text(cx, cy + 80, 'Play Again', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#333333',
      align: 'center'
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0).setAlpha(0);

    this.scene.tweens.add({
      targets: [btnBg, btnText],
      alpha: 1,
      duration: 400,
      delay: 900,
      ease: 'Power2'
    });

    // Hover effect
    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0xeeeeee);
      btnBg.setScale(1.05);
      btnText.setScale(1.05);
    });

    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0xffffff, 0.9);
      btnBg.setScale(1);
      btnText.setScale(1);
    });

    btnBg.on('pointerdown', () => {
      if (this.onRestart) this.onRestart();
    });

    this.texts = [title, stats, btnText];
    this.restartBtn = btnBg;
  }

  destroy() {
    if (this.overlay) this.overlay.destroy();
    for (const t of this.texts) t.destroy();
    if (this.restartBtn) this.restartBtn.destroy();
    this.created = false;
  }
}
