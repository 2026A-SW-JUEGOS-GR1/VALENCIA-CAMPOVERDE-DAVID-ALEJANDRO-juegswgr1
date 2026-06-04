class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    this.load.image(
      "dummy_tiles",
      "https://labs.phaser.io/assets/tilemaps/tiles/gridtiles.png",
    );
    this.load.image("dummy_tank", "tanqueRojo.png");
    this.load.image(
      "dummy_bullet",
      "https://labs.phaser.io/assets/sprites/bullet.png",
    );
  }

  create() {
    this.scene.start("MenuScene");
  }
}
