// =====================================================================
// ESCENA 1: MENÚ DE INICIO
// =====================================================================
class SceneMenu extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  create() {
    this.cameras.main.setBackgroundColor("#1a1a1a");

    this.add
      .text(400, 200, "LABERINTO DE ACERO", {
        fontSize: "45px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add
      .text(400, 300, "Encuentra la salida antes de que explote el motor.", {
        fontSize: "20px",
        fill: "#aaaaaa",
      })
      .setOrigin(0.5);
    this.add
      .text(400, 400, "Presiona [ESPACIO] para iniciar", {
        fontSize: "25px",
        fill: "#00ff00",
      })
      .setOrigin(0.5);

    this.input.keyboard.once("keydown-SPACE", () => {
      this.scene.start("Play");
    });
  }
}

// =====================================================================
// ESCENA 2: EL JUEGO PRINCIPAL
// =====================================================================
class ScenePlay extends Phaser.Scene {
  constructor() {
    super("Play");
  }

  preload() {
    this.load.spritesheet("carro", "assets/carro.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.image("tiles", "assets/tiles.png");
    this.load.tilemapTiledJSON("mapa", "assets/mapa.json");

    this.load.audio("musica_fondo", "assets/bgm.mp3");
    this.load.audio("motor_quieto", "assets/motor_idle.mp3");
    this.load.audio("motor_movimiento", "assets/motor_move.mp3");
  }

  create() {
    // --- CONTROL DE ESTADO DEL JUEGO ---
    // Esta variable evitará que el código siga intentando mover el carro o hacer sonar el motor cuando ganamos o perdemos
    this.juegoTerminado = false;

    // 1. CREAR EL MAPA
    const map = this.make.tilemap({ key: "mapa" });
    const tileset = map.addTilesetImage("mosaico_laberinto", "tiles");
    const capaPrincipal = map.createLayer("Capa1", tileset, 0, 0);
    capaPrincipal.setCollision(2);

    // 2. SPAWN ALEATORIO DEL JUGADOR
    const bloquesLibres = capaPrincipal.filterTiles((tile) => tile.index === 1);
    const spawnAleatorio = Phaser.Math.RND.pick(bloquesLibres);
    const spawnX = spawnAleatorio.x * 32 + 16;
    const spawnY = spawnAleatorio.y * 32 + 16;

    this.player = this.physics.add.sprite(spawnX, spawnY, "carro");
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, 800, 800);
    this.physics.add.collider(this.player, capaPrincipal);

    // AJUSTES DE ESCALA Y FÍSICAS DE DERRAPE
    this.player.setScale(0.6);
    this.player.setDrag(400);
    this.player.setMaxVelocity(250);

    // SISTEMA DE PARTÍCULAS (Humo de llantas)
    const graficosHumo = this.make.graphics();
    graficosHumo.fillStyle(0xcccccc, 0.4);
    graficosHumo.fillCircle(4, 4, 4);
    graficosHumo.generateTexture("humo_derrape", 8, 8);
    graficosHumo.destroy();

    this.emitter = this.add.particles(0, 0, "humo_derrape", {
      speed: { min: -20, max: 20 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 500,
      emitting: false,
    });
    this.emitter.startFollow(this.player);

    // 3. ANIMACIONES DEL CARRO
    this.anims.create({
      key: "down",
      frames: this.anims.generateFrameNumbers("carro", { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("carro", { start: 3, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("carro", { start: 6, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "up",
      frames: this.anims.generateFrameNumbers("carro", { start: 9, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });

    // 4. SISTEMA DE AUDIO (Con volúmenes ajustados)
    this.musicaFondo = this.sound.add("musica_fondo", {
      loop: true,
      volume: 0.3,
    });
    this.musicaFondo.play();

    this.motorQuieto = this.sound.add("motor_quieto", {
      loop: true,
      volume: 0.3,
    });
    this.motorQuieto.play();

    // CORRECCIÓN: Volumen del motor en movimiento bajado drásticamente a 0.35 para que no sea molesto
    this.motorMovimiento = this.sound.add("motor_movimiento", {
      loop: true,
      volume: 0.35,
    });

    // 5. SALIDA ALEATORIA EN EL BORDE
    const posiblesSalidas = [
      { tx: 12, ty: 0 },
      { tx: 12, ty: 24 },
      { tx: 0, ty: 12 },
      { tx: 24, ty: 12 },
    ];

    const salidaElegida = Phaser.Math.RND.pick(posiblesSalidas);
    capaPrincipal.putTileAt(1, salidaElegida.tx, salidaElegida.ty);

    const exitPixelX = salidaElegida.tx * 32 + 16;
    const exitPixelY = salidaElegida.ty * 32 + 16;

    this.exitZone = this.add.zone(exitPixelX, exitPixelY, 32, 32);
    this.physics.add.existing(this.exitZone);
    this.physics.add.overlap(
      this.player,
      this.exitZone,
      this.winGame,
      null,
      this,
    );

    // 6. SEGUIMIENTO DE CÁMARA Y NIEBLA
    this.cameras.main.setZoom(1.4);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, 800, 800);

    const darkOverlay = this.add
      .rectangle(0, 0, 800, 800, 0x000000, 0.95)
      .setOrigin(0, 0);
    this.light = this.make.graphics();
    this.light.fillCircle(0, 0, 100);

    const mask = new Phaser.Display.Masks.BitmapMask(this, this.light);
    mask.invertAlpha = true;
    darkOverlay.setMask(mask);

    // 7. HUD: TEMPORIZADOR (Corrección de coordenadas)
    this.initialTime = 45;

    // Ya no usamos setScrollFactor(0) porque el zoom lo desconfigura. Ahora se dibujará en el nivel (Depth 10)
    this.timeText = this.add
      .text(0, 0, "Tiempo: " + this.initialTime, {
        fontSize: "20px",
        fill: "#ff0000",
        fontStyle: "bold",
      })
      .setDepth(10);

    this.timeEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // 8. CONTROLES
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    // CORRECCIÓN AUDIO FANTASMA: Si el juego ya terminó, cancelamos todo el código de movimiento y sonido
    if (this.juegoTerminado) return;

    let ax = 0;
    let ay = 0;
    const aceleracion = 800;
    let isMoving = false;

    if (this.cursors.left.isDown) {
      ax = -aceleracion;
      this.player.anims.play("left", true);
      isMoving = true;
    } else if (this.cursors.right.isDown) {
      ax = aceleracion;
      this.player.anims.play("right", true);
      isMoving = true;
    }

    if (this.cursors.up.isDown) {
      ay = -aceleracion;
      this.player.anims.play("up", true);
      isMoving = true;
    } else if (this.cursors.down.isDown) {
      ay = aceleracion;
      this.player.anims.play("down", true);
      isMoving = true;
    }

    this.player.body.setAcceleration(ax, ay);

    if (!isMoving) {
      this.player.anims.stop();
      this.emitter.emitting = false;

      if (!this.motorQuieto.isPlaying) {
        this.motorMovimiento.stop();
        this.motorQuieto.play();
      }
    } else {
      this.emitter.emitting = true;

      if (!this.motorMovimiento.isPlaying) {
        this.motorQuieto.stop();
        this.motorMovimiento.play();
      }
    }

    if (this.light) {
      this.light.x = this.player.x;
      this.light.y = this.player.y;
    }

    // CORRECCIÓN HUD: Forzamos al texto a que persiga la esquina superior izquierda real de lo que ve la cámara
    this.timeText.x = this.cameras.main.worldView.x + 15;
    this.timeText.y = this.cameras.main.worldView.y + 15;
  }

  updateTimer() {
    if (this.juegoTerminado) return; // Validación extra de seguridad

    this.initialTime -= 1;
    this.timeText.setText("Tiempo: " + this.initialTime);

    if (this.initialTime <= 0) {
      this.juegoTerminado = true; // Levantamos la bandera para detener el Update
      this.timeEvent.remove();
      this.sound.stopAll();
      this.scene.start("GameOver", { win: false });
    }
  }

  winGame() {
    if (this.juegoTerminado) return; // Validación extra de seguridad

    this.juegoTerminado = true; // Levantamos la bandera para detener el Update
    this.timeEvent.remove();
    this.sound.stopAll();
    this.scene.start("GameOver", { win: true, timeLeft: this.initialTime });
  }
}

// =====================================================================
// ESCENA 3: FIN DE JUEGO
// =====================================================================
class SceneGameOver extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  init(data) {
    this.victoria = data.win;
    this.tiempoSobrante = data.timeLeft || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor("#000000");

    const titulo = this.victoria ? "¡ESCAPASTE CON VIDA!" : "TIEMPO AGOTADO";
    const colorTitulo = this.victoria ? "#00ff00" : "#ff0000";
    const subtitulo = this.victoria
      ? `Tiempo sobrante: ${this.tiempoSobrante} segundos`
      : "El motor de tu vehículo ha explotado.";

    this.add
      .text(400, 200, titulo, {
        fontSize: "45px",
        fill: colorTitulo,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add
      .text(400, 300, subtitulo, { fontSize: "20px", fill: "#ffffff" })
      .setOrigin(0.5);
    this.add
      .text(400, 450, "Presiona [ESPACIO] para volver al menú", {
        fontSize: "25px",
        fill: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.input.keyboard.once("keydown-SPACE", () => {
      this.scene.start("Menu");
    });
  }
}

// =====================================================================
// CONFIGURACIÓN GLOBAL
// =====================================================================
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [SceneMenu, ScenePlay, SceneGameOver],
};

const game = new Phaser.Game(config);
