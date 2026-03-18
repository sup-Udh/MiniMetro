import Phaser from "phaser";
import GameScene from "./GameScene";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#111",
  scene: [GameScene],
};

new Phaser.Game(config);