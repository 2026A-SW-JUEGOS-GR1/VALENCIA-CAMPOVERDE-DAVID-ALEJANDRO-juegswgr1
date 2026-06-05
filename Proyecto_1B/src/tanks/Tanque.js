class TanqueBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    this.setDisplaySize(64, 50);

    this.velocidadRotacion = 0;
    this.aceleracion = 0;

    this.bala = new Bala(scene, 0, 0, "dummy_bullet");
    this.bala.desactivar();
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
      // Desplazamos el punto de aparición hacia adelante
      const distancia = 35; // Aumenta este número si tu tanque es más grande
      const balaX = this.x + Math.cos(this.rotation) * distancia;
      const balaY = this.y + Math.sin(this.rotation) * distancia;

      // Disparamos desde la nueva coordenada segura
      this.bala.disparar(balaX, balaY, this.rotation);
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

    this.teclas = scene.input.keyboard.addKeys({
      arriba: Phaser.Input.Keyboard.KeyCodes.W,
      abajo: Phaser.Input.Keyboard.KeyCodes.S,
      izquierda: Phaser.Input.Keyboard.KeyCodes.A,
      derecha: Phaser.Input.Keyboard.KeyCodes.D,
      disparo: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.tiempoHabilidad = 0;
    scene.input.keyboard.on("keydown-E", this.activarMuro, this);
    scene.input.keyboard.on("keydown-SPACE", this.intentarDisparo, this);
  }

  activarMuro() {
    if (this.scene.time.now > this.tiempoHabilidad) {
      const distancia = 65;
      const muroX = this.x + Math.cos(this.rotation) * distancia;
      const muroY = this.y + Math.sin(this.rotation) * distancia;

      const muro = new MuroTrinchera(this.scene, muroX, muroY);

      const escalaLargo = 0.5;
      const escalaGrosor = 0.1;
      muro.setScale(escalaLargo, escalaGrosor);

      let anguloObjetivo = this.rotation + Math.PI / 2;
      muro.rotation = Phaser.Math.Snap.To(anguloObjetivo, Math.PI / 2);

      this.scene.muros.add(muro);

      // Calculamos cuánto mide la imagen realmente en píxeles
      const anchoEscalado = muro.width * escalaLargo;
      const altoEscalado = muro.height * escalaGrosor;

      const esVertical = Math.abs(Math.cos(muro.rotation)) < 0.1;

      if (esVertical) {
        muro.body.width = altoEscalado;
        muro.body.height = anchoEscalado;
      } else {
        muro.body.width = anchoEscalado;
        muro.body.height = altoEscalado;
      }

      muro.body.x = muroX - muro.body.width / 2;
      muro.body.y = muroY - muro.body.height / 2;

      this.tiempoHabilidad = this.scene.time.now + 10000;
    }
  }
}

class TanqueAzul extends TanqueBase {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);

    this.setMaxVelocity(250);
    this.setDrag(200);
    this.velocidadRotacion = 300;
    this.aceleracion = 150;

    this.teclas = scene.input.keyboard.addKeys({
      arriba: Phaser.Input.Keyboard.KeyCodes.UP,
      abajo: Phaser.Input.Keyboard.KeyCodes.DOWN,
      izquierda: Phaser.Input.Keyboard.KeyCodes.LEFT,
      derecha: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      disparo: Phaser.Input.Keyboard.KeyCodes.M,
    });

    this.tiempoHabilidad = 0;
    this.esInvulnerable = false;

    scene.input.keyboard.on("keydown-N", this.activarDash, this);
    scene.input.keyboard.on("keydown-M", this.intentarDisparo, this);
  }

  activarDash() {
    if (this.scene.time.now > this.tiempoHabilidad) {
      this.esInvulnerable = true;
      this.scene.physics.velocityFromRotation(
        this.rotation,
        600,
        this.body.velocity,
      );
      this.scene.time.delayedCall(300, () => {
        this.esInvulnerable = false;
      });
      this.tiempoHabilidad = this.scene.time.now + 3000;
    }
  }
}
