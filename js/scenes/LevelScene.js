// Cena principal de uma fase: plataformas, inimigos, baús, portas e chefão.
const SPEED = 260;
const JUMP = 640;
const MAX_LIVES = 5;
const MUSHROOM_JUMP = 900;

// Configuração de cada chefão: textura, corpo físico, velocidade e ataques
const BOSS_TYPES = {
  kingCrab: { tex: 'kingcrab', size: [120, 72], offset: [15, 56], speed: 70, attacks: ['jump', 'bubbles'] },
  gorilla:  { tex: 'gorilla',  size: [110, 112], offset: [20, 26], speed: 80, attacks: ['pound', 'throw', 'charge'] }
};

class LevelScene extends Phaser.Scene {
  constructor() { super('Level'); }

  init(data) {
    this.level = LEVELS[data.level - 1];
    this.save = Save.load();
    this.weapon = this.save.weapons.equipped;
    if (!this.save.weapons.owned.includes(this.weapon)) this.weapon = 'blaster';
    this.state = { lives: 3, ammo: startingAmmo(this.save), coins: 0, score: 0, right: 0, asked: 0 };
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
    this.boss = null;
    this.bossStarted = false;
    this.speechUntil = 0;
  }

  create() {
    const L = this.level;
    this.theme = THEMES[L.theme];
    Textures.createAll(this);
    this.createAnims();

    this.physics.world.setBounds(0, 0, L.width, 700);
    this.physics.world.setBoundsCollision(true, true, true, false);

    this.theme.background(this, L.width);
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
      jump: 'SPACE', shoot: 'X', swap: 'C', a: 'A', d: 'D', w: 'W'
    });

    UI.setLevelName(L);
    UI.show('hud');
    UI.show('touch-controls');
    UI.setSwitchVisible(this.save.weapons.owned.length > 1);
    Touch.reset();
    UI.bossBar(null);
    this.refreshHud();
    this.time.delayedCall(500, () => this.speech('Bolt', L.intro.en, L.intro.pt, 4500));

    this.events.once('shutdown', () => { UI.hideDialog(); UI.bossBar(null); UI.hide('touch-controls'); Speech.stop(); });
  }

  createAnims() {
    if (this.anims.exists('walk')) return;
    const pair = (key, a, b, rate) => this.anims.create({ key, frames: [{ key: a }, { key: b }], frameRate: rate, repeat: -1 });
    this.anims.create({ key: 'walk', frames: [{ key: 'robot_walk1' }, { key: 'robot_idle' }, { key: 'robot_walk2' }, { key: 'robot_idle' }], frameRate: 12, repeat: -1 });
    pair('crabwalk', 'crab1', 'crab2', 6);
    pair('beetlewalk', 'beetle1', 'beetle2', 7);
    pair('batfly', 'bat1', 'bat2', 8);
    pair('kingcrabwalk', 'kingcrab1', 'kingcrab2', 5);
    pair('gorillawalk', 'gorilla1', 'gorilla2', 4);
  }

  // ---------- Montagem do mundo ----------
  buildWorld() {
    const L = this.level, T = this.theme;
    this.solids = this.physics.add.staticGroup();
    this.oneWay = this.physics.add.staticGroup();

    // água/pântano nos buracos (balança de leve)
    for (let i = 0; i < L.ground.length - 1; i++) {
      const x0 = L.ground[i][1], x1 = L.ground[i + 1][0];
      const tiles = this.tileRow(x0 - 30, GROUND_Y + 24, x1 - x0 + 60, T.water, 2);
      this.tweens.add({ targets: tiles, x: '+=12', duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    L.ground.forEach(([x0, x1]) => {
      this.tileRow(x0, GROUND_Y, x1 - x0, T.ground, 1);
      this.solids.add(this.add.zone(x0, GROUND_Y, x1 - x0, 80).setOrigin(0, 0));
    });

    L.platforms.forEach(([x, y, w]) => {
      this.tileRow(x, y, w, T.platform, 1);
      const p = this.add.zone(x, y, w, 20).setOrigin(0, 0);
      this.oneWay.add(p);
      this.makeOneWay(p.body);
    });

    // troncos que se movem
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
    (L.movers || []).forEach(m => {
      const log = this.movers.create(m.x + 64, m.y + 12, 'log').setDepth(2);
      this.makeOneWay(log.body);
      const start = m.axis === 'x' ? log.x : log.y;
      const end = m.axis === 'x' ? start + m.range : start - m.range;
      log.setData({ axis: m.axis, min: Math.min(start, end), max: Math.max(start, end), speed: m.speed });
      if (m.axis === 'x') log.setVelocityX(m.speed); else log.setVelocityY(-m.speed);
    });

    // cogumelos-trampolim
    this.mushrooms = this.physics.add.staticGroup();
    (L.mushrooms || []).forEach(x => this.mushrooms.create(x, GROUND_Y - 26, 'mushroom').setDepth(3));

    T.decorate(this, L);

    this.signs = L.signs.map(s => {
      const img = this.add.image(s.x, GROUND_Y, 'sign').setOrigin(0.5, 1).setDepth(0);
      return Object.assign({ img }, s);
    });

    this.flags = L.checkpoints.map(x => ({ x, img: this.add.image(x, GROUND_Y, 'flag_off').setOrigin(0.15, 1).setDepth(0), on: false }));
  }

  // plataforma "atravessável": dá para subir por baixo
  makeOneWay(body) {
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
  }

  // Repete uma imagem lado a lado. (Não usamos TileSprite: no celular ele some
  // quando o app vai para segundo plano e o navegador libera a memória gráfica.)
  tileRow(x, y, w, key, depth) {
    const tw = this.textures.get(key).getSourceImage().width;
    const tiles = [];
    for (let tx = x; tx < x + w; tx += tw) {
      const img = this.add.image(tx, y, key).setOrigin(0, 0).setDepth(depth);
      if (tx + tw > x + w) img.setCrop(0, 0, x + w - tx, img.height);
      tiles.push(img);
    }
    return tiles;
  }

  onGround(x) { return this.level.ground.some(([a, b]) => x > a + 30 && x < b - 30); }

  createPlayer() {
    this.player = this.physics.add.sprite(this.level.startX, GROUND_Y - 40, 'robot_idle').setDepth(10);
    this.player.body.setSize(26, 44).setOffset(11, 11);
    this.player.setCollideWorldBounds(true);
    this.player.body.setMaxVelocityY(950);

    this.bullets = this.physics.add.group({ allowGravity: false });
    this.particles = this.add.particles(0, 0, 'spark', {
      speed: { min: 80, max: 220 }, lifespan: 500, scale: { start: 0.8, end: 0 },
      emitting: false, tint: [0xffd600, 0xffffff, 0x4dd0e1]
    }).setDepth(20);
  }

  // ---------- Inimigos ----------
  createEnemies() {
    this.enemies = this.physics.add.group();
    this.hazards = this.physics.add.group({ allowGravity: false }); // cocos, bolhas, ondas de choque
    this.threads = this.add.graphics().setDepth(4);                 // fios das aranhas

    this.level.enemies.forEach(e => {
      const type = e.type || 'crab';
      let s;
      if (type === 'crab' || type === 'beetle') {
        s = this.enemies.create(e.x, GROUND_Y - 20, type + '1');
        if (type === 'crab') s.body.setSize(34, 22).setOffset(5, 11);
        else s.body.setSize(34, 20).setOffset(3, 7);
        s.setData({ min: e.min, max: e.max, dir: Math.random() < 0.5 ? -1 : 1, speed: 55 + Math.random() * 25 });
        s.play(type + 'walk');
      } else if (type === 'bat') {
        s = this.enemies.create(e.x, e.y, 'bat1');
        s.body.setAllowGravity(false);
        s.body.setSize(30, 18).setOffset(9, 6);
        s.setData({ flying: true, min: e.min, max: e.max, baseY: e.y, dir: -1, speed: 90, phase: Math.random() * 6 });
        s.play('batfly');
      } else if (type === 'spider') {
        s = this.enemies.create(e.x, e.top, 'spider');
        s.body.setAllowGravity(false);
        s.body.setSize(26, 22).setOffset(9, 7);
        s.setData({ flying: true, top: e.top, bottom: GROUND_Y - 24, phase: Math.random() * 6 });
      } else if (type === 'monkey') {
        s = this.enemies.create(e.x, GROUND_Y - 24, 'monkey1');
        s.body.setSize(28, 40).setOffset(9, 8);
        s.setData({ nextThrow: 1500 + Math.random() * 1000 });
      }
      s.setData('type', type);
      s.setData('hp', ENEMY_HP[type] || 1);
      s.setDepth(5);
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
      door.setData({ word: d.word, sentence: !!d.sentence, wait: 0 });
      this.tweens.add({ targets: door, alpha: 0.85, duration: 700, yoyo: true, repeat: -1 });
    });
  }

  createColliders() {
    const P = this.player;
    const walker = e => !e.getData('flying');
    this.physics.add.collider(P, this.solids);
    this.physics.add.collider(P, this.oneWay);
    this.physics.add.collider(P, this.movers);
    this.physics.add.collider(P, this.mushrooms, (p, m) => this.bounceMushroom(m));
    this.physics.add.collider(this.enemies, this.solids, null, walker);
    this.physics.add.collider(this.enemies, this.oneWay, null, walker);
    this.physics.add.collider(this.enemies, this.mushrooms, null, walker);
    this.physics.add.collider(P, this.doors, (p, door) => this.touchDoor(door));
    this.physics.add.collider(this.enemies, this.doors, null, walker);

    this.physics.add.overlap(P, this.coins, (p, coin) => this.collectCoin(coin));
    this.physics.add.overlap(P, this.chests, (p, chest) => this.touchChest(chest));
    this.physics.add.overlap(P, this.enemies, (p, enemy) => this.touchEnemy(enemy));

    this.physics.add.overlap(this.bullets, this.enemies, (b, enemy) => this.bulletHitsEnemy(b, enemy));
    this.physics.add.collider(this.bullets, this.solids, b => b.destroy());
    this.physics.add.collider(this.bullets, this.doors, b => b.destroy());

    // perigos: cocos quebram no chão; bolhas e ondas de choque atravessam
    this.physics.add.collider(this.hazards, this.solids, h => this.popHazard(h), h => h.getData('breaks'));
    this.physics.add.overlap(P, this.hazards, (p, h) => { if (!h.active) return; this.popHazard(h); this.hurt(h.x); });
    this.physics.add.overlap(this.bullets, this.hazards, (b, h) => {
      if (!h.active) return;
      b.destroy(); this.popHazard(h); this.addScore(10, h.x, h.y);
    });
  }

  // ---------- Loop principal ----------
  update(time, delta) {
    this.now = time;
    if (this.frozen || this.ended) return;

    this.updatePlayer(time, delta);
    this.updateEnemies(time);
    this.updateMovers();
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

    const dir = ((k.right.isDown || k.d.isDown || Touch.right) ? 1 : 0) - ((k.left.isDown || k.a.isDown || Touch.left) ? 1 : 0);
    if (dir !== 0) this.facing = dir;
    // aceleração suave (independe do FPS)
    const rate = onGround ? 0.28 : 0.14;
    const f = 1 - Math.pow(1 - rate, delta / 16.67);
    p.setVelocityX(body.velocity.x + (dir * SPEED - body.velocity.x) * f);

    // pulo com "coyote time" e buffer: fica mais fácil acertar o pulo
    const JD = Phaser.Input.Keyboard.JustDown;
    const jumpPressed = JD(k.jump) || JD(k.up) || JD(k.w) || Touch.consume('jump');
    const jumpDown = k.jump.isDown || k.up.isDown || k.w.isDown || Touch.jump;
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

    if (JD(k.shoot) || Touch.consume('shoot')) this.shoot();
    if (JD(k.swap) || Touch.consume('switch') || UI.consumeSwitch()) this.switchWeapon();

    if (p.y > 600) this.fallInWater();
  }

  // ---------- Armas ----------
  shoot() {
    if (this.now < this.nextShot) return;
    const W = WEAPONS[this.weapon];
    const stats = W.levels[this.save.weapons.power[this.weapon] - 1];
    if (this.state.ammo < W.ammo) {
      Sound.play('wrong');
      this.speech('Bolt', 'No energy! Open a chest to get more.', 'Sem energia! Abra um baú para ganhar mais.', 2500);
      this.nextShot = this.now + 600;
      return;
    }
    this.state.ammo -= W.ammo;
    this.nextShot = this.now + W.cooldown;
    W.angles.forEach(deg => {
      const a = Phaser.Math.DegToRad(deg);
      const b = this.bullets.create(this.player.x + this.facing * 22, this.player.y + 6, W.texture).setDepth(9).setScale(stats.scale);
      b.setVelocity(Math.cos(a) * stats.speed * this.facing, Math.sin(a) * stats.speed);
      b.setData({ born: this.now, dmg: stats.dmg, pierce: stats.pierce, hit: new Set() });
    });
    Sound.play('shoot');
    this.refreshHud();
  }

  switchWeapon() {
    const owned = this.save.weapons.owned;
    if (owned.length < 2) {
      this.speech('Bolt', 'I only have the Blaster. I can buy more weapons in the Workshop!', 'Eu só tenho o Blaster. Posso comprar mais armas na Oficina!', 3000);
      return;
    }
    this.weapon = owned[(owned.indexOf(this.weapon) + 1) % owned.length];
    Save.update(d => { d.weapons.equipped = this.weapon; });
    Sound.play('switch');
    const W = WEAPONS[this.weapon];
    const t = this.add.text(this.player.x, this.player.y - 50, `${W.icon} ${W.name}`, {
      fontFamily: 'Fredoka, Arial', fontSize: '18px', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
    this.refreshHud();
  }

  updateBullets() {
    this.bullets.getChildren().slice().forEach(b => {
      if (this.now - b.getData('born') > 1100) b.destroy();
    });
  }

  bulletHitsEnemy(b, enemy) {
    if (!b.active || enemy.getData('dead') || b.getData('hit').has(enemy)) return;
    b.getData('hit').add(enemy);
    this.damageEnemy(enemy, b.getData('dmg'));
    if (b.getData('pierce') > 0) b.setData('pierce', b.getData('pierce') - 1);
    else b.destroy();
  }

  damageEnemy(enemy, dmg) {
    const hp = enemy.getData('hp') - dmg;
    enemy.setData('hp', hp);
    if (hp <= 0) { this.killEnemy(enemy); return; }
    Sound.play('hit');
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(90, () => enemy.active && enemy.clearTint());
  }

  // ---------- Inimigos: comportamento ----------
  updateEnemies(time) {
    this.threads.clear();
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.getData('dead')) return;
      const type = e.getData('type');
      if (type === 'crab' || type === 'beetle') {
        let d = e.getData('dir');
        if (e.x < e.getData('min') || e.body.blocked.left) d = 1;
        if (e.x > e.getData('max') || e.body.blocked.right) d = -1;
        e.setData('dir', d);
        e.setVelocityX(d * e.getData('speed'));
        if (type === 'beetle') e.setFlipX(d > 0);
      } else if (type === 'bat') {
        let d = e.getData('dir');
        if (e.x < e.getData('min')) d = 1;
        if (e.x > e.getData('max')) d = -1;
        e.setData('dir', d);
        e.setVelocityX(d * e.getData('speed'));
        e.y = e.getData('baseY') + Math.sin(time / 380 + e.getData('phase')) * 45;
      } else if (type === 'spider') {
        const top = e.getData('top'), bottom = e.getData('bottom');
        const k = 0.5 - 0.5 * Math.cos(time / 900 + e.getData('phase'));
        e.y = top + (bottom - top) * k;
        this.threads.lineStyle(2, 0xeeeeee, 0.8);
        this.threads.lineBetween(e.x, 0, e.x, e.y - 8);
      } else if (type === 'monkey') {
        this.updateMonkey(e, time);
      }
      if (e.y > 650) e.destroy();
    });
  }

  updateMonkey(m, time) {
    const dx = this.player.x - m.x;
    m.setFlipX(dx < 0);
    if (Math.abs(dx) > 520 || time < m.getData('nextThrow')) return;
    m.setData('nextThrow', time + 2600);
    m.setTexture('monkey2');
    this.time.delayedCall(350, () => m.active && !m.getData('dead') && m.setTexture('monkey1'));
    this.throwCoconut(m.x, m.y - 22, this.player.x, 0.85);
  }

  // joga um coco em arco na direção do alvo
  throwCoconut(x, y, targetX, flight, extraVy = 0) {
    const c = this.hazards.create(x, y, 'coconut').setDepth(7);
    c.body.setAllowGravity(true);
    c.body.setCircle(8, 2, 2);
    c.setData('breaks', true);
    c.setVelocity(Phaser.Math.Clamp((targetX - x) / flight, -480, 480), -560 + extraVy);
    c.setAngularVelocity(300);
    Sound.play('throw');
    this.time.delayedCall(5000, () => c.active && c.destroy());
  }

  popHazard(h) {
    if (!h.active) return;
    this.particles.explode(6, h.x, h.y);
    Sound.play(h.texture.key === 'bubble' ? 'bubble' : 'stomp');
    h.destroy();
  }

  updateMovers() {
    const pb = this.player.body;
    this.movers.getChildren().forEach(m => {
      const axis = m.getData('axis'), speed = m.getData('speed');
      // o robô em cima do tronco anda junto com ele
      const lastX = m.getData('lastX') ?? m.x;
      const standing = Math.abs(pb.bottom - m.body.top) < 6 && pb.right > m.body.left && pb.left < m.body.right;
      if (standing) this.player.x += m.x - lastX;
      m.setData('lastX', m.x);
      if (axis === 'x') {
        if (m.x >= m.getData('max')) m.setVelocityX(-speed);
        else if (m.x <= m.getData('min')) m.setVelocityX(speed);
      } else {
        if (m.y <= m.getData('min')) m.setVelocityY(speed);
        else if (m.y >= m.getData('max')) m.setVelocityY(-speed);
      }
    });
  }

  bounceMushroom(m) {
    const p = this.player;
    if (!(p.body.touching.down || p.body.blocked.down) || p.body.bottom > m.body.top + 6) return;
    p.setVelocityY(-MUSHROOM_JUMP);
    this.jumpHeld = false;
    this.lastGround = -1000;
    Sound.play('boing');
    this.tweens.add({ targets: m, scaleY: 0.75, scaleX: 1.15, duration: 90, yoyo: true });
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

  refreshHud() { UI.updateHud(this.state, WEAPONS[this.weapon].icon); }

  addScore(n, x, y) {
    this.state.score += n;
    this.refreshHud();
    if (x !== undefined) {
      const t = this.add.text(x, y, `+${n}`, { fontFamily: 'Fredoka, Arial', fontSize: '20px', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 4 })
        .setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    }
  }

  // ---------- Itens e contato com inimigos ----------
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
      this.jumpHeld = this.keys.jump.isDown || Touch.jump;
    } else {
      this.hurt(enemy.x);
    }
  }

  killEnemy(enemy, stomped) {
    if (enemy.getData('dead')) return;
    enemy.setData('dead', true);
    enemy.body.enable = false;
    enemy.anims.stop();
    enemy.clearTint();
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
    Touch.reset();
    this.jumpBuffer = 0;
  }

  ask(q, opts, cb) {
    this.freeze();
    this.state.asked++;
    UI.hideDialog();
    UI.ask(q, opts, correct => {
      if (correct) this.state.right++;
      Review.record(q, correct);
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
    const q = door.getData('sentence') ? makeSentenceQuestion() : makeEnglishQuestion(this.level.id, door.getData('word'));
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
    const B = this.level.boss, cfg = BOSS_TYPES[B.type];
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

    const boss = this.physics.add.sprite(B.x, -120, cfg.tex + '1').setDepth(6);
    boss.body.setSize(cfg.size[0], cfg.size[1]).setOffset(cfg.offset[0], cfg.offset[1]);
    boss.setCollideWorldBounds(true);
    Object.assign(boss, { cfg, hp: B.hp, maxHp: B.hp, state: 'intro', invulnUntil: 0, nextAction: 0, lastAttack: null });
    this.boss = boss;

    this.physics.add.collider(boss, this.solids);
    this.physics.add.overlap(this.player, boss, () => this.touchBoss());
    this.physics.add.overlap(this.bullets, boss, (a, b) => {
      // o Phaser pode passar os objetos em qualquer ordem
      (a === boss ? b : a).destroy();
      this.hitBoss();
    });

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
      if (time > boss.nextAction) this.bossWalk(1500);
      return;
    }

    // segurança: nunca deixa o chefão atravessar o chão
    if (boss.body.bottom > GROUND_Y + 30) { boss.y -= boss.body.bottom - GROUND_Y; boss.setVelocityY(0); }

    const toPlayer = p.x < boss.x ? -1 : 1;
    const anger = boss.maxHp - boss.hp; // fica mais rápido e bravo a cada acerto
    if (boss.state === 'walk') {
      boss.setVelocityX(toPlayer * (boss.cfg.speed + anger * 25));
      if (time > boss.nextAction) this.bossAttack(anger);
    } else if (boss.state === 'air') {
      if (onGround && boss.body.velocity.y >= 0 && time > boss.airSince + 250) {
        const land = boss.onLand;
        boss.onLand = null;
        this.cameras.main.shake(200, 0.008);
        Sound.play('stomp');
        this.particles.explode(14, boss.x, GROUND_Y - 4);
        this.bossWalk(1800 - anger * 250);
        if (land) land();
      }
    } else if (boss.state === 'charge') {
      const hitWall = boss.body.blocked.left || boss.body.blocked.right;
      if (hitWall || time > boss.chargeUntil) {
        if (hitWall) { this.cameras.main.shake(250, 0.012); Sound.play('stomp'); }
        this.bossWalk(1600 - anger * 200);
      }
    }
    // pisca enquanto está invencível
    boss.setAlpha(time < boss.invulnUntil ? (Math.floor(time / 100) % 2 ? 0.5 : 1) : 1);
  }

  bossWalk(delay) {
    const boss = this.boss;
    boss.state = 'walk';
    boss.clearTint();
    boss.play(boss.cfg.tex + 'walk', true);
    boss.nextAction = this.now + delay;
  }

  bossJump(vx, vy, onLand) {
    const boss = this.boss;
    boss.state = 'air';
    boss.airSince = this.now;
    boss.onLand = onLand || null;
    boss.clearTint();
    boss.anims.stop();
    boss.setVelocity(vx, vy);
  }

  // escolhe um ataque (sem repetir o mesmo duas vezes seguidas)
  bossAttack(anger) {
    const boss = this.boss;
    let list = boss.cfg.attacks.filter(a => a !== 'charge' || anger >= 1);
    if (list.length > 1) list = list.filter(a => a !== boss.lastAttack);
    const atk = pick(list);
    boss.lastAttack = atk;
    const dir = this.player.x < boss.x ? -1 : 1;
    const later = (ms, fn) => this.time.delayedCall(ms, () => { if (boss.state !== 'dead' && !this.ended) fn(); });

    if (atk === 'jump') {
      this.bossJump(dir * 180, -620);
    } else if (atk === 'bubbles') {
      boss.state = 'act';
      boss.setVelocityX(0);
      boss.setTint(0xffb74d); // aviso antes de cuspir bolhas
      later(450, () => { boss.clearTint(); this.bossBubbles(1 + (anger > 0 ? 1 : 0)); });
      later(900, () => { if (boss.state === 'act') this.bossWalk(1800 - anger * 250); });
    } else if (atk === 'pound') {
      boss.state = 'act';
      boss.setVelocityX(0);
      boss.setTint(0xffca28);
      later(350, () => this.bossJump(0, -560, () => this.bossShockwaves(anger)));
    } else if (atk === 'throw') {
      boss.state = 'act';
      boss.setVelocityX(0);
      boss.anims.stop();
      boss.setTexture(boss.cfg.tex + '2');
      later(350, () => {
        const n = anger >= 2 ? 3 : 2;
        for (let i = 0; i < n; i++) this.throwCoconut(boss.x + dir * 50, boss.y - 50, this.player.x + (i - 1) * 90, 0.8, -i * 60);
      });
      later(1000, () => { if (boss.state === 'act') this.bossWalk(1700 - anger * 250); });
    } else if (atk === 'charge') {
      boss.state = 'act';
      boss.setVelocityX(0);
      boss.setTint(0xff5252); // aviso: vai correr!
      later(550, () => {
        boss.clearTint();
        boss.state = 'charge';
        boss.chargeUntil = this.now + 1300;
        boss.play(boss.cfg.tex + 'walk', true);
        boss.setVelocityX((this.player.x < boss.x ? -1 : 1) * 400);
      });
    }
  }

  bossBubbles(count) {
    const boss = this.boss;
    Sound.play('bubble');
    const dir = this.player.x < boss.x ? -1 : 1;
    for (let i = 0; i < count; i++) {
      // bolha baixa: pule! / bolha alta: fique no chão!
      const high = i === 1 || (count === 1 && Math.random() < 0.3);
      const b = this.hazards.create(boss.x + dir * 60, high ? GROUND_Y - 95 : GROUND_Y - 22, 'bubble').setDepth(7);
      b.setVelocityX(dir * (high ? 170 : 220));
      b.body.setCircle(11, 2, 2);
      this.time.delayedCall(5000, () => b.active && b.destroy());
    }
  }

  // onda de choque dos dois lados: tem que pular!
  bossShockwaves(anger) {
    const boss = this.boss;
    this.cameras.main.shake(350, 0.015);
    [-1, 1].forEach(d => {
      const w = this.hazards.create(boss.x + d * 50, GROUND_Y - 14, 'shockwave').setDepth(7);
      w.body.setSize(34, 18).setOffset(5, 10);
      w.setVelocityX(d * (240 + anger * 30));
      w.setFlipX(d < 0);
      this.time.delayedCall(4000, () => w.active && w.destroy());
    });
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
    if (this.now < boss.invulnUntil || boss.state === 'dead' || boss.state === 'talk' || boss.state === 'intro' || this.frozen) return;
    boss.invulnUntil = this.now + 99999;
    boss.setVelocityX(0);
    boss.setTintFill(0xffffff);
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
        this.hazards.clear(true, true);
        if (correct) {
          boss.hp--;
          UI.bossBar(this.level.boss.name, boss.hp / boss.maxHp);
          this.addScore(200, boss.x, boss.y - 70);
          Sound.play('bossHit');
          this.cameras.main.shake(250, 0.012);
          boss.setTintFill(0xff5252);
          this.time.delayedCall(200, () => boss.clearTint());
          if (boss.hp <= 0) { this.defeatBoss(); return; }
          this.bossJump(-away * 200, -300);
        } else {
          this.speech('👑 ' + this.level.boss.name, 'Ha ha! Wrong answer! Try again!', 'Rá rá! Resposta errada! Tente de novo!', 2200);
          this.bossWalk(1500);
        }
      });
    });
  }

  defeatBoss() {
    const boss = this.boss;
    boss.state = 'dead';
    boss.anims.stop();
    boss.body.enable = false;
    this.hazards.clear(true, true);
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
    const save = Save.completeLevel(this.level.id, this.state.score, this.state.coins);
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
