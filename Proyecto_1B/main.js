/* ENTIDADES NIVEL 2 */

class Teletransportador extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, destinoX, destinoY) {
    super(scene, x, y, "portal");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.destinoX = destinoX;
    this.destinoY = destinoY;
    this.enCooldown = false;
  }

  teletransportar(jugador) {
    if (!this.enCooldown) {
      jugador.setPosition(this.destinoX, this.destinoY);
      this.enCooldown = true;

      this.scene.time.delayedCall(1000, () => {
        this.enCooldown = false;
      });
    }
  }
}

/* ESCENA NIVEL 2 */

class Level2 extends Phaser.Scene {
  constructor() {
    super({ key: "Level2" });
  }

  preload() {
    this.load.image(
      "tiles_nivel2",
      "https://labs.phaser.io/assets/tilemaps/tiles/gridtiles.png",
    );
    this.load.tilemapTiledJSON("mapa_nivel2", "ruta/mapa2.json");
    this.load.image(
      "tanque_azul",
      "https://labs.phaser.io/assets/sprites/space-baddie.png",
    );
    this.load.image(
      "portal",
      "https://labs.phaser.io/assets/sprites/orb-blue.png",
    );
  }

  create() {
    this.input.keyboard.once("keydown-ESC", () => {
      this.scene.stop("UIScene");
      this.scene.start("MenuScene");
    });

    const mapa = this.make.tilemap({ key: "mapa_nivel2" });

    let capaParedes = null;
    if (mapa.tilesets.length > 0) {
      const tileset = mapa.addTilesetImage("Suelo", "tiles_nivel2");
      mapa.createLayer("Suelo", tileset, 0, 0);
      capaParedes = mapa.createLayer("Paredes", tileset, 0, 0);
      if (capaParedes) {
        capaParedes.setCollisionByExclusion([-1]);
      }
    }

    this.portales = this.physics.add.staticGroup();

    const portalA = new Teletransportador(this, 150, 450, 650, 150);
    const portalB = new Teletransportador(this, 650, 150, 150, 450);

    this.portales.add(portalA);
    this.portales.add(portalB);

    this.jugador = new TanqueAzul(this, 100, 100, "tanque_azul");

    this.physics.world.setBounds(0, 0, 800, 600);
    this.cameras.main.setBounds(0, 0, 800, 600);
    this.cameras.main.startFollow(this.jugador);

    if (capaParedes) {
      this.physics.add.collider(this.jugador, capaParedes);
      this.physics.add.collider(this.jugador.bala, capaParedes);
    }

    this.physics.add.overlap(
      this.jugador,
      this.portales,
      this.usarPortal,
      null,
      this,
    );
    this.physics.add.collider(
      this.jugador.bala,
      this.jugador,
      this.recibirDano,
      null,
      this,
    );
  }

  update() {
    this.jugador.actualizar();
  }

  usarPortal(jugador, portal) {
    portal.teletransportar(jugador);
  }

  recibirDano(bala, jugador) {
    if (!jugador.esInvulnerable) {
      bala.desactivar();
      this.scene.stop("UIScene");
      this.scene.start("GameOverScene");
    }
  }
}

/* ENTIDADES NIVEL 3 */

class MinaOxido extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "mina");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
  }

  detonar(jugador) {
    this.destroy();

    const maxVelOriginal = 350;
    jugador.setMaxVelocity(maxVelOriginal * 0.2);

    jugador.scene.time.delayedCall(3000, () => {
      jugador.setMaxVelocity(maxVelOriginal);
    });
  }
}

class TanqueVerde extends TanqueBase {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);

    this.setMaxVelocity(350);
    this.setDrag(50);
    this.velocidadRotacion = 250;
    this.aceleracion = 400;

    this.tiempoHabilidad = 0;

    scene.input.keyboard.on("keydown-E", this.colocarMina, this);
  }

  colocarMina() {
    if (this.scene.time.now > this.tiempoHabilidad) {
      const mina = new MinaOxido(this.scene, this.x, this.y);
      this.scene.minas.add(mina);
      this.tiempoHabilidad = this.scene.time.now + 8000;
    }
  }
}

/* ESCENA NIVEL 3 */

class Level3 extends Phaser.Scene {
  constructor() {
    super({ key: "Level3" });
  }

  preload() {
    this.load.image(
      "tiles_nivel3",
      "https://labs.phaser.io/assets/tilemaps/tiles/gridtiles.png",
    );
    this.load.tilemapTiledJSON("mapa_nivel3", "ruta/mapa3.json");
    this.load.image(
      "tanque_verde",
      "https://labs.phaser.io/assets/sprites/space-baddie.png",
    );
    this.load.image("mina", "https://labs.phaser.io/assets/sprites/bomb.png");
  }

  create() {
    this.input.keyboard.once("keydown-ESC", () => {
      this.scene.stop("UIScene");
      this.scene.start("MenuScene");
    });

    this.mapa = this.make.tilemap({ key: "mapa_nivel3" });

    let capaParedes = null;
    this.capaBarro = null;

    if (this.mapa.tilesets.length > 0) {
      const tileset = this.mapa.addTilesetImage(
        "nombre_en_tiled",
        "tiles_nivel3",
      );
      this.mapa.createLayer("Suelo", tileset, 0, 0);
      this.capaBarro = this.mapa.createLayer("Barro", tileset, 0, 0);
      capaParedes = this.mapa.createLayer("Paredes", tileset, 0, 0);

      if (capaParedes) {
        capaParedes.setCollisionByExclusion([-1]);
      }
    }

    this.minas = this.physics.add.group();
    this.jugador = new TanqueVerde(this, 100, 100, "tanque_verde");

    this.physics.world.setBounds(0, 0, 800, 600);
    this.cameras.main.setBounds(0, 0, 800, 600);
    this.cameras.main.startFollow(this.jugador);

    if (capaParedes) {
      this.physics.add.collider(this.jugador, capaParedes);
      this.physics.add.collider(this.jugador.bala, capaParedes);
    }

    this.physics.add.overlap(
      this.jugador,
      this.minas,
      this.pisarMina,
      null,
      this,
    );
  }

  update() {
    this.jugador.actualizar();
    this.gestionarBarro();
  }

  pisarMina(jugador, mina) {
    mina.detonar(jugador);
  }

  gestionarBarro() {
    if (this.capaBarro) {
      const tile = this.capaBarro.getTileAtWorldXY(
        this.jugador.x,
        this.jugador.y,
      );
      if (tile && tile.index !== -1) {
        this.jugador.setDrag(800);
      } else {
        this.jugador.setDrag(50);
      }
    }
  }
}

/* INTERFAZ DE USUARIO Y PUNTUACIÓN */

class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  create() {
    this.registry.set("puntuacion", 0);

    // this.textoPuntuacion = this.add.text(20, 20, "PUNTOS: 0", {
    //   fontSize: "24px",
    //   fill: "#ffffff",
    //   fontFamily: "monospace",
    // });

    this.registry.events.on("changedata-puntuacion", (parent, valor) => {
      this.textoPuntuacion.setText("PUNTOS: " + valor);
    });
  }
}

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 960,
  },
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, Level1, Level2, Level3, UIScene, GameOverScene],
};

const game = new Phaser.Game(config);
