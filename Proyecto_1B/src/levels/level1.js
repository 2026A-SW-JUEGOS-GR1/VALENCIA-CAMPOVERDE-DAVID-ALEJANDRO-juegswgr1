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
    this.load.image(
      "caja_destructible",
      "https://labs.phaser.io/assets/sprites/block.png",
    );
  }

  create() {
    this.input.keyboard.once("keydown-ESC", () => {
      this.scene.stop("UIScene");
      this.scene.start("MenuScene");
    });

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
    const capaParedes = mapa.createLayer("Paredes", tileset, 0, 0);

    if (capaParedes) {
      capaParedes.setCollisionByExclusion([-1]);
    }

    this.muros = this.physics.add.staticGroup();
    this.cajas = this.physics.add.staticGroup();

    this.cajas.create(300, 300, "caja_destructible");
    this.cajas.create(500, 200, "caja_destructible");

    const puntoSpawn = this.obtenerPuntoSpawnValido(mapa, capaParedes);
    this.jugador = new TanqueRojo(
      this,
      puntoSpawn.x,
      puntoSpawn.y,
      "tanque_rojo",
    );

    this.physics.world.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
    this.cameras.main.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
    this.cameras.main.startFollow(this.jugador);

    if (capaParedes) {
      this.physics.add.collider(this.jugador, capaParedes);
      this.physics.add.collider(this.jugador.bala, capaParedes);
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
  }

  update() {
    this.jugador.actualizar();
  }

  golpearCaja(bala, caja) {
    caja.destroy();

    let puntos = this.registry.get("puntuacion") || 0;
    this.registry.set("puntuacion", puntos + 100);

    bala.desactivar();

    if (this.cajas.countActive(true) === 0) {
      this.scene.stop("UIScene");
      this.scene.start("GameOverScene");
    }
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
