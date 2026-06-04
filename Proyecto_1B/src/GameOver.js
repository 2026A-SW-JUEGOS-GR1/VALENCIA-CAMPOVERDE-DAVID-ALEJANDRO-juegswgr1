class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  create() {
    const puntajeFinal = this.registry.get("puntuacion") || 0;

    this.add
      .text(400, 200, "FIN DE LA PARTIDA", {
        fontSize: "48px",
        fill: "#ff0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(400, 300, "Puntaje Total: " + puntajeFinal, {
        fontSize: "32px",
        fill: "#ffffff",
      })
      .setOrigin(0.5);

    const btnMenu = this.add
      .text(400, 450, "[ VOLVER AL MENÚ ]", {
        fontSize: "24px",
        fill: "#ffff00",
      })
      .setOrigin(0.5)
      .setInteractive();

    btnMenu.on("pointerdown", () => {
      this.registry.set("puntuacion", 0);
      this.scene.start("MenuScene");
    });
  }
}
