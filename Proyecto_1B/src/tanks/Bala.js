class Bala extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setBounce(1);
    this.setCollideWorldBounds(true);

    this.tiempoVida = null;
  }

  disparar(x, y, angulo) {
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.setScale(2);

    this.scene.physics.velocityFromRotation(angulo, 300, this.body.velocity);

    if (this.tiempoVida) {
      this.tiempoVida.remove();
    }

    this.tiempoVida = this.scene.time.delayedCall(15000, () => {
      this.desactivar();
    });
  }

  desactivar() {
    this.setActive(false);
    this.setVisible(false);
    this.body.stop();
  }
}
