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
