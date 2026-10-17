// Cena principal de uma fase: plataformas, inimigos, baús, portas e chefão.
const SPEED = 260;
const JUMP = 640;
const MAX_LIVES = 5;

class LevelScene extends Phaser.Scene {
  constructor() { super('Level'); }

  init(data) {
    this.level = LEVELS[data.level - 1];
    this.state = { lives: 3, ammo: 10, coins: 0, score: 0, right: 0, asked: 0 };
    this.frozen = false;
    this.ended = false;
    this.now = 0;
    this.facing = 1;
    this.lastGround = 0;
    this.jumpBuffer = 0;
    this.jumpHeld = false;
    this.nextShot = 0;
    this.invulnUntil = 0;
    this.respawnX = this.level.startX;
    this.bossStarted = false;
    this.speechUntil = 0;
  }

  create() {
    const L = this.level;
    Textures.createAll(this);
    this.createAnims();

    this.physics.world.setBounds(0, 0, L.width, 700);
    this.physics.world.setBoundsCollision(true, true, true, false);

    drawBeachBackground(this, L.width);
    this.buildWorld();
    this.createPlayer();
    this.createEnemies();
    this.createItems();
    this.createColliders();

    const cam = this.cameras.main;
    cam.setBounds(0, 0, L.width, 540);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.fadeIn(400);

    this.keys = this.input.keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN',
      jump: 'SPACE', shoot: 'X', a: 'A', d: 'D', w: 'W'
    });

    UI.setLevelName(L);
    UI.show('hud');
    UI.bossBar(null);
    this.refreshHud();
    this.time.delayedCall(500, () => this.speech('Bolt', L.intro.en, L.intro.pt, 4500));

    this.events.once('shutdown', () => { UI.hideDialog(); UI.bossBar(null); });
  }

  createAnims() {
    if (this.anims.exists('walk')) return;
    this.anims.create({ key: 'walk', frames: [{ key: 'robot_walk1' }, { key: 'robot_idle' }, { key: 'robot_walk2' }, { key: 'robot_idle' }], frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'crabwalk', frames: [{ key: 'crab1' }, { key: 'crab2' }], frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'kingwalk', frames: [{ key: 'kingcrab1' }, { key: 'kingcrab2' }], frameRate: 5, repeat: -1 });
  }

  // ---------- Montagem do mundo ----------
  buildWorld() {
    const L = this.level;
    this.solids = this.physics.add.staticGroup();
    this.oneWay = this.physics.add.staticGroup();

    // água nos buracos
    this.waters = [];
    for (let i = 0; i < L.ground.length - 1; i++) {
      const x0 = L.ground[i][1], x1 = L.ground[i + 1][0];
      this.waters.push(this.add.tileSprite(x0 - 10, GROUND_Y + 24, x1 - x0 + 20, 60, 'water').setOrigin(0, 0).setDepth(2));
    }

    L.ground.forEach(([x0, x1]) => {
      const t = this.add.tileSprite(x0, GROUND_Y, x1 - x0, 80, 'ground_beach').setOrigin(0, 0).setDepth(1);
      this.solids.add(t);
    });

    L.platforms.forEach(([x, y, w]) => {
      const p = this.add.tileSprite(x, y, w, 20, 'plank').setOrigin(0, 0).setDepth(1);
      this.oneWay.add(p);
      p.body.checkCollision.down = false;
      p.body.checkCollision.left = false;
      p.body.checkCollision.right = false;
    });

    // decoração: coqueiros, conchas e pedras
    for (let x = 140; x < L.width; x += 430 + (x % 3) * 60) {
      if (this.onGround(x)) this.add.image(x, GROUND_Y + 6, 'palm').setOrigin(0.5, 1).setDepth(-5).setFlipX(x % 2 === 0);
    }
    for (let x = 90; x < L.width; x += 170 + (x % 7) * 20) {
      if (this.onGround(x)) this.add.image(x, GROUND_Y + 2, x % 3 ? 'shell' : 'rock').setOrigin(0.5, 1).setDepth(0);
    }

    // placas
    this.signs = L.signs.map(s => {
      const img = this.add.image(s.x, GROUND_Y, 'sign').setOrigin(0.5, 1).setDepth(0);
      return Object.assign({ img }, s);
    });

    // checkpoints
    this.flags = L.checkpoints.map(x => ({ x, img: this.add.image(x, GROUND_Y, 'flag_off').setOrigin(0.15, 1).setDepth(0), on: false }));
  }

  onGround(x) { return this.level.ground.some(([a, b]) => x > a + 30 && x < b - 30); }

  createPlayer() {
    this.player = this.physics.add.sprite(this.level.startX, GROUND_Y - 40, 'robot_idle').setDepth(10);
    this.player.body.setSize(26, 44).setOffset(11, 11);
    this.player.setCollideWorldBounds(true);
    this.player.body.setMaxVelocityY(900);

    this.bullets = this.physics.add.group({ allowGravity: false });
    this.particles = this.add.particles(0, 0, 'spark', {
      speed: { min: 80, max: 220 }, lifespan: 500, scale: { start: 0.8, end: 0 },
      emitting: false, tint: [0xffd600, 0xffffff, 0x4dd0e1]
    }).setDepth(20);
  }

  createEnemies() {
    this.enemies = this.physics.add.group();
    this.level.enemies.forEach(e => {
      const c = this.enemies.create(e.x, GROUND_Y - 20, 'crab1');
      c.body.setSize(34, 22).setOffset(5, 11);
      c.setData({ min: e.min, max: e.max, dir: Math.random() < 0.5 ? -1 : 1, speed: 55 + Math.random() * 25 });
      c.play('crabwalk');
      c.setDepth(5);
    });
  }

  createItems() {
    const L = this.level;
    this.coins = this.physics.add.staticGroup();
    L.coins.forEach(row => {
      for (let i = 0; i < row.n; i++) {
        const c = this.coins.create(row.x + i * row.dx, row.y, 'coin').setDepth(4);
        this.tweens.add({ targets: c, scaleX: 0.2, duration: 500, yoyo: true, repeat: -1, delay: i * 90, ease: 'Sine.easeInOut' });
      }
    });

    this.chests = this.physics.add.staticGroup();
    L.chests.forEach(ch => {
      const c = this.chests.create(ch.x, GROUND_Y - 21, 'chest').setDepth(3);
      c.setData({ reward: ch.reward, open: false, wait: 0 });
    });

    this.doors = this.physics.add.staticGroup();
    L.doors.forEach(d => {
      const door = this.doors.create(d.x, GROUND_Y - 65, 'door').setDepth(3);
      door.setData({ word: d.word, wait: 0 });
      this.tweens.add({ targets: door, alpha: 0.85, duration: 700, yoyo: true, repeat: -1 });
    });
  }

  createColliders() {
    const P = this.player;
    this.physics.add.collider(P, this.solids);
    this.physics.add.collider(P, this.oneWay);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.enemies, this.oneWay);
    this.physics.add.collider(P, this.doors, (p, door) => this.touchDoor(door));
    this.physics.add.collider(this.enemies, this.doors);

    this.physics.add.overlap(P, this.coins, (p, coin) => this.collectCoin(coin));
    this.physics.add.overlap(P, this.chests, (p, chest) => this.touchChest(chest));
    this.physics.add.overlap(P, this.enemies, (p, enemy) => this.touchEnemy(enemy));

    this.physics.add.overlap(this.bullets, this.enemies, (b, enemy) => { b.destroy(); this.killEnemy(enemy); });
    this.physics.add.collider(this.bullets, this.solids, b => b.destroy());
    this.physics.add.collider(this.bullets, this.doors, b => b.destroy());
  }

  // ---------- Loop principal ----------
  update(time, delta) {
    this.now = time;
    this.waters.forEach(w => { w.tilePositionX += delta * 0.03; });
    if (this.frozen || this.ended) return;

    this.updatePlayer(time, delta);
    this.updateEnemies();
    this.updateBullets();
    this.updateSigns();
    this.updateCheckpoints();
    if (this.boss) this.updateBoss(time);
    else if (!this.bossStarted && this.player.x > this.level.boss.arenaX + 200) this.startBoss();
  }

  updatePlayer(time, delta) {
    const p = this.player, k = this.keys, body = p.body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) this.lastGround = time;

    const dir = ((k.right.isDown || k.d.isDown) ? 1 : 0) - ((k.left.isDown || k.a.isDown) ? 1 : 0);
    if (dir !== 0) this.facing = dir;
    // aceleração suave (independe do FPS)
    const rate = onGround ? 0.28 : 0.14;
    const f = 1 - Math.pow(1 - rate, delta / 16.67);
    p.setVelocityX(body.velocity.x + (dir * SPEED - body.velocity.x) * f);

    // pulo com "coyote time" e buffer: fica mais fácil acertar o pulo
    const jumpPressed = Phaser.Input.Keyboard.JustDown(k.jump) || Phaser.Input.Keyboard.JustDown(k.up) || Phaser.Input.Keyboard.JustDown(k.w);
    const jumpDown = k.jump.isDown || k.up.isDown || k.w.isDown;
    if (jumpPressed) this.jumpBuffer = time;
    if (this.jumpBuffer && time - this.jumpBuffer < 130 && time - this.lastGround < 110) {
      p.setVelocityY(-JUMP);
      this.jumpBuffer = 0;
      this.lastGround = -1000;
      this.jumpHeld = true;
      Sound.play('jump');
    }
    // soltou o botão cedo = pulo mais baixo
    if (this.jumpHeld && !jumpDown && body.velocity.y < -150) {
      p.setVelocityY(body.velocity.y * 0.45);
      this.jumpHeld = false;
    }
    if (body.velocity.y >= 0) this.jumpHeld = false;

    p.setFlipX(this.facing < 0);
    if (!onGround) { p.anims.stop(); p.setTexture('robot_jump'); }
    else if (Math.abs(body.velocity.x) > 40) { if (!p.anims.isPlaying) p.play('walk'); }
    else { p.anims.stop(); p.setTexture('robot_idle'); }

    if (Phaser.Input.Keyboard.JustDown(k.shoot)) this.shoot();

    // caiu na água
    if (p.y > 600) this.fallInWater();
  }

  shoot() {
    if (this.now < this.nextShot) return;
    if (this.state.ammo <= 0) {
      Sound.play('wrong');
      this.speech('Bolt', 'No energy! Open a chest to get more.', 'Sem energia! Abra um baú para ganhar mais.', 2500);
      this.nextShot = this.now + 600;
      return;
    }
    this.state.ammo--;
    this.nextShot = this.now + 250;
    const b = this.bullets.create(this.player.x + this.facing * 22, this.player.y + 6, 'bullet').setDepth(9);
    b.setVelocityX(this.facing * 560);
    b.setData('born', this.now);
    Sound.play('shoot');
    this.refreshHud();
  }

  updateBullets() {
    this.bullets.getChildren().slice().forEach(b => {
      if (this.now - b.getData('born') > 1100) b.destroy();
    });
  }

  updateEnemies() {
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.getData('dead')) return;
      let d = e.getData('dir');
      if (e.x < e.getData('min') || e.body.blocked.left) d = 1;
      if (e.x > e.getData('max') || e.body.blocked.right) d = -1;
      e.setData('dir', d);
      e.setVelocityX(d * e.getData('speed'));
      if (e.y > 650) e.destroy();
    });
  }

  updateSigns() {
    if (this.now < this.speechUntil) return;
    const p = this.player;
    const near = this.signs.find(s => Math.abs(s.x - p.x) < 70 && p.y > GROUND_Y - 200);
    if (near) {
      if (UI.dialogOwner !== near) UI.showDialog('📜 Sign', near.en, near.pt, near);
    } else if (UI.dialogOwner && UI.dialogOwner !== 'speech') {
      UI.hideDialog();
    }
  }

  updateCheckpoints() {
    this.flags.forEach(f => {
      if (!f.on && this.player.x > f.x) {
        f.on = true;
        f.img.setTexture('flag_on');
        this.respawnX = f.x + 30;
        Sound.play('checkpoint');
        this.particles.explode(12, f.x + 20, GROUND_Y - 60);
      }
    });
  }

  speech(who, en, pt, ms) {
    UI.showDialog(who, en, pt, 'speech');
    this.speechUntil = this.now + ms;
    if (this.speechTimer) this.speechTimer.remove();
    this.speechTimer = this.time.delayedCall(ms, () => UI.hideDialog('speech'));
  }

  refreshHud() { UI.updateHud(this.state); }

  addScore(n, x, y) {
    this.state.score += n;
    this.refreshHud();
    if (x !== undefined) {
      const t = this.add.text(x, y, `+${n}`, { fontFamily: 'Fredoka, Arial', fontSize: '20px', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 4 })
        .setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    }
  }

  // ---------- Itens e inimigos ----------
  collectCoin(coin) {
    coin.disableBody(true, true);
    this.state.coins++;
    Sound.play('coin');
    this.addScore(10);
    if (this.state.coins % 25 === 0 && this.state.lives < MAX_LIVES) {
      this.state.lives++;
      Sound.play('powerup');
      this.speech('Bolt', '25 coins! I got an extra life!', '25 moedas! Ganhei uma vida extra!', 2500);
      this.refreshHud();
    }
  }

  touchEnemy(enemy) {
    if (enemy.getData('dead')) return;
    const p = this.player;
    const stomp = p.body.velocity.y > 40 && p.body.bottom <= enemy.body.top + 14;
    if (stomp) {
      this.killEnemy(enemy, true);
      p.setVelocityY(-420);
      this.jumpHeld = this.keys.jump.isDown;
    } else {
      this.hurt(enemy.x);
    }
  }

  killEnemy(enemy, stomped) {
    if (enemy.getData('dead')) return;
    enemy.setData('dead', true);
    enemy.body.enable = false;
    enemy.anims.stop();
    Sound.play(stomped ? 'stomp' : 'enemy');
    this.particles.explode(10, enemy.x, enemy.y);
    this.addScore(50, enemy.x, enemy.y - 20);
    this.tweens.add({
      targets: enemy, scaleY: stomped ? 0.2 : 1, angle: stomped ? 0 : 180, alpha: 0, y: enemy.y + (stomped ? 10 : -30),
      duration: 400, onComplete: () => enemy.destroy()
    });
  }

  hurt(fromX) {
    if (this.now < this.invulnUntil || this.ended) return;
    this.state.lives--;
    this.refreshHud();
    Sound.play('hurt');
    this.cameras.main.shake(200, 0.008);
    if (this.state.lives <= 0) { this.gameOver(); return; }
    this.invulnUntil = this.now + 1500;
    const dir = this.player.x < fromX ? -1 : 1;
    this.player.setVelocity(dir * 300, -320);
    this.blink();
  }

  blink() {
    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 100, yoyo: true, repeat: 6, onComplete: () => this.player.setAlpha(1) });
  }

  fallInWater() {
    this.state.lives--;
    this.refreshHud();
    Sound.play('hurt');
    if (this.state.lives <= 0) { this.gameOver(); return; }
    // volta para o último checkpoint (ou para a entrada da arena do chefão)
    const x = this.bossStarted ? this.level.boss.arenaX + 100 : this.respawnX;
    this.player.setPosition(x, GROUND_Y - 80);
    this.player.setVelocity(0, 0);
    this.invulnUntil = this.now + 1500;
    this.blink();
    this.speech('Bolt', 'Splash! Robots don\'t like water!', 'Tchibum! Robôs não gostam de água!', 2200);
  }

  // ---------- Perguntas ----------
  freeze() {
    this.frozen = true;
    this.physics.pause();
    this.anims.pauseAll();
    this.tweens.pauseAll();
    this.time.paused = true;
  }

  unfreeze() {
    this.frozen = false;
    this.physics.resume();
    this.anims.resumeAll();
    this.tweens.resumeAll();
    this.time.paused = false;
    this.input.keyboard.resetKeys();
    this.jumpBuffer = 0;
  }

  ask(q, opts, cb) {
    this.freeze();
    this.state.asked++;
    UI.hideDialog();
    UI.ask(q, opts, correct => {
      if (correct) this.state.right++;
      this.unfreeze();
      cb(correct);
    });
  }

  touchChest(chest) {
    if (chest.getData('open') || this.now < chest.getData('wait') || this.frozen) return;
    let reward = chest.getData('reward');
    if (reward === 'life' && this.state.lives >= MAX_LIVES) reward = 'ammo';
    const q = makeMathQuestion(this.level.id);
    const rewardText = reward === 'life' ? '+1 ❤ life!' : '+5 ⚡ energy!';
    const rewardTextPt = reward === 'life' ? '+1 vida!' : '+5 de energia!';
    this.ask(q, { title: '🧰 Treasure Chest!', rewardText, rewardTextPt }, correct => {
      if (correct) {
        chest.setData('open', true);
        chest.setTexture('chest_open');
        Sound.play('open');
        this.particles.explode(20, chest.x, chest.y - 10);
        if (reward === 'life') this.state.lives++;
        else this.state.ammo += 5;
        this.addScore(100, chest.x, chest.y - 40);
      } else {
        // tenta de novo depois, com outra conta
        chest.setData('wait', this.now + 2500);
        this.tweens.add({ targets: chest, x: chest.x + 4, duration: 50, yoyo: true, repeat: 5 });
        this.speech('Bolt', 'Let\'s try again in a moment!', 'Vamos tentar de novo daqui a pouco!', 2200);
      }
      this.refreshHud();
    });
  }

  touchDoor(door) {
    if (this.now < door.getData('wait') || this.frozen || door.getData('open')) return;
    const q = makeEnglishQuestion(this.level.id, door.getData('word'));
    this.ask(q, { title: '🚪 Magic Door', rewardText: 'The door is open!', rewardTextPt: 'A porta abriu!' }, correct => {
      if (correct) {
        door.setData('open', true);
        door.disableBody(false, false);
        this.tweens.killTweensOf(door);
        Sound.play('open');
        this.particles.explode(25, door.x, door.y);
        this.tweens.add({ targets: door, y: door.y - 140, alpha: 0, duration: 900, ease: 'Sine.easeIn', onComplete: () => door.destroy() });
        this.addScore(100, door.x, door.y - 80);
      } else {
        door.setData('wait', this.now + 1500);
        this.player.setVelocityX(-200);
        this.speech('Magic Door', 'Look again and try one more time!', 'Olhe de novo e tente mais uma vez!', 2200);
      }
    });
  }

  // ---------- Chefão ----------
  startBoss() {
    const B = this.level.boss;
    this.bossStarted = true;
    const cam = this.cameras.main;
    this.physics.world.setBounds(B.arenaX, 0, 960, 700);
    this.physics.world.setBoundsCollision(true, true, true, false);
    cam.stopFollow();
    cam.pan(B.arenaX + 480, 270, 700, 'Sine.easeInOut', false, (c, progress) => {
      if (progress === 1) {
        cam.setBounds(B.arenaX, 0, 960, 540);
        cam.startFollow(this.player, true, 0.12, 0.12);
      }
    });

    const boss = this.physics.add.sprite(B.x, -120, 'kingcrab1').setDepth(6);
    boss.body.setSize(120, 72).setOffset(15, 56);
    boss.setCollideWorldBounds(true);
    boss.hp = B.hp;
    boss.maxHp = B.hp;
    boss.state = 'intro';
    boss.invulnUntil = 0;
    boss.nextAction = 0;
    this.boss = boss;
    this.bubbles = this.physics.add.group({ allowGravity: false });

    this.physics.add.collider(boss, this.solids);
    this.physics.add.overlap(this.player, boss, () => this.touchBoss());
    this.physics.add.overlap(this.bullets, boss, (a, b) => {
      // o Phaser pode passar os objetos em qualquer ordem
      (a === boss ? b : a).destroy();
      this.hitBoss();
    });
    this.physics.add.overlap(this.player, this.bubbles, (p, bub) => { this.popBubble(bub); this.hurt(bub.x); });
    this.physics.add.overlap(this.bullets, this.bubbles, (b, bub) => { b.destroy(); this.popBubble(bub); this.addScore(10, bub.x, bub.y); });

    UI.bossBar(B.name, 1);
    Sound.play('boss');
  }

  updateBoss(time) {
    const boss = this.boss, p = this.player;
    if (!boss.active || boss.state === 'dead') return;
    const onGround = boss.body.blocked.down;

    if (boss.state === 'intro') {
      if (onGround) {
        boss.state = 'talk';
        this.cameras.main.shake(300, 0.01);
        Sound.play('stomp');
        this.speech('👑 ' + this.level.boss.name, this.level.boss.intro.en, this.level.boss.intro.pt, 3500);
        boss.nextAction = time + 3000;
      }
      return;
    }
    if (boss.state === 'talk') {
      if (time > boss.nextAction) { boss.state = 'walk'; boss.play('kingwalk'); boss.nextAction = time + 1500; }
      return;
    }

    // segurança: nunca deixa o chefão atravessar o chão
    if (boss.body.bottom > GROUND_Y + 30) { boss.setY(GROUND_Y - 63); boss.setVelocityY(0); }

    const toPlayer = p.x < boss.x ? -1 : 1;
    const anger = boss.maxHp - boss.hp; // fica mais rápido a cada acerto
    if (boss.state === 'walk') {
      boss.setVelocityX(toPlayer * (70 + anger * 25));
      if (time > boss.nextAction) {
        if (Math.random() < 0.5) {
          boss.state = 'jump';
          boss.setVelocity(toPlayer * 180, -620);
          boss.anims.stop();
        } else {
          boss.state = 'shoot';
          boss.setVelocityX(0);
          // aviso: pisca laranja antes de cuspir bolhas
          boss.setTint(0xffb74d);
          this.time.delayedCall(400, () => boss.state !== 'dead' && boss.clearTint());
          this.time.delayedCall(450, () => this.bossShoot(1 + (anger > 0 ? 1 : 0)));
          this.time.delayedCall(900, () => { if (boss.state === 'shoot') { boss.state = 'walk'; boss.nextAction = this.now + 1800 - anger * 250; } });
        }
      }
    } else if (boss.state === 'jump') {
      if (onGround && boss.body.velocity.y >= 0 && time > boss.nextAction + 300) {
        boss.state = 'walk';
        boss.play('kingwalk');
        boss.nextAction = time + 1800 - anger * 250;
        this.cameras.main.shake(200, 0.008);
        Sound.play('stomp');
        this.particles.explode(14, boss.x, GROUND_Y - 4);
      }
    }
    // pisca enquanto está invencível
    boss.setAlpha(time < boss.invulnUntil ? (Math.floor(time / 100) % 2 ? 0.5 : 1) : 1);
  }

  bossShoot(count) {
    const boss = this.boss;
    if (!boss || boss.state === 'dead' || this.ended) return;
    Sound.play('bubble');
    const dir = this.player.x < boss.x ? -1 : 1;
    for (let i = 0; i < count; i++) {
      // bolha baixa: pule! / bolha alta: fique no chão!
      const high = i === 1 || (count === 1 && Math.random() < 0.3);
      const b = this.bubbles.create(boss.x + dir * 60, high ? GROUND_Y - 95 : GROUND_Y - 22, 'bubble').setDepth(7);
      b.setVelocityX(dir * (high ? 170 : 220));
      b.body.setCircle(11, 2, 2);
      this.time.delayedCall(5000, () => b.active && b.destroy());
    }
  }

  popBubble(b) {
    if (!b.active) return;
    this.particles.explode(6, b.x, b.y);
    Sound.play('bubble');
    b.destroy();
  }

  touchBoss() {
    const boss = this.boss, p = this.player;
    if (boss.state === 'dead' || boss.state === 'intro' || this.frozen) return;
    const stomp = p.body.velocity.y > 40 && p.body.bottom <= boss.body.top + 24;
    if (stomp) {
      p.setVelocityY(-520);
      this.hitBoss();
    } else if (this.now >= boss.invulnUntil) {
      this.hurt(boss.x);
    }
  }

  // Acertou o chefão: ele fica tonto e aparece uma conta. Só perde vida se acertar a conta!
  hitBoss() {
    const boss = this.boss;
    if (this.now < boss.invulnUntil || boss.state === 'dead' || boss.state === 'talk' || this.frozen) return;
    boss.invulnUntil = this.now + 99999;
    boss.setVelocityX(0);
    boss.setTint(0xffffff);
    Sound.play('bossHit');
    this.particles.explode(16, boss.x, boss.y);
    this.time.delayedCall(250, () => {
      boss.clearTint();
      const q = makeMathQuestion(this.level.id, true);
      this.ask(q, { title: '👑 Boss Battle!', rewardText: 'The boss is hurt!', rewardTextPt: 'O chefão se machucou!' }, correct => {
        // afasta o robô do chefão para não encostar logo depois
        const away = this.player.x < boss.x ? -1 : 1;
        this.player.setVelocity(away * 280, -300);
        this.invulnUntil = this.now + 1500;
        boss.invulnUntil = this.now + 1800;
        if (correct) {
          boss.hp--;
          UI.bossBar(this.level.boss.name, boss.hp / boss.maxHp);
          this.addScore(200, boss.x, boss.y - 70);
          Sound.play('bossHit');
          this.cameras.main.shake(250, 0.012);
          boss.setTintFill(0xff5252);
          this.time.delayedCall(200, () => boss.clearTint());
          if (boss.hp <= 0) { this.defeatBoss(); return; }
          boss.setVelocity(-away * 200, -300);
          boss.state = 'jump';
          boss.nextAction = this.now;
        } else {
          this.speech('👑 ' + this.level.boss.name, 'Ha ha! Wrong answer! Try again!', 'Rá rá! Resposta errada! Tente de novo!', 2200);
          boss.state = 'walk';
          boss.nextAction = this.now + 1500;
        }
      });
    });
  }

  defeatBoss() {
    const boss = this.boss;
    boss.state = 'dead';
    boss.anims.stop();
    boss.body.enable = false;
    this.bubbles.clear(true, true);
    UI.bossBar(null);
    this.addScore(500, boss.x, boss.y - 100);
    this.speech('👑 ' + this.level.boss.name, this.level.boss.defeat.en, this.level.boss.defeat.pt, 4000);
    this.particles.explode(40, boss.x, boss.y);
    this.tweens.add({ targets: boss, angle: 360, scale: 0.2, alpha: 0, y: boss.y - 60, duration: 1200, ease: 'Sine.easeIn' });

    // o chefão deixa um pedaço do mapa do tesouro
    const piece = this.physics.add.staticImage(boss.x, GROUND_Y - 30, 'mappiece').setDepth(8).setScale(0.1);
    this.tweens.add({
      targets: piece, scale: 1.3, duration: 700, delay: 900, ease: 'Back.easeOut',
      onComplete: () => this.tweens.add({ targets: piece, y: piece.y - 12, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    });
    this.time.delayedCall(1600, () => {
      this.physics.add.overlap(this.player, piece, () => { piece.destroy(); this.levelComplete(); });
    });
  }

  // ---------- Fim de fase ----------
  levelComplete() {
    if (this.ended) return;
    this.ended = true;
    Sound.play('win');
    this.particles.explode(50, this.player.x, this.player.y);
    this.player.setVelocity(0, -300);
    this.addScore(this.state.lives * 100);
    const save = Save.completeLevel(this.level.id, this.state.score);
    this.time.delayedCall(1200, () => {
      this.physics.pause();
      Game.showLevelComplete(this.level, this.state, save);
    });
  }

  gameOver() {
    this.ended = true;
    this.player.setTint(0x555555);
    this.player.setVelocity(0, -400);
    this.player.body.checkCollision.none = true;
    this.time.delayedCall(1200, () => {
      this.physics.pause();
      Game.showGameOver();
    });
  }
}
