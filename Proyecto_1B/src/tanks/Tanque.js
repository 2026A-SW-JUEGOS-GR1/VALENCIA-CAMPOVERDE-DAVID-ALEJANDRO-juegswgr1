class TanqueBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    this.velocidadRotacion = 0;
    this.aceleracion = 0;

    this.teclas = scene.input.keyboard.addKeys({
      arriba: Phaser.Input.Keyboard.KeyCodes.W,
      abajo: Phaser.Input.Keyboard.KeyCodes.S,
      izquierda: Phaser.Input.Keyboard.KeyCodes.A,
      derecha: Phaser.Input.Keyboard.KeyCodes.D,
      disparo: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.bala = new Bala(scene, 0, 0, "dummy_bullet");
    this.bala.desactivar();

    scene.input.keyboard.on("keydown-SPACE", this.intentarDisparo, this);
  }

  actualizar() {
    if (this.teclas.izquierda.isDown) {
      this.setAngularVelocity(-this.velocidadRotacion);
    } else if (this.teclas.derecha.isDown) {
      this.setAngularVelocity(this.velocidadRotacion);
    } else {
      this.setAngularVelocity(0);
    }

    if (this.teclas.arriba.isDown) {
      this.scene.physics.velocityFromRotation(
        this.rotation,
        this.aceleracion,
        this.body.acceleration,
      );
    } else if (this.teclas.abajo.isDown) {
      this.scene.physics.velocityFromRotation(
        this.rotation,
        -this.aceleracion / 2,
        this.body.acceleration,
      );
    } else {
      this.setAcceleration(0);
    }
  }

  intentarDisparo() {
    if (!this.bala.active) {
      this.bala.disparar(this.x, this.y, this.rotation);
    }
  }
}

/* Tanque Rojo*/
class TanqueRojo extends TanqueBase {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);

    this.setMaxVelocity(100);
    this.setDrag(800);
    this.velocidadRotacion = 150;
    this.aceleracion = 300;

    this.tiempoHabilidad = 0;
    scene.input.keyboard.on("keydown-E", this.activarMuro, this);
  }

  activarMuro() {
    if (this.scene.time.now > this.tiempoHabilidad) {
      const distancia = 50;
      const muroX = this.x + Math.cos(this.rotation) * distancia;
      const muroY = this.y + Math.sin(this.rotation) * distancia;

      const muro = new MuroTrinchera(this.scene, muroX, muroY);
      muro.rotation = this.rotation;
      this.scene.muros.add(muro);

      this.tiempoHabilidad = this.scene.time.now + 10000;
    }
  }
}
