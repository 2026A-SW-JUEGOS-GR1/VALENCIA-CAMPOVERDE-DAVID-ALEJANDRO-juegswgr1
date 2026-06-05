class Level1 extends Phaser.Scene {
  constructor() {
    super({ key: "Level1" });
  }

  preload() {
    this.load.image(
      "tiles_nivel1",
      "resources/img/spritesheet-tiles-default.png",
    );
    this.load.tilemapTiledJSON("mapa_nivel1", "resources/maps/mapa_nuevo.json");
    this.load.image("tanque_rojo", "resources/img/tanqueRojo.png");
    this.load.image("tanque_azul", "resources/img/tanqueAzul.png");
    this.load.image(
      "caja_destructible",
      "https://labs.phaser.io/assets/sprites/block.png",
    );
    this.load.image(
      "muro_habilidad",
      "https://labs.phaser.io/assets/sprites/platform.png",
    );
  }

  create() {
    // --- ESTADOS DE LA RONDA ---
    this.isResetting = false;
    this.rojoMuerto = false;
    this.azulMuerto = false;

    this.input.keyboard.once("keydown-ESC", () => {
      this.scene.stop("UIScene");
      this.scene.start("MenuScene");
    });

    // --- CONSTRUCCIÓN DEL MAPA ---
    const mapa = this.make.tilemap({ key: "mapa_nivel1" });
    const tileset = mapa.addTilesetImage(
      "spritesheet-tiles-default",
      "tiles_nivel1",
      64,
      64,
      0,
      1,
    );

    mapa.createLayer("Suelo", tileset, 0, 0);
    this.capaParedes = mapa.createLayer("Paredes", tileset, 0, 0);

    if (this.capaParedes) {
      this.capaParedes.setCollisionByExclusion([-1]);
    }

    // --- OBJETOS DE ESCENA ---
    this.muros = this.physics.add.staticGroup();
    // this.cajas = this.physics.add.staticGroup();
    // this.cajas.create(300, 300, "caja_destructible");
    // this.cajas.create(500, 200, "caja_destructible");

    // --- JUGADOR 1 (ROJO) ---
    const puntoSpawnRojo = this.obtenerPuntoSpawnValido(mapa, this.capaParedes);
    this.jugador = new TanqueRojo(
      this,
      puntoSpawnRojo.x,
      puntoSpawnRojo.y,
      "tanque_rojo",
    );

    // --- JUGADOR 2 (AZUL) ---
    const puntoSpawnAzul = this.obtenerPuntoSpawnValido(mapa, this.capaParedes);
    this.jugador1 = new TanqueAzul(
      this,
      puntoSpawnAzul.x,
      puntoSpawnAzul.y,
      "tanque_azul",
    );

    // --- CÁMARA Y LÍMITES ---
    this.physics.world.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
    this.cameras.main.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
    this.cameras.main.startFollow(this.jugador);

    // --- SISTEMA DE COLISIONES LIMPIO ---
    this.configurarColisiones();

    // ==========================================
    // --- INTERFAZ DE USUARIO (HUD) ---
    // ==========================================

    // 1. Leemos el score actual del registro global
    const scoreRojo = this.registry.get("scoreRojo") || 0;
    const scoreAzul = this.registry.get("scoreAzul") || 0;

    // 2. Obtenemos el ancho visible de la cámara para alinear el HUD azul a la derecha
    const anchoPantalla = this.cameras.main.width;

    // --- MARCADOR ROJO (Izquierda) ---
    this.add
      .image(60, 60, "tanque_rojo")
      .setScale(0.15) // Hacemos el tanque más pequeño para que sea un ícono
      .setAngle(-90) // (Opcional) Lo rotamos para que apunte hacia el texto
      .setScrollFactor(0) // ¡LA CLAVE! Lo ancla a la cámara
      .setDepth(100); // Lo pone por encima de las balas y paredes

    this.add
      .text(120, 35, `${scoreRojo}`, {
        fontSize: "48px",
        fill: "#ff3333",
        fontFamily: "Arial Black",
        stroke: "#000000", // Borde negro para que resalte sobre el mapa
        strokeThickness: 6,
      })
      .setScrollFactor(0)
      .setDepth(100);

    // --- MARCADOR AZUL (Derecha) ---
    this.add
      .image(anchoPantalla - 60, 60, "tanque_azul")
      .setScale(0.15)
      .setAngle(90)
      .setScrollFactor(0)
      .setDepth(100);

    // En el texto azul restamos un poco más de 'X' para que el número no tape al ícono
    this.add
      .text(anchoPantalla - 150, 35, `${scoreAzul}`, {
        fontSize: "48px",
        fill: "#3366ff",
        fontFamily: "Arial Black",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setScrollFactor(0)
      .setDepth(100);
  }

  update() {
    if (this.jugador && this.jugador.active) {
      this.jugador.actualizar();
    }
    if (this.jugador1 && this.jugador1.active) {
      this.jugador1.actualizar();
    }
  }

  configurarColisiones() {
    // 1. COLISIONES TANQUE ROJO (Físicas Normales)
    if (this.capaParedes) {
      this.physics.add.collider(this.jugador, this.capaParedes);
      this.physics.add.collider(this.jugador.bala, this.capaParedes);
    }
    this.physics.add.collider(this.jugador, this.cajas);
    this.physics.add.collider(
      this.jugador.bala,
      this.cajas,
      this.golpearCaja,
      null,
      this,
    );
    this.physics.add.collider(this.jugador, this.muros);
    this.physics.add.collider(this.jugador.bala, this.muros);

    // 2. COLISIONES TANQUE AZUL (Con filtro de Dash Fantasma)
    if (this.capaParedes) {
      this.physics.add.collider(this.jugador1.bala, this.capaParedes); // Su bala choca normal
      this.physics.add.collider(
        this.jugador1,
        this.capaParedes,
        null,
        (jugador, tile) => {
          if (!jugador.esInvulnerable) return true;
          // Evitar que salga del mapa durante el dash
          return (
            tile.x === 0 ||
            tile.x === this.capaParedes.tilemap.width - 1 ||
            tile.y === 0 ||
            tile.y === this.capaParedes.tilemap.height - 1
          );
        },
        this,
      );
    }
    this.physics.add.collider(
      this.jugador1,
      this.cajas,
      null,
      () => !this.jugador1.esInvulnerable,
      this,
    );
    this.physics.add.collider(
      this.jugador1.bala,
      this.cajas,
      this.golpearCaja,
      null,
      this,
    );
    this.physics.add.collider(
      this.jugador1,
      this.muros,
      null,
      () => !this.jugador1.esInvulnerable,
      this,
    );
    this.physics.add.collider(this.jugador1.bala, this.muros);

    // Fuego Cruzado
    this.physics.add.collider(
      this.jugador.bala,
      this.jugador1,
      this.impactoJugador,
      null,
      this,
    );
    this.physics.add.collider(
      this.jugador1.bala,
      this.jugador,
      this.impactoJugador,
      null,
      this,
    );

    // Fuego Amigo / Suicidio (Opcional, pero recomendado si rebotan las balas)
    this.physics.add.collider(
      this.jugador.bala,
      this.jugador,
      this.impactoJugador,
      null,
      this,
    );
    this.physics.add.collider(
      this.jugador1.bala,
      this.jugador1,
      this.impactoJugador,
      null,
      this,
    );
  }

  golpearCaja(bala, caja) {
    // Ya no da puntos ni termina el juego, solo funciona como cobertura destructible
    caja.destroy();
    bala.desactivar();
    bala.destroy(); // Destruye la bala para evitar rebotes infinitos
  }

  impactoJugador(bala, victima) {
    // Si la víctima esquivó con Dash, ignorar impacto
    if (victima.esInvulnerable) {
      bala.desactivar();
      return;
    }

    // Efectos de destrucción
    victima.disableBody(true, true);
    bala.desactivar();
    bala.destroy(); // Destruye la bala para evitar rebotes infinitos

    // Registrar quién fue destruido
    if (victima === this.jugador) this.rojoMuerto = true;
    if (victima === this.jugador1) this.azulMuerto = true;

    // Iniciar la ventana de 3 segundos solo una vez por ronda
    if (!this.isResetting) {
      this.isResetting = true;
      this.cameras.main.stopFollow();

      this.time.delayedCall(3000, () => {
        this.evaluarRonda();
      });
    }
  }

  evaluarRonda() {
    let scoreRojo = this.registry.get("scoreRojo") || 0;
    let scoreAzul = this.registry.get("scoreAzul") || 0;

    if (this.rojoMuerto && this.azulMuerto) {
      // Empate: Nadie suma puntos (o puedes sumar a ambos si lo prefieres)
      console.log("¡Empate! Ambos fueron destruidos.");
    } else if (this.rojoMuerto) {
      // Azul gana la ronda
      this.registry.set("scoreAzul", scoreAzul + 1);
    } else if (this.azulMuerto) {
      // Rojo gana la ronda
      this.registry.set("scoreRojo", scoreRojo + 1);
    }

    // Reinicia la escena: limpia las balas, recarga las cajas y lanza a
    // los tanques en nuevos puntos aleatorios automáticamente.
    this.scene.restart();
  }

  obtenerPuntoSpawnValido(mapa, capaParedes) {
    const puntosValidos = [];
    for (let y = 0; y < mapa.height; y++) {
      for (let x = 0; x < mapa.width; x++) {
        const tile = capaParedes.getTileAt(x, y);
        if (!tile || tile.index === -1) {
          puntosValidos.push({
            x: x * mapa.tileWidth + mapa.tileWidth / 2,
            y: y * mapa.tileHeight + mapa.tileHeight / 2,
          });
        }
      }
    }
    return Phaser.Utils.Array.GetRandom(puntosValidos);
  }
}
