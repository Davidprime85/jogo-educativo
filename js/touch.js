// Controles de toque para celular e tablet.
// À esquerda: setas (arrastar o dedo entre ◀ e ▶ funciona). À direita: pular e atirar.
const Touch = {
  left: false,
  right: false,
  jump: false,
  shoot: false,
  pressed: { jump: false, shoot: false },
  enabled: false,

  isTouchDevice() {
    return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  },

  init() {
    if (this.isTouchDevice()) this.enable();
    // se o primeiro toque acontecer num aparelho não detectado, liga mesmo assim
    window.addEventListener('touchstart', () => this.enable(), { once: true, passive: true });

    this.bindPad($('touch-pad'));
    this.bindButton($('touch-jump'), 'jump');
    this.bindButton($('touch-shoot'), 'shoot');
  },

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    document.body.classList.add('touch');
  },

  // Lê se o botão foi apertado agora (uma vez por toque), como o JustDown do teclado
  consume(name) {
    const v = this.pressed[name];
    this.pressed[name] = false;
    return v;
  },

  reset() {
    this.left = this.right = this.jump = this.shoot = false;
    this.pressed.jump = this.pressed.shoot = false;
    document.querySelectorAll('.touch-btn, .pad-half').forEach(el => el.classList.remove('active'));
  },

  bindButton(el, name) {
    const down = e => {
      e.preventDefault();
      Sound.resume();
      this[name] = true;
      this.pressed[name] = true;
      el.classList.add('active');
    };
    const up = e => {
      e.preventDefault();
      this[name] = false;
      el.classList.remove('active');
    };
    el.addEventListener('pointerdown', down);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => el.addEventListener(t, up));
  },

  bindPad(pad) {
    const halves = pad.querySelectorAll('.pad-half');
    const pointers = new Map(); // dedo -> lado (-1 ou 1)
    const update = () => {
      const sides = [...pointers.values()];
      this.left = sides.includes(-1);
      this.right = sides.includes(1);
      halves[0].classList.toggle('active', this.left);
      halves[1].classList.toggle('active', this.right);
    };
    const sideOf = e => {
      const r = pad.getBoundingClientRect();
      return e.clientX < r.left + r.width / 2 ? -1 : 1;
    };
    pad.addEventListener('pointerdown', e => {
      e.preventDefault();
      Sound.resume();
      try { pad.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      pointers.set(e.pointerId, sideOf(e));
      update();
    });
    pad.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, sideOf(e));
      update();
    });
    const end = e => { pointers.delete(e.pointerId); update(); };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
  }
};

// Tela cheia e modo paisagem (funciona no Android; no iPhone use "Adicionar à Tela de Início")
function goFullscreen() {
  if (!Touch.enabled || document.fullscreenElement) return;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el, { navigationUI: 'hide' });
    if (p && p.then) {
      p.then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}))
       .catch(() => {});
    }
  } catch (e) { /* navegador não suporta */ }
}
