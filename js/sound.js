// Sons simples gerados na hora com Web Audio (sem arquivos de áudio).
const Sound = {
  ctx: null,
  muted: false,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) this.ctx = new AC();
  },

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  // Toca uma sequência de notas: [freq, duração, atraso]
  tone(freq, dur, opts = {}) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime + (opts.delay || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = opts.type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur);
    const vol = opts.vol || 0.12;
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  noise(dur, vol = 0.15) {
    if (this.muted || !this.ctx) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.buffer = buf;
    src.connect(gain).connect(this.ctx.destination);
    src.start();
  },

  play(name) {
    switch (name) {
      case 'jump':    this.tone(320, 0.15, { slide: 640, type: 'square', vol: 0.08 }); break;
      case 'coin':    this.tone(988, 0.07, { vol: 0.08 }); this.tone(1319, 0.15, { delay: 0.07, vol: 0.08 }); break;
      case 'shoot':   this.tone(880, 0.1, { slide: 220, type: 'sawtooth', vol: 0.06 }); break;
      case 'stomp':   this.tone(200, 0.12, { slide: 80, vol: 0.12 }); break;
      case 'enemy':   this.noise(0.15, 0.12); this.tone(400, 0.15, { slide: 100, vol: 0.06 }); break;
      case 'hurt':    this.tone(300, 0.3, { slide: 90, type: 'sawtooth', vol: 0.12 }); break;
      case 'open':    [523, 659, 784].forEach((f, i) => this.tone(f, 0.12, { delay: i * 0.08, type: 'triangle', vol: 0.15 })); break;
      case 'correct': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.15, { delay: i * 0.09, type: 'triangle', vol: 0.16 })); break;
      case 'wrong':   this.tone(330, 0.2, { type: 'triangle', vol: 0.16 }); this.tone(220, 0.35, { delay: 0.18, type: 'triangle', vol: 0.16 }); break;
      case 'powerup': [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.1, { delay: i * 0.06, vol: 0.07 })); break;
      case 'boss':    this.tone(110, 0.5, { slide: 70, type: 'sawtooth', vol: 0.15 }); this.noise(0.4, 0.1); break;
      case 'bossHit': this.noise(0.25, 0.18); this.tone(180, 0.3, { slide: 60, type: 'square', vol: 0.12 }); break;
      case 'bubble':  this.tone(500, 0.12, { slide: 900, type: 'sine', vol: 0.1 }); break;
      case 'checkpoint': this.tone(660, 0.1, { type: 'triangle' }); this.tone(880, 0.2, { delay: 0.1, type: 'triangle' }); break;
      case 'win':
        [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) =>
          this.tone(f, 0.18, { delay: i * 0.13, type: 'triangle', vol: 0.17 }));
        break;
      case 'click':   this.tone(700, 0.05, { type: 'triangle', vol: 0.08 }); break;
    }
  }
};
