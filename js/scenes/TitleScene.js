// Fundo animado da tela inicial (praia com o robô pulando).
class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    Textures.createAll(this);
    drawBeachBackground(this, 960);

    for (let x = -20; x < 960; x += 64) this.add.image(x, GROUND_Y, 'ground_beach').setOrigin(0, 0);
    this.add.image(120, GROUND_Y + 4, 'palm').setOrigin(0.5, 1);
    this.add.image(850, GROUND_Y + 4, 'palm').setOrigin(0.5, 1).setFlipX(true);
    this.add.image(700, GROUND_Y - 12, 'chest').setScale(1.4);

    const robot = this.add.image(260, GROUND_Y - 28, 'robot_idle').setScale(1.6);
    this.tweens.add({
      targets: robot, y: GROUND_Y - 90, duration: 420, yoyo: true, repeat: -1,
      ease: 'Sine.easeOut', hold: 80, repeatDelay: 500,
      onYoyo: () => robot.setTexture('robot_jump'),
      onRepeat: () => robot.setTexture('robot_idle')
    });

    const crab = this.add.sprite(520, GROUND_Y - 16, 'crab1');
    this.tweens.add({ targets: crab, x: 600, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onYoyo: () => crab.toggleFlipX() });
    this.time.addEvent({ delay: 200, loop: true, callback: () => crab.setTexture(crab.texture.key === 'crab1' ? 'crab2' : 'crab1') });
  }
}

// Fundo da praia (céu, sol, mar, ilhas, nuvens). Usado na tela inicial e na fase 1.
function drawBeachBackground(scene, worldWidth) {
  const sky = scene.add.graphics().setScrollFactor(0).setDepth(-100);
  sky.fillGradientStyle(0x4fc3f7, 0x4fc3f7, 0xb3e5fc, 0xb3e5fc, 1);
  sky.fillRect(0, 0, 960, 540);

  const sun = scene.add.graphics().setScrollFactor(0).setDepth(-99);
  sun.fillStyle(0xfff59d, 0.35); sun.fillCircle(820, 90, 62);
  sun.fillStyle(0xffee58, 1); sun.fillCircle(820, 90, 42);

  // ilhas distantes
  for (let x = 100; x < worldWidth * 0.12 + 960; x += 520) {
    scene.add.image(x, 345, 'island').setScrollFactor(0.12).setDepth(-97).setOrigin(0.5, 1);
  }

  // mar ao fundo
  const sea = scene.add.graphics().setScrollFactor(0).setDepth(-96);
  sea.fillGradientStyle(0x29b6f6, 0x29b6f6, 0x0277bd, 0x0277bd, 1);
  sea.fillRect(0, 330, 960, 210);
  sea.fillStyle(0xffffff, 0.35);
  for (let i = 0; i < 18; i++) sea.fillRect((i * 137) % 960, 345 + (i * 53) % 110, 40 + (i % 3) * 20, 3);

  // nuvens
  for (let i = 0; i * 300 < worldWidth * 0.25 + 960; i++) {
    const c = scene.add.image(i * 300 + (i % 2) * 80, 60 + (i % 3) * 45, 'cloud')
      .setScrollFactor(0.25).setDepth(-95).setScale(0.8 + (i % 3) * 0.2);
    scene.tweens.add({ targets: c, x: c.x + 40, duration: 4000 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
