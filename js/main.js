// Controla as telas e inicia o Phaser.
const Game = {
  phaser: null,
  currentLevel: 1,

  start() {
    UI.init();
    Touch.init();
    Speech.init();
    this.phaser = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: 960,
      height: 540,
      backgroundColor: '#4fc3f7',
      fps: { smoothStep: false },
      physics: { default: 'arcade', arcade: { gravity: { y: 1500 }, debug: false } },
      scene: [TitleScene, LevelScene]
    });
    this.bindButtons();
    this.showTitle();
  },

  bindButtons() {
    const click = (id, fn) => { $(id).onclick = () => { Sound.resume(); Sound.play('click'); fn(); }; };
    click('btn-play', () => this.playLevel(1));
    click('btn-continue', () => this.playLevel(Save.load().unlocked));
    click('btn-help', () => UI.show('screen-help'));
    click('btn-help-close', () => UI.hide('screen-help'));
    click('btn-pause', () => this.togglePause());
    click('btn-resume', () => this.togglePause());
    click('btn-quit', () => this.showTitle());
    click('btn-retry', () => this.playLevel(this.currentLevel));
    click('btn-go-menu', () => this.showTitle());
    click('btn-again', () => this.playLevel(this.currentLevel));
    click('btn-complete-menu', () => this.showTitle());
    click('btn-victory-menu', () => this.showTitle());
    click('btn-next', () => this.playLevel(this.currentLevel + 1));
    click('btn-shop', () => this.openShop());
    click('btn-complete-shop', () => this.openShop());
    click('btn-shop-close', () => { UI.hide('screen-shop'); if (!$('screen-title').classList.contains('hidden')) this.showTitle(); });

    // trocou de app ou de aba no celular: pausa o jogo
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.phaser.scene.isActive('Level') && !UI.modalOpen) this.togglePause();
    });

    window.addEventListener('keydown', e => {
      if ((e.code === 'KeyP' || e.code === 'Escape') && !UI.modalOpen) this.togglePause();
      // Enter no menu inicial começa o jogo
      const titleOnly = !$('screen-title').classList.contains('hidden') && $('screen-help').classList.contains('hidden')
        && $('screen-shop').classList.contains('hidden') && !UI.modalOpen;
      if (e.code === 'Enter' && titleOnly) {
        const save = Save.load();
        this.playLevel(save.unlocked > 1 && LEVELS[save.unlocked - 1].ready ? save.unlocked : 1);
      }
    });
  },

  showTitle() {
    const sm = this.phaser.scene;
    if (this.phaser.isBooted) {
      if (sm.isActive('Level') || sm.isPaused('Level')) sm.stop('Level');
      if (!sm.isActive('Title')) sm.start('Title');
    }
    UI.hideScreens();
    UI.hide('hud');
    UI.hide('touch-controls');
    UI.hide('modal');
    UI.hideDialog();
    UI.bossBar(null);

    const save = Save.load();
    $('btn-continue').classList.toggle('hidden', !(save.unlocked > 1 && LEVELS[save.unlocked - 1].ready));
    $('title-levels').innerHTML = LEVELS.map(l => {
      const locked = l.id > save.unlocked || !l.ready;
      const best = save.best[l.id] ? `⭐ ${save.best[l.id]}` : (l.ready ? '' : 'soon');
      return `<button data-level="${l.id}" ${locked ? 'disabled' : ''}><b>${locked ? '🔒' : l.id}</b>${l.name}<br><small>${best}</small></button>`;
    }).join('');
    $('title-levels').querySelectorAll('button').forEach(b => {
      b.onclick = () => { Sound.resume(); Sound.play('click'); this.playLevel(+b.dataset.level); };
    });
    $('title-save').textContent = save.totalScore > 0
      ? `Saved progress: ${save.totalScore} points · Map pieces: ${save.mapPieces}/5 · 🪙 ${save.wallet}`
      : '';
    UI.show('screen-title');
  },

  playLevel(n) {
    const level = LEVELS[n - 1];
    if (!level || !level.ready) return;
    this.currentLevel = n;
    goFullscreen();
    UI.hideScreens();
    UI.hide('modal');
    const sm = this.phaser.scene;
    sm.stop('Title');
    sm.stop('Level');
    sm.start('Level', { level: n });
  },

  togglePause() {
    const sm = this.phaser.scene;
    if (sm.isActive('Level')) {
      const scene = sm.getScene('Level');
      if (scene.ended) return;
      sm.pause('Level');
      UI.show('screen-pause');
    } else if (sm.isPaused('Level')) {
      sm.resume('Level');
      sm.getScene('Level').input.keyboard.resetKeys();
      Touch.reset();
      UI.hide('screen-pause');
    }
  },

  // ---------- Oficina ----------
  shopRetry: {},

  openShop() {
    this.renderShop();
    UI.show('screen-shop');
  },

  renderShop() {
    const save = Save.load();
    $('shop-wallet').textContent = save.wallet;
    const box = $('shop-items');
    box.innerHTML = '';
    SHOP_ITEMS.filter(it => !it.soon || it.unlock <= save.unlocked + 1).forEach(it => {
      const locked = it.unlock > save.unlocked;
      const lvl = it.soon || locked ? 0 : it.level(save);
      const next = locked ? null : shopNextLevel(it, save);
      const price = next ? it.prices[next] : 0;
      let action;
      if (it.soon || locked) action = `<span class="shop-lock">🔒 Island ${it.unlock}</span>`;
      else if (!next) action = `<span class="shop-max">MAX ✔</span>`;
      else if (save.wallet < price) action = `<button class="shop-buy" disabled>🪙 ${price}</button><small class="shop-need">Need ${price - save.wallet} more</small>`;
      else action = `<button class="shop-buy">${lvl === 0 ? 'Buy' : 'Upgrade'} 🪙 ${price}</button>`;
      const stars = it.soon || locked ? '' : [1, 2, 3].map(n => n <= lvl ? '★' : '☆').join('');
      const card = document.createElement('div');
      card.className = 'shop-item' + (it.soon || locked ? ' locked' : '');
      card.innerHTML = `
        <div class="shop-icon">${it.icon}</div>
        <div class="shop-info">
          <b>${it.name}</b> <span class="shop-stars">${stars}</span>
          <span class="pt">${it.namePt}</span>
          <small>${it.desc || 'Coming soon!'}</small>
          <small class="pt">${it.descPt || 'Em breve!'}</small>
        </div>
        <div class="shop-action">${action}</div>`;
      const btn = card.querySelector('.shop-buy:not([disabled])');
      if (btn) btn.onclick = () => { Sound.play('click'); this.buy(it, price); };
      box.appendChild(card);
    });
  },

  // toda compra pede uma conta: primeiro o troco; se errar, outra conta da fase
  buy(item, price) {
    const save = Save.load();
    const q = this.shopRetry[item.id] ? makeMathQuestion(save.unlocked) : makeShopQuestion(save.wallet, price);
    UI.ask(q, { title: '🔧 Workshop', rewardText: `You got: ${item.name}!`, rewardTextPt: `Você ganhou: ${item.namePt}!` }, correct => {
      Review.record(q, correct);
      if (correct) {
        Save.update(d => { d.wallet -= price; item.apply(d); });
        delete this.shopRetry[item.id];
        Sound.play('buy');
      } else {
        this.shopRetry[item.id] = true;
      }
      this.renderShop();
    });
  },

  showGameOver() {
    UI.show('screen-gameover');
  },

  showLevelComplete(level, state, save) {
    const next = LEVELS[level.id];
    $('complete-stats').innerHTML = `
      <p>⭐ Score: <b>${state.score}</b> &nbsp; 🪙 Coins: <b>${state.coins}</b></p>
      <p>🧠 Questions: <b>${state.right}</b> right of <b>${state.asked}</b></p>
      <p>🗺️ Map pieces: <b>${save.mapPieces}/5</b> &nbsp; 🔧 Workshop coins: <b>${save.wallet}</b></p>`;
    if (!next) {
      this.showVictory(state, save);
      return;
    }
    $('btn-next').classList.toggle('hidden', !next.ready);
    $('complete-next').textContent = next.ready ? `Next island: ${next.name}!` : `Next island: ${next.name} — coming soon!`;
    $('complete-next-pt').textContent = next.ready ? `Próxima ilha: ${next.namePt}!` : `Próxima ilha: ${next.namePt} — em breve!`;
    UI.show('screen-complete');
  },

  showVictory(state, save) {
    $('victory-stats').innerHTML = `<p>Total score: <b>${save.totalScore}</b></p><p class="pt">Pontuação total: ${save.totalScore}</p>`;
    drawTreasure($('treasure-canvas'));
    UI.show('screen-victory');
  }
};

