// Cenários de fundo e temas visuais de cada fase.

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

// Fundo da floresta (céu entre as copas, raios de sol, árvores ao longe e vagalumes)
function drawForestBackground(scene, worldWidth) {
  const sky = scene.add.graphics().setScrollFactor(0).setDepth(-100);
  sky.fillGradientStyle(0x26a69a, 0x26a69a, 0xdcedc8, 0xdcedc8, 1);
  sky.fillRect(0, 0, 960, 540);

  const rays = scene.add.graphics().setScrollFactor(0).setDepth(-99);
  rays.fillStyle(0xffffff, 0.1);
  [[620, 120], [720, 90], [840, 140]].forEach(([x, w]) => rays.fillTriangle(x, 0, x + w, 0, x - 260 + w, 540));

  // morros ao longe
  const hills = scene.add.graphics().setScrollFactor(0.1).setDepth(-98);
  hills.fillStyle(0x81c784, 1);
  for (let x = -100; x < worldWidth * 0.1 + 1100; x += 260) hills.fillEllipse(x, 400, 360, 200);

  // duas camadas de árvores (efeito de profundidade)
  for (let x = 0, i = 0; x < worldWidth * 0.25 + 1000; x += 140, i++) {
    scene.add.image(x, 470, 'tree_far').setOrigin(0.5, 1).setScrollFactor(0.25).setDepth(-97)
      .setTint(0x4caf50).setAlpha(0.55).setScale(0.8 + (i % 3) * 0.15);
  }
  for (let x = 60, i = 0; x < worldWidth * 0.5 + 1000; x += 260, i++) {
    scene.add.image(x, 480, 'tree_far').setOrigin(0.5, 1).setScrollFactor(0.5).setDepth(-96)
      .setTint(0x2e7d32).setAlpha(0.85).setScale(1 + (i % 2) * 0.2);
  }

  // vagalumes
  scene.add.particles(0, 0, 'spark', {
    x: { min: 0, max: 960 }, y: { min: 120, max: 460 },
    lifespan: 3000, speedX: { min: -15, max: 15 }, speedY: { min: -20, max: 5 },
    scale: { start: 0.45, end: 0 }, alpha: { start: 0.9, end: 0 },
    tint: 0xeeff41, frequency: 220, blendMode: 'ADD'
  }).setScrollFactor(0).setDepth(-50);
}

// Tema de cada fase: texturas do chão, das plataformas, da água e da decoração
const THEMES = {
  beach: {
    background: drawBeachBackground,
    ground: 'ground_beach', platform: 'plank', water: 'water',
    decorate(scene, L) {
      for (let x = 140; x < L.width; x += 430 + (x % 3) * 60) {
        if (scene.onGround(x)) scene.add.image(x, GROUND_Y + 6, 'palm').setOrigin(0.5, 1).setDepth(-5).setFlipX(x % 2 === 0);
      }
      for (let x = 90; x < L.width; x += 170 + (x % 7) * 20) {
        if (scene.onGround(x)) scene.add.image(x, GROUND_Y + 2, x % 3 ? 'shell' : 'rock').setOrigin(0.5, 1).setDepth(0);
      }
    }
  },
  forest: {
    background: drawForestBackground,
    ground: 'ground_forest', platform: 'branch', water: 'swamp',
    decorate(scene, L) {
      for (let x = 160; x < L.width; x += 380 + (x % 4) * 50) {
        if (scene.onGround(x)) scene.add.image(x, GROUND_Y + 8, 'tree_big').setOrigin(0.5, 1).setDepth(-5).setFlipX(x % 2 === 0);
      }
      for (let x = 60; x < L.width; x += 150 + (x % 5) * 25) {
        if (scene.onGround(x)) scene.add.image(x, GROUND_Y + 4, x % 3 ? 'shroom' : 'bush').setOrigin(0.5, 1).setDepth(0);
      }
    }
  }
};
