// Interface em HTML por cima do jogo: placar, falas, perguntas e telas.
const $ = id => document.getElementById(id);

const UI = {
  modalOpen: false,
  modalKeyHandler: null,

  init() {
    const save = Save.load();
    Sound.muted = save.muted;
    this.setTranslate(save.translate);
    this.updateSoundBtn();

    $('btn-translate').onclick = () => this.toggleTranslate();
    document.querySelectorAll('.translate-inline').forEach(b => b.onclick = () => this.toggleTranslate());
    $('btn-sound').onclick = () => this.toggleSound();

    window.addEventListener('keydown', e => {
      Sound.resume();
      if (e.code === 'KeyT') this.toggleTranslate();
      if (e.code === 'KeyM') this.toggleSound();
      if (this.modalOpen && this.modalKeyHandler) this.modalKeyHandler(e);
    });
    window.addEventListener('pointerdown', () => Sound.resume());

    // escala o palco para caber na janela
    const fit = () => {
      const s = Math.min(window.innerWidth / 960, window.innerHeight / 540);
      $('stage').style.transform = `translate(-50%, -50%) scale(${s})`;
    };
    window.addEventListener('resize', fit);
    fit();
  },

  // ---------- Tradução ----------
  setTranslate(on) {
    document.body.classList.toggle('translate-on', on);
  },
  toggleTranslate() {
    const on = !document.body.classList.contains('translate-on');
    this.setTranslate(on);
    Save.update(d => { d.translate = on; });
    Sound.play('click');
  },

  toggleSound() {
    Sound.muted = !Sound.muted;
    Save.update(d => { d.muted = Sound.muted; });
    this.updateSoundBtn();
  },
  updateSoundBtn() { $('btn-sound').textContent = Sound.muted ? '🔇' : '🔊'; },

  // ---------- Telas ----------
  show(id) { $(id).classList.remove('hidden'); },
  hide(id) { $(id).classList.add('hidden'); },
  hideScreens() { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); },

  // ---------- Placar ----------
  updateHud(s) {
    $('hud-lives').innerHTML = '❤'.repeat(Math.max(0, s.lives)) || '–';
    $('hud-ammo').textContent = s.ammo;
    $('hud-coins').textContent = s.coins;
    $('hud-score').textContent = s.score;
  },
  setLevelName(level) {
    $('hud-level').innerHTML = `Level ${level.id}: ${level.name}<span class="pt">${level.namePt}</span>`;
  },

  bossBar(name, frac) {
    if (name === null) { this.hide('boss-bar'); return; }
    this.show('boss-bar');
    $('boss-name').textContent = name;
    $('boss-hp-fill').style.width = `${Math.max(0, frac) * 100}%`;
  },

  // ---------- Falas e placas ----------
  dialogOwner: null,
  showDialog(who, en, pt, owner) {
    $('dialog-who').textContent = who || '';
    $('dialog-en').textContent = en;
    $('dialog-pt').textContent = pt;
    this.dialogOwner = owner || null;
    this.show('dialog');
  },
  hideDialog(owner) {
    if (owner && this.dialogOwner !== owner) return;
    this.dialogOwner = null;
    this.hide('dialog');
  },

  // ---------- Perguntas ----------
  // q: pergunta (de questions.js); opts: { title, rewardText }; onDone(acertou)
  ask(q, opts, onDone) {
    this.modalOpen = true;
    this.currentQ = q;
    const openedAt = performance.now();
    $('q-title').innerHTML = opts.title;
    $('q-text').innerHTML = q.text;
    $('q-text-pt').innerHTML = q.textPt;
    $('q-feedback').classList.add('hidden');
    $('q-visual').innerHTML = '';

    const pic = $('q-picture');
    if (q.picture) { pic.classList.remove('hidden'); drawPicture(pic, q.picture); }
    else pic.classList.add('hidden');

    const box = $('q-options');
    box.innerHTML = '';
    const buttons = q.options.map((o, i) => {
      const b = document.createElement('button');
      b.className = 'opt-btn';
      b.innerHTML = `<span class="key">${i + 1}</span>${o.label}`;
      b.onclick = () => choose(i);
      box.appendChild(b);
      return b;
    });

    let answered = false, correct = false;
    const choose = (i) => {
      if (answered) return;
      answered = true;
      const chosen = q.options[i].value;
      correct = chosen === q.answer;
      buttons.forEach((b, j) => {
        b.disabled = true;
        if (q.options[j].value === q.answer) b.classList.add('right');
        else if (j === i) b.classList.add('wrong');
      });
      const res = $('q-result');
      const answerLabel = q.options.find(o => o.value === q.answer).label;
      if (correct) {
        Sound.play('correct');
        res.className = 'good';
        res.innerHTML = pick(['Great job!', 'Correct!', 'Well done!', 'Awesome!']) + (opts.rewardText ? ` ${opts.rewardText}` : '');
        $('q-result-pt').innerHTML = 'Muito bem! Você acertou!' + (opts.rewardTextPt ? ` ${opts.rewardTextPt}` : '');
      } else {
        Sound.play('wrong');
        res.className = 'bad';
        res.innerHTML = `Oops! The answer is ${answerLabel}.`;
        $('q-result-pt').innerHTML = `Ops! A resposta certa é ${answerLabel}.`;
      }
      $('q-explain').innerHTML = q.explainFor ? q.explainFor(chosen) : (correct ? '' : q.explain);
      if (q.visual && q.visual.bars && (!correct || q.kind === 'math')) this.drawBars(q.visual.bars);
      $('q-feedback').classList.remove('hidden');
    };

    const finish = () => {
      if (!answered) return;
      this.modalOpen = false;
      this.modalKeyHandler = null;
      this.hide('modal');
      onDone(correct);
    };
    $('q-ok').onclick = finish;

    this.modalKeyHandler = (e) => {
      if (performance.now() - openedAt < 300) return; // evita resposta sem querer
      const n = parseInt(e.key, 10);
      if (!answered && n >= 1 && n <= q.options.length) choose(n - 1);
      else if (answered && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) finish();
      e.preventDefault();
    };
    this.show('modal');
  },

  // Barrinhas de fração para ajudar a "ver" a conta
  drawBars(bars) {
    $('q-visual').innerHTML = bars.map(([n, d]) => {
      const cells = Array.from({ length: d }, (_, i) => `<span class="${i < n ? 'on' : ''}"></span>`).join('');
      return `<div class="bar-row"><div class="bar">${cells}</div>${frac(n, d)}</div>`;
    }).join('');
  }
};