// Desenho do tesouro na tela de vitória
function drawTreasure(canvas) {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, 320, 200);
  c.fillStyle = '#ffe082';
  c.beginPath(); c.ellipse(160, 175, 140, 22, 0, 0, Math.PI * 2); c.fill();
  // moedas
  for (let i = 0; i < 40; i++) {
    c.fillStyle = i % 3 ? '#ffd600' : '#ffb300';
    c.beginPath(); c.arc(40 + (i * 37) % 240, 150 + (i * 13) % 30, 10, 0, Math.PI * 2); c.fill();
  }
  // baú
  c.fillStyle = '#6d4c41'; c.fillRect(90, 90, 140, 70);
  c.fillStyle = '#ffb300'; c.fillRect(90, 105, 140, 8); c.fillRect(150, 90, 20, 70);
  c.fillStyle = '#4e342e'; c.fillRect(90, 50, 140, 30);
  // joias saindo do baú
  [['#e53935', 120, 86], ['#43a047', 160, 80], ['#1e88e5', 200, 86], ['#ffd600', 140, 78], ['#ab47bc', 182, 76]].forEach(([col, x, y]) => {
    c.fillStyle = col; c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2); c.fill();
  });
  // brilhos
  c.fillStyle = '#fff';
  [[70, 40], [250, 30], [280, 90], [40, 100]].forEach(([x, y]) => { c.fillRect(x - 1, y - 8, 2, 16); c.fillRect(x - 8, y - 1, 16, 2); });
}

window.addEventListener('load', () => Game.start());
