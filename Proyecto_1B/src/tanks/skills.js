/* Tanque Rojo */
class MuroTrinchera extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "dummy_tiles");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);

    scene.time.delayedCall(5000, () => {
      this.destroy();
    });
  }
}
