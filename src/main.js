import Phaser from "phaser";
import GameScene from "./GameScene";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#f5f3ed",
  scene: [GameScene],
};

new Phaser.Game(config);