/* Tanque Rojo */
class MuroTrinchera extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "muro_habilidad");
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setImmovable(true);

    scene.time.delayedCall(10000, () => {
      this.destroy();
    });
  }
}
